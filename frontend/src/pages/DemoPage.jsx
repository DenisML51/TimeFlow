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
  useTheme,
  alpha,
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
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Генерация синтетических данных:
 *  - Даты: первый день каждого месяца с 2018-01-01 по 2023-12-01
 *  - y_fact: линейный тренд + сезонность (синус) + случайный шум
 */
const generateSyntheticData = () => {
  const data = [];
  const startYear = 2018;
  const endYear = 2024;
  let index = 0;
  for (let year = startYear; year < endYear; year++) {
    for (let month = 0; month < 12; month++) {
      const currentDate = new Date(year, month, 1);
      const dateStr = currentDate.toISOString().split("T")[0];
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
  const theme = useTheme();
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
  const [forecastResults, setForecastResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Переключение вкладок: 0 = All, 1 = Train, 2 = Test, 3 = Horizon
  const [commonTab, setCommonTab] = useState(0);

  console.log("Synthetic data (first 5 rows):", syntheticData.slice(0, 5));
  console.log("Synthetic data (last 5 rows):", syntheticData.slice(-5));

  // Функция запроса для одной модели
  const requestForecast = async (modelName, uniqueParams) => {
    const sortedData = [...syntheticData]
      .map((item) => ({ ...item, y_fact: Number(item.y_fact) }))
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
      const resp = await axios.post(
        "http://localhost:8000/api/forecast_demo",
        payload,
        { withCredentials: true }
      );
      console.log(`Response for ${modelName}:`, resp.data);
      const { forecast_all, forecast_train, forecast_test, forecast_horizon } =
        resp.data;
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

  // Формирование данных для графика
  const combinedChartData = useMemo(() => {
    if (forecastResults.length === 0) {
      return {
        labels: syntheticData.map((d) => d.ds),
        datasets: [
          {
            label: "Факт (локальный)",
            data: syntheticData.map((d) => Number(d.y_fact)),
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.primary.main,
            borderWidth: 2,
            pointRadius: 2,
            fill: false,
          },
        ],
      };
    }

    const allDatesSet = new Set(syntheticData.map((d) => d.ds));
    forecastResults.forEach((modelRes) => {
      let segment = [];
      if (commonTab === 0) segment = modelRes.forecastAll;
      else if (commonTab === 1) segment = modelRes.forecastTrain;
      else if (commonTab === 2) segment = modelRes.forecastTest;
      else if (commonTab === 3) segment = modelRes.forecastHorizon;
      segment.forEach((row) => allDatesSet.add(row.ds));
    });
    const labels = Array.from(allDatesSet).sort(
      (a, b) => new Date(a) - new Date(b)
    );

    const localFactMap = new Map(
      syntheticData.map((d) => [d.ds, d.y_fact])
    );
    const datasets = [
      {
        label: "Факт (локальный)",
        data: labels.map((ds) =>
          localFactMap.has(ds) ? localFactMap.get(ds) : null
        ),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.main,
        borderWidth: 2,
        pointRadius: 2,
        fill: false,
      },
    ];

    // Используем цвета из темы для моделей
    const modelColorMap = {
      Prophet: theme.palette.info?.main || "#36A2EB",
      XGBoost: theme.palette.error.main,
      SARIMA: theme.palette.success?.main || "#f8fd68",
    };

    forecastResults.forEach((modelRes) => {
      let segment = [];
      if (commonTab === 0) segment = modelRes.forecastAll;
      else if (commonTab === 1) segment = modelRes.forecastTrain;
      else if (commonTab === 2) segment = modelRes.forecastTest;
      else if (commonTab === 3) segment = modelRes.forecastHorizon;

      if (!segment.length) return;
      const color = modelColorMap[modelRes.modelName] || theme.palette.info.main;

      const factMap = new Map();
      const forecastMap = new Map();
      segment.forEach((row) => {
        if (row.y_fact !== undefined) factMap.set(row.ds, row.y_fact);
        if (row.y_forecast !== undefined) forecastMap.set(row.ds, row.y_forecast);
      });

      if (factMap.size > 0) {
        datasets.push({
          label: `Факт (${modelRes.modelName})`,
          data: labels.map((ds) =>
            factMap.has(ds) ? factMap.get(ds) : null
          ),
          borderColor: alpha(theme.palette.text.primary, 0.7),
          backgroundColor: alpha(theme.palette.text.primary, 0.7),
          borderWidth: 2,
          pointRadius: 2,
          fill: false,
        });
      }

      datasets.push({
        label: `Прогноз (${modelRes.modelName})`,
        data: labels.map((ds) =>
          forecastMap.has(ds) ? forecastMap.get(ds) : null
        ),
        borderColor: color,
        backgroundColor: "transparent",
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 2,
        fill: false,
      });
    });

    return { labels, datasets };
  }, [forecastResults, syntheticData, commonTab, theme]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: theme.palette.text.primary } },
      },
      scales: {
        x: {
          ticks: {
            color: theme.palette.text.primary,
            callback: function (value) {
              const label = this.getLabelForValue(value);
              return label ? label.slice(0, 10) : "";
            },
          },
          grid: { color: alpha(theme.palette.text.primary, 0.1) },
        },
        y: {
          ticks: { color: theme.palette.text.primary },
          grid: { color: alpha(theme.palette.text.primary, 0.1) },
        },
      },
    }),
    [theme]
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
      <Canvas
        camera={{ position: [0, 0, 1] }}
        style={{ position: "fixed", top: 0, left: 0 }}
      >
        <ParticleBackground />
      </Canvas>
      <Box sx={{ position: "relative", zIndex: 1, p: 4 }}>
        <Container maxWidth="lg">
          {/* Заголовок */}
          <Box
            sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.secondary} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Демонстрация
            </Typography>
          </Box>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="body1"
              sx={{ color: theme.palette.text.secondary, mb: 2 }}
            >
              Демонстрационная версия сайта с синтетическими данными за 4 года.
              Здесь можно активировать модели и построить прогноз на основе синтетических
              данных.
            </Typography>
          </Box>

          {/* Общие параметры прогноза */}
          <GlassPaperDemo>
            <Typography
              variant="h6"
              sx={{ mb: 2, color: theme.palette.primary.main }}
            >
              Общие параметры прогноза
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography gutterBottom>
                  Горизонт: {horizon} мес.
                </Typography>
                <Slider
                  value={horizon}
                  onChange={(e, val) => setHorizon(val)}
                  min={1}
                  max={24}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{ color: theme.palette.primary.main }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography gutterBottom>
                  History: {historySize} мес.
                </Typography>
                <Slider
                  value={historySize}
                  onChange={(e, val) => setHistorySize(val)}
                  min={0}
                  max={24}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{ color: theme.palette.primary.main }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography gutterBottom>Частота</Typography>
                <Select
                  value={freq}
                  onChange={(e) => setFreq(e.target.value)}
                  sx={{

                    color: theme.palette.text.primary,
                  }}
                >
                  <MenuItem value="ME">Конец месяца</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Typography gutterBottom>
                  Уровень доверия: {confidenceLevel}%
                </Typography>
                <Slider
                  value={confidenceLevel}
                  onChange={(e, val) => setConfidenceLevel(val)}
                  min={80}
                  max={99}
                  step={1}
                  valueLabelDisplay="auto"
                  sx={{ color: theme.palette.primary.main }}
                />
              </Grid>
            </Grid>
          </GlassPaperDemo>

          {/* Модели прогнозирования */}
          <Box sx={{ mt: 4 }}>
            <GlassPaperDemo>
              <Typography
                variant="h6"
                sx={{ mb: 2, color: theme.palette.primary.main }}
              >
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
                    borderColor: theme.palette.primary.main,
                    color: prophetActive
                      ? theme.palette.common.white
                      : theme.palette.primary.main,
                    background: prophetActive
                      ? theme.palette.primary.main
                      : "transparent",
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
                    borderColor: theme.palette.primary.main,
                    color: xgboostActive
                      ? theme.palette.common.white
                      : theme.palette.primary.main,
                    background: xgboostActive
                      ? theme.palette.primary.main
                      : "transparent",
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
                    borderColor: theme.palette.primary.main,
                    color: sarimaActive
                      ? theme.palette.common.white
                      : theme.palette.primary.main,
                    background: sarimaActive
                      ? theme.palette.primary.main
                      : "transparent",
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
              disabled={
                loading ||
                (!prophetActive && !xgboostActive && !sarimaActive)
              }
              sx={{
                px: 8,
                py: 2.5,
                borderRadius: "12px",
                fontSize: "1.1rem",
                fontWeight: 600,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.secondary} 100%)`,
                boxShadow: `0 8px 32px ${alpha(
                  theme.palette.primary.main,
                  0.3
                )}`,
              }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: theme.palette.common.white }} />
              ) : (
                "Построить прогноз"
              )}
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
              <Line data={combinedChartData} options={chartOptions} />
            </Box>
          </GlassPaperDemo>
        </Container>
      </Box>
    </motion.div>
  );
};

const GlassPaperDemo = ({ children, sx }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        background: alpha(theme.palette.background.paper, 0.05),
        borderRadius: "16px",
        border: `1px solid ${alpha(theme.palette.text.primary, 0.1)}`,
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        p: 3,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default Demo;
