// src/pages/Demo.jsx
import React, { useState, useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Slider,
  Select,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import { Line } from "react-chartjs-2";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { ParticleBackground } from "../components/home/ParticleBackground";
import { TbRocket } from "react-icons/tb";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Регистрируем компоненты Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/**
 * Генерация синтетических данных:
 *  - Даты: первый день каждого месяца с 2020-01-01 по 2023-12-01
 *  - y_fact: линейный тренд + сезонность (синус) + случайный шум
 */
const generateSyntheticData = () => {
  const data = [];
  const startYear = 2018;
  const endYear = 2022; // генерируем данные с 2018 по 2021 год (можно изменить по необходимости)
  let index = 0;
  for (let year = startYear; year < endYear; year++) {
    for (let month = 0; month < 12; month++) {
      // Создаем дату первого числа месяца
      const currentDate = new Date(year, month, 1);
      // Форматируем в "YYYY-MM-DD"
      const dateStr = currentDate.toISOString().split("T")[0];
      // Вычисляем значение с линейным трендом, сезонностью (по месяцу) и случайным шумом
      const trend = 100 + index * 2;
      const seasonal = 10 * Math.sin((2 * Math.PI * (month + 1)) / 12);
      const noise = Math.random() * 5;
      data.push({ ds: dateStr, y_fact: trend + seasonal + noise });
      index++;
    }
  }
  return data;
};



const Demo = () => {
  // Локальный факт – синтетические данные
  const syntheticData = useMemo(() => generateSyntheticData(), []);

  // Общие параметры прогноза
  const [horizon, setHorizon] = useState(12);
  const [historySize, setHistorySize] = useState(12);
  const [freq, setFreq] = useState("ME"); // "MS" – начало месяца
  const [confidenceLevel, setConfidenceLevel] = useState(95);

  // Флаги активации моделей
  const [prophetActive, setProphetActive] = useState(false);
  const [xgboostActive, setXgboostActive] = useState(false);
  const [sarimaActive, setSarimaActive] = useState(false);

  // Фиксированные параметры моделей (без детальной настройки)
  const [prophetParams] = useState({ seasonality_mode: "additive" });
  const [xgboostParams] = useState({ max_depth: 6, learning_rate: 0.1 });
  const [sarimaParams] = useState({ p: 1, d: 1, q: 1, s: 12 });

  // Результаты, полученные от бэкенда
  // Каждый элемент: { modelName, forecastAll, forecastTrain, forecastTest, forecastHorizon }
  const [forecastResults, setForecastResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Переключение вкладок: 0 = All, 1 = Train, 2 = Test, 3 = Horizon
  const [commonTab, setCommonTab] = useState(0);

  // Для отладки: выводим в консоль первые и последние строки синтетических данных
  console.log("Synthetic data (first 5 rows):", syntheticData.slice(0, 5));
  console.log("Synthetic data (last 5 rows):", syntheticData.slice(-5));

  // Функция запроса для одной модели
  const requestForecast = async (modelName, uniqueParams) => {
    // Преобразуем каждое значение y_fact в число
    const sortedData = [...syntheticData]
      .map(item => ({ ...item, y_fact: Number(item.y_fact) }))
      .sort((a, b) => new Date(a.ds) - new Date(b.ds));

    const payload = {
      model: modelName,
      uniqueParams,
      horizon,
      history: historySize,
      dt_name: "ds",
      y_name: "y_fact",
      freq,
      confidence_level: confidenceLevel,
      data: sortedData,
    };
    console.log(`Requesting forecast for ${modelName}:`, payload);
    try {
      const resp = await axios.post("http://localhost:8000/api/forecast", payload, {
        withCredentials: true,
      });
      console.log(`Response for ${modelName}:`, resp.data);
      const { forecast_all, forecast_train, forecast_test, forecast_horizon } = resp.data;
      return {
        modelName,
        forecastAll: forecast_all || [],
        forecastTrain: forecast_train || [],
        forecastTest: forecast_test || [],
        forecastHorizon: forecast_horizon || [],
      };
    } catch (error) {
      console.error(`Error forecasting with ${modelName}:`, error);
      return null;
    }
  };


  // Обработчик построения прогноза – для всех активных моделей
  const handleBuildForecast = async () => {
    setLoading(true);
    const promises = [];
    if (prophetActive) promises.push(requestForecast("Prophet", prophetParams));
    if (xgboostActive) promises.push(requestForecast("XGBoost", xgboostParams));
    if (sarimaActive) promises.push(requestForecast("SARIMA", sarimaParams));
    try {
      const results = await Promise.all(promises);
      setForecastResults(results.filter((r) => r !== null));
    } catch (e) {
      console.error("Forecast error:", e);
    }
    setLoading(false);
  };

  /**
   * Формирование общего набора дат и наборов данных для графика.
   * Мы:
   * 1. Собираем все даты из локальных данных (syntheticData) и из выбранного сегмента для каждой модели.
   * 2. Формируем базовую «фактическую» линию из локальных данных.
   * 3. Для каждой модели, если в выбранном сегменте есть данные, добавляем линию прогноза (и, если есть, линию факта от бэкенда).
   */
  const combinedChartData = useMemo(() => {
    // Если прогноз не построен, возвращаем только локальный факт.
    if (forecastResults.length === 0) {
      return {
        labels: syntheticData.map((d) => d.ds),
        datasets: [
          {
            label: "Факт (локальный)",
            data: syntheticData.map((d) => Number(d.y_fact)),
            borderColor: "#14c59a",
            backgroundColor: "#14c59a",
            borderWidth: 2,
            pointRadius: 2,
            fill: false,
          },
        ],
      };
    }

    // Собираем все даты: из локальных данных и из выбранного сегмента каждой модели.
    const allDatesSet = new Set(syntheticData.map((d) => d.ds));
    forecastResults.forEach((modelRes) => {
      let segment = [];
      if (commonTab === 0) segment = modelRes.forecastAll;
      else if (commonTab === 1) segment = modelRes.forecastTrain;
      else if (commonTab === 2) segment = modelRes.forecastTest;
      else if (commonTab === 3) segment = modelRes.forecastHorizon;
      segment.forEach((row) => allDatesSet.add(row.ds));
    });
    const labels = Array.from(allDatesSet).sort((a, b) => new Date(a) - new Date(b));

    // Формируем базовую линию (локальный факт)
    const localFactMap = new Map(syntheticData.map((d) => [d.ds, d.y_fact]));
    const datasets = [
      {
        label: "Факт (локальный)",
        data: labels.map((ds) => (localFactMap.has(ds) ? localFactMap.get(ds) : null)),
        borderColor: "#14c59a",
        backgroundColor: "#14c59a",
        borderWidth: 2,
        pointRadius: 2,
        fill: false,
      },
    ];

    // Добавляем данные для каждой модели
    const modelColorMap = {
      Prophet: "#36A2EB",
      XGBoost: "#ff6382",
      SARIMA: "#f8fd68",
    };

    forecastResults.forEach((modelRes) => {
      let segment = [];
      if (commonTab === 0) segment = modelRes.forecastAll;
      else if (commonTab === 1) segment = modelRes.forecastTrain;
      else if (commonTab === 2) segment = modelRes.forecastTest;
      else if (commonTab === 3) segment = modelRes.forecastHorizon;

      if (!segment.length) return;
      const color = modelColorMap[modelRes.modelName] || "#36A2EB";

      const factMap = new Map();
      const forecastMap = new Map();
      segment.forEach((row) => {
        if (row.y_fact !== undefined) factMap.set(row.ds, row.y_fact);
        if (row.y_forecast !== undefined) forecastMap.set(row.ds, row.y_forecast);
      });

      // Если в сегменте есть фактические данные от бэкенда, добавляем их отдельно
      if (factMap.size > 0) {
        datasets.push({
          label: `Факт (${modelRes.modelName})`,
          data: labels.map((ds) => (factMap.has(ds) ? factMap.get(ds) : null)),
          borderColor: "#e1e1e1",
          backgroundColor: "#e1e1e1",
          borderWidth: 2,
          pointRadius: 2,
          fill: false,
        });
      }

      // Линия прогноза
      datasets.push({
        label: `Прогноз (${modelRes.modelName})`,
        data: labels.map((ds) => (forecastMap.has(ds) ? forecastMap.get(ds) : null)),
        borderColor: color,
        backgroundColor: "transparent",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 2,
        fill: false,
      });
    });

    return { labels, datasets };
  }, [forecastResults, syntheticData, commonTab]);

  // Настройки графика (аналогично полной версии)
  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: "#fff" } } },
      scales: {
        x: {
          ticks: {
            color: "#fff",
            callback: function (value) {
              const label = this.getLabelForValue(value);
              return label ? label.slice(0, 10) : "";
            },
          },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
        y: {
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
      },
    }),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      style={{ position: "relative", minHeight: "100vh" }}
    >
      {/* Фоновая анимация */}
      <Canvas camera={{ position: [0, 0, 1] }} style={{ position: "fixed", top: 0, left: 0 }}>
        <ParticleBackground />
      </Canvas>
      <Box sx={{ position: "relative", zIndex: 1, p: 4 }}>
        <Container maxWidth="lg">
          {/* Заголовок */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(45deg, #10A37F 30%, #00ff88 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Демонстрация
            </Typography>
          </Box>
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" sx={{ color: "text.secondary", mb: 2 }}>
              Синтетические данные (2020–2023) с трендом и сезонностью передаются на бэкенд.
              Если прогноз построен корректно, к локальной кривой (Факт) добавятся линии прогнозов для активированных моделей.
            </Typography>
          </Box>

          {/* Общие параметры прогноза */}
          <GlassPaperDemo>
            <Typography variant="h6" sx={{ mb: 2, color: "#fff" }}>
              Общие параметры прогноза
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography gutterBottom>Горизонт: {horizon} мес.</Typography>
                <Slider
                  value={horizon}
                  onChange={(e, val) => setHorizon(val)}
                  min={1}
                  max={24}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{ color: "#10A37F" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography gutterBottom>History: {historySize} мес.</Typography>
                <Slider
                  value={historySize}
                  onChange={(e, val) => setHistorySize(val)}
                  min={1}
                  max={24}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{ color: "#10A37F" }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography gutterBottom>Частота</Typography>
                <Select
                  value={freq}
                  onChange={(e) => setFreq(e.target.value)}
                  sx={{ backgroundColor: "#2c2c2c", color: "#fff" }}
                >
                  <MenuItem value="ME">Конец месяца</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography gutterBottom>Уровень доверия: {confidenceLevel}%</Typography>
                <Slider
                  value={confidenceLevel}
                  onChange={(e, val) => setConfidenceLevel(val)}
                  min={80}
                  max={99}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{ color: "#10A37F" }}
                />
              </Grid>
            </Grid>
          </GlassPaperDemo>

          {/* Модели прогнозирования */}
          <Box sx={{ mt: 4 }}>
            <GlassPaperDemo>
              <Typography variant="h6" sx={{ mb: 2, color: "#fff" }}>
                Модели прогнозирования
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Button
                  variant={prophetActive ? "contained" : "outlined"}
                  onClick={() => setProphetActive(!prophetActive)}
                  sx={{
                    borderRadius: "12px",
                    px: 3,
                    py: 1,
                    borderColor: "#10A37F",
                    color: prophetActive ? "#fff" : "#10A37F",
                    background: prophetActive ? "#10A37F" : "transparent",
                  }}
                >
                  Prophet
                </Button>
                <Button
                  variant={xgboostActive ? "contained" : "outlined"}
                  onClick={() => setXgboostActive(!xgboostActive)}
                  sx={{
                    borderRadius: "12px",
                    px: 3,
                    py: 1,
                    borderColor: "#10A37F",
                    color: xgboostActive ? "#fff" : "#10A37F",
                    background: xgboostActive ? "#10A37F" : "transparent",
                  }}
                >
                  XGBoost
                </Button>
                <Button
                  variant={sarimaActive ? "contained" : "outlined"}
                  onClick={() => setSarimaActive(!sarimaActive)}
                  sx={{
                    borderRadius: "12px",
                    px: 3,
                    py: 1,
                    borderColor: "#10A37F",
                    color: sarimaActive ? "#fff" : "#10A37F",
                    background: sarimaActive ? "#10A37F" : "transparent",
                  }}
                >
                  SARIMA
                </Button>
              </Box>
            </GlassPaperDemo>
          </Box>

          {/* Кнопка построения прогноза */}
          <Box sx={{ textAlign: "center", my: 4 }}>
            <Button
              variant="contained"
              onClick={handleBuildForecast}
              endIcon={<TbRocket />}
              disabled={loading || (!prophetActive && !xgboostActive && !sarimaActive)}
              sx={{
                px: 8,
                py: 2.5,
                borderRadius: "12px",
                fontSize: "1.1rem",
                fontWeight: 600,
                background: "linear-gradient(135deg, #10A37F 0%, #00FF88 100%)",
                boxShadow: "0 8px 32px rgba(16,163,127,0.3)",
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Построить прогноз"}
            </Button>
          </Box>

          {/* Вкладки для выбора сегмента прогноза */}
          <GlassPaperDemo sx={{ mb: 4 }}>
            <Tabs
              value={commonTab}
              onChange={(e, val) => setCommonTab(val)}
              textColor="inherit"
              indicatorColor="primary"
              sx={{ mb: 2 }}
            >
              <Tab label="All" />
              <Tab label="Train" />
              <Tab label="Test" />
              <Tab label="Horizon" />
            </Tabs>
            <Box sx={{ height: 500 }}>
              <Line
                data={combinedChartData}
                options={chartOptions}
              />
            </Box>
          </GlassPaperDemo>
        </Container>
      </Box>
    </motion.div>
  );
};

const GlassPaperDemo = ({ children, sx }) => (
  <Box
    sx={{
      background: "rgba(255,255,255,0.05)",
      borderRadius: "16px",
      border: "1px solid rgba(255,255,255,0.1)",
      backdropFilter: "blur(12px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      p: 3,
      ...sx,
    }}
  >
    {children}
  </Box>
);

export default Demo;
