import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Slide,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { saveAs } from 'file-saver';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const frequencyOptions = [
  { value: 'MS', label: 'Начало месяца' },
  { value: 'M', label: 'Месяц' },
  { value: 'W-MON', label: 'Неделя (с понедельника)' },
  { value: 'D', label: 'День' },
];

const ForecastPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Попытка получить данные из location.state
  const stateModifiedData = location.state?.modifiedData;
  const stateSelectedColumns = location.state?.selectedColumns;
  const storedModifiedData = sessionStorage.getItem('modifiedData')
    ? JSON.parse(sessionStorage.getItem('modifiedData'))
    : null;
  const storedSelectedColumns = sessionStorage.getItem('selectedColumns')
    ? JSON.parse(sessionStorage.getItem('selectedColumns'))
    : null;
  const modifiedData = stateModifiedData || storedModifiedData;
  const selectedColumns = stateSelectedColumns || storedSelectedColumns;

  // Попытка получить filters из sessionStorage (если использовались на странице фильтрации)
  const storedFilters = sessionStorage.getItem('filters')
    ? JSON.parse(sessionStorage.getItem('filters'))
    : {};

  useEffect(() => {
    if (!modifiedData || modifiedData.length === 0 || !selectedColumns || selectedColumns.length < 2) {
      navigate(-1);
    }
  }, [modifiedData, selectedColumns, navigate]);

  useEffect(() => {
    if (stateModifiedData) {
      sessionStorage.setItem('modifiedData', JSON.stringify(stateModifiedData));
    }
    if (stateSelectedColumns) {
      sessionStorage.setItem('selectedColumns', JSON.stringify(stateSelectedColumns));
    }
  }, [stateModifiedData, stateSelectedColumns]);

  // Автоматическая установка имен столбцов (первый – дата, второй – таргет)
  const dtName = selectedColumns ? selectedColumns[0] : 'ds';
  const yName = selectedColumns ? selectedColumns[1] : 'y';

  // Извлекаем все категориальные признаки из выборки
  const categoricalColumns = modifiedData && modifiedData.length > 0
    ? Object.keys(modifiedData[0]).filter(key => typeof modifiedData[0][key] === 'string')
    : [];

  // Параметры модели, сохраняемые в sessionStorage
  const [model, setModel] = useState(() => sessionStorage.getItem('forecast_model') || 'Prophet');
  const [horizon, setHorizon] = useState(() => Number(sessionStorage.getItem('forecast_horizon')) || 10);
  const [historyParam, setHistoryParam] = useState(() => Number(sessionStorage.getItem('forecast_history')) || 10);
  const [freq, setFreq] = useState(() => sessionStorage.getItem('forecast_freq') || 'D');

  useEffect(() => {
    sessionStorage.setItem('forecast_model', model);
    sessionStorage.setItem('forecast_horizon', horizon);
    sessionStorage.setItem('forecast_history', historyParam);
    sessionStorage.setItem('forecast_freq', freq);
  }, [model, horizon, historyParam, freq]);

  // Результаты прогнозирования
  const [forecastHistory, setForecastHistory] = useState(() =>
    sessionStorage.getItem('forecast_history_result')
      ? JSON.parse(sessionStorage.getItem('forecast_history_result'))
      : []
  );
  const [forecastHorizon, setForecastHorizon] = useState(() =>
    sessionStorage.getItem('forecast_horizon_result')
      ? JSON.parse(sessionStorage.getItem('forecast_horizon_result'))
      : []
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('forecast_history_result', JSON.stringify(forecastHistory));
    sessionStorage.setItem('forecast_horizon_result', JSON.stringify(forecastHorizon));
  }, [forecastHistory, forecastHorizon]);

  // Анимация перехода
  const [slideIn, setSlideIn] = useState(true);
  const handleBack = () => {
    setSlideIn(false);
    setTimeout(() => {
      navigate(-1);
    }, 300);
  };

  // Функция запроса прогноза
  const handleForecast = async () => {
    setLoading(true);
    try {
      const payload = {
        model,
        horizon: Number(horizon),
        history: Number(historyParam),
        dt_name: dtName,
        y_name: yName,
        freq,
        data: modifiedData, // modifiedData уже содержит все столбцы, включая категориальные
      };
      const response = await axios.post('http://localhost:8000/api/forecast', payload, { withCredentials: true });
      const hist = response.data.forecast_history || [];
      const hor = response.data.forecast_horizon || [];
      // Добавляем доверительные интервалы (пример: ±10%)
      const horWithCI = hor.map(item => ({
        ...item,
        y_lower: item.y_forecast * 0.9,
        y_upper: item.y_forecast * 1.1,
      }));
      setForecastHistory(hist);
      setForecastHorizon(horWithCI);
    } catch (error) {
      console.error("Ошибка прогноза:", error);
    } finally {
      setLoading(false);
    }
  };

  // Вычисление метрик (если есть исторические данные)
  const computeMetrics = () => {
    if (!forecastHistory || forecastHistory.length === 0) return null;
    const errors = forecastHistory.map(item => Math.abs(item.y_fact - item.y_forecast));
    const mae = errors.reduce((acc, cur) => acc + cur, 0) / errors.length;
    const rmse = Math.sqrt(
      forecastHistory.reduce((acc, item) => acc + (item.y_fact - item.y_forecast) ** 2, 0) / forecastHistory.length
    );
    const mape =
      forecastHistory.reduce((acc, item) => {
        return item.y_fact !== 0 ? acc + Math.abs((item.y_fact - item.y_forecast) / item.y_fact) : acc;
      }, 0) / forecastHistory.length;
    return { mae, rmse, mape: mape * 100 };
  };

  const metrics = computeMetrics();

  // Данные для графика
  const chartData = {
    labels: forecastHorizon.map(item => item.dt),
    datasets: [
      {
        label: yName,
        data: forecastHorizon.map(item => item.y_forecast),
        fill: false,
        backgroundColor: "#10A37F",
        borderColor: "#10A37F",
        borderWidth: 2,
      },
      {
        label: 'Нижняя граница',
        data: forecastHorizon.map(item => item.y_lower),
        fill: '-1',
        backgroundColor: "rgba(16, 163, 127, 0.3)",
        borderColor: "rgba(16, 163, 127, 0.3)",
        borderDash: [5, 5],
        borderWidth: 1,
      },
      {
        label: 'Верхняя граница',
        data: forecastHorizon.map(item => item.y_upper),
        fill: '-1',
        backgroundColor: "rgba(16, 163, 127, 0.3)",
        borderColor: "rgba(16, 163, 127, 0.3)",
        borderDash: [5, 5],
        borderWidth: 1,
      },
    ],
  };

  // Блок отображения категориальных признаков
  const renderCategoricalChips = () => {
    if (!modifiedData || modifiedData.length === 0) return null;
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
        {categoricalColumns.map((col) => {
          // Если для колонки задан фильтр, выделяем красным, если она выбрана для прогноза – золотым, иначе стандартно
          const isFiltered = storedFilters[col] ? true : false;
          const isSelected = selectedColumns.includes(col);
          return (
            <Chip
              key={col}
              label={col}
              sx={{
                backgroundColor: isSelected ? "#FFD700" : isFiltered ? "rgba(255,99,132,0.6)" : "#10A37F",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "0.9rem",
              }}
            />
          );
        })}
      </Box>
    );
  };

  // Функция для скачивания CSV
  const handleDownloadCSV = () => {
    if (forecastHorizon.length === 0) return;
    const headers = Object.keys(forecastHorizon[0]).join(',') + '\n';
    const rows = forecastHorizon.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'forecast.csv');
  };

  return (
    <Slide direction="left" in={slideIn} mountOnEnter unmountOnExit>
      <Box sx={{ p: 3, backgroundColor: "#121212", minHeight: "100vh", color: "#fff" }}>
        {/* Верхняя панель с кнопкой "Назад" */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Button onClick={handleBack} startIcon={<ArrowBackIcon />} sx={{ color: "#fff" }}>
            Назад
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: "center" }}>
            Прогнозирование
          </Typography>
        </Box>

        {/* Блок с информацией о выбранных столбцах и категориальных признаках */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: "#18181a", borderRadius: "16px", boxShadow: "0 4px 12px rgba(16,163,127,0.5)" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <CalendarTodayIcon sx={{ fontSize: 30, color: "#fff" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Дата: {dtName}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <TrendingUpIcon sx={{ fontSize: 30, color: "#fff" }} />
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              Таргет: {yName}
            </Typography>
          </Box>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Категориальные признаки:
          </Typography>
          {renderCategoricalChips()}
        </Paper>

        {/* Блок настроек модели */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: "#1e1e1e" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Настройки модели
          </Typography>
          {/* Выбор модели */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Выберите модель:
            </Typography>
            <ToggleButtonGroup
              value={model}
              exclusive
              onChange={(e, newModel) => {
                if (newModel) setModel(newModel);
              }}
              aria-label="model selection"
              sx={{ backgroundColor: "#18181a", borderRadius: "8px" }}
            >
              <ToggleButton value="Prophet" aria-label="Prophet" sx={{ color: model === "Prophet" ? "#FF6384" : "#fff" }}>
                Prophet
              </ToggleButton>
              {/* Дополнительные модели можно добавить */}
            </ToggleButtonGroup>
          </Box>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Горизонт прогноза (периодов): {horizon}
              </Typography>
              <Slider
                value={horizon}
                onChange={(e, newVal) => setHorizon(newVal)}
                min={1}
                max={50}
                step={1}
                valueLabelDisplay="auto"
                sx={{ color: "#10A37F" }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Исторических периодов для сравнения: {historyParam}
              </Typography>
              <Slider
                value={historyParam}
                onChange={(e, newVal) => setHistoryParam(newVal)}
                min={1}
                max={50}
                step={1}
                valueLabelDisplay="auto"
                sx={{ color: "#10A37F" }}
              />
            </Box>
            <FormControl variant="filled" fullWidth>
              <InputLabel sx={{ color: "#aaa" }}>Частота</InputLabel>
              <Select
                value={freq}
                onChange={(e) => setFreq(e.target.value)}
                sx={{
                  backgroundColor: "#2c2c2c",
                  color: "#fff",
                  borderRadius: "4px",
                  "& .MuiSelect-select": { padding: "10px" },
                }}
              >
                {frequencyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
          <Button
            variant="contained"
            onClick={handleForecast}
            disabled={loading}
            fullWidth
            sx={{ mt: 3, borderRadius: "20px" }}
          >
            {loading ? <CircularProgress size={24} /> : "Выполнить прогноз"}
          </Button>
        </Paper>

        {/* Вывод результатов прогноза */}
        {forecastHorizon.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Результаты прогноза
            </Typography>
            <Paper sx={{ p: 3, mb: 3, backgroundColor: "#1e1e1e" }}>
              <Box sx={{ height: 400 }}>
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { labels: { color: "#fff" } },
                      title: { display: true, text: "График прогноза", color: "#fff" },
                    },
                    scales: {
                      x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                      y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                    },
                  }}
                />
              </Box>
            </Paper>
            <Paper sx={{ p: 3, mb: 3, backgroundColor: "#1e1e1e" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Таблица прогноза
              </Typography>
              <Box sx={{ maxHeight: 300, overflow: "auto" }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {forecastHorizon.length > 0 &&
                        Object.keys(forecastHorizon[0]).map((col) => (
                          <TableCell key={col} sx={{ color: "#fff", fontWeight: "bold" }}>
                            {col.toUpperCase()}
                          </TableCell>
                        ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {forecastHorizon.map((row, idx) => (
                      <TableRow key={idx}>
                        {Object.values(row).map((val, i) => (
                          <TableCell key={i} sx={{ color: "#fff" }}>
                            {val}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <Button variant="contained" onClick={handleDownloadCSV} sx={{ mt: 2, borderRadius: "20px" }}>
                Скачать CSV
              </Button>
            </Paper>
            {metrics && (
              <Paper sx={{ p: 3, mb: 3, backgroundColor: "#1e1e1e" }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Метрики модели
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-around" }}>
                  <Typography variant="body1">MAE: {metrics.mae.toFixed(3)}</Typography>
                  <Typography variant="body1">RMSE: {metrics.rmse.toFixed(3)}</Typography>
                  <Typography variant="body1">MAPE: {metrics.mape.toFixed(1)}%</Typography>
                </Box>
              </Paper>
            )}
          </>
        )}
      </Box>
    </Slide>
  );
};

export default ForecastPage;
