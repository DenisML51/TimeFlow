import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Tooltip,
  IconButton,
  Switch,
  Fade,
  Tabs,
  Tab,
} from '@mui/material';
import { HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { saveAs } from 'file-saver';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Цвет для акцентов
const accentColor = "#10A37F";

/**
 * Вспомогательная функция для расчёта базовых метрик (MAE, RMSE, MAPE)
 * по массиву данных { ds, y_fact, y_forecast, ... }.
 */
function computeMetrics(dataArray) {
  if (!dataArray || dataArray.length === 0) return null;
  let sumAbsErr = 0;
  let sumSqErr = 0;
  let count = 0;
  dataArray.forEach((item) => {
    if (item.y_fact !== null && item.y_fact !== undefined) {
      sumAbsErr += Math.abs(item.y_fact - item.y_forecast);
      sumSqErr += (item.y_fact - item.y_forecast) ** 2;
      count++;
    }
  });
  if (count === 0) return null; // нет фактических значений
  const mae = sumAbsErr / count;
  const rmse = Math.sqrt(sumSqErr / count);
  // MAPE
  let sumPecent = 0;
  let countMape = 0;
  dataArray.forEach((item) => {
    if (item.y_fact && item.y_fact !== 0) {
      sumPecent += Math.abs(item.y_fact - item.y_forecast) / Math.abs(item.y_fact);
      countMape++;
    }
  });
  const mape = countMape > 0 ? (sumPecent / countMape) * 100 : null;
  return { mae, rmse, mape };
}

/**
 * Функция для генерации данных для Chart.js
 * @param {Array} dataArray - массив объектов [{ds, y_fact, y_forecast, yhat_lower, yhat_upper, model_name}, ...]
 * @param {string} labelFact - название легенды для факта
 * @param {string} labelForecast - название легенды для прогноза
 */
function makeChartData(dataArray, labelFact = 'Факт', labelForecast = 'Прогноз') {
  return {
    labels: dataArray.map(d => d.ds),
    datasets: [
      {
        label: labelFact,
        data: dataArray.map(d => d.y_fact), // могут быть null
        fill: false,
        backgroundColor: "#FF6384",
        borderColor: "#FF6384",
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 4,
      },
      {
        label: labelForecast,
        data: dataArray.map(d => d.y_forecast),
        fill: false,
        backgroundColor: accentColor,
        borderColor: accentColor,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 4,
      },
      {
        label: 'Нижняя граница',
        data: dataArray.map(d => d.yhat_lower),
        fill: '-1',
        backgroundColor: "rgba(16, 163, 127, 0.3)",
        borderColor: "rgba(16, 163, 127, 0.3)",
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0,
      },
      {
        label: 'Верхняя граница',
        data: dataArray.map(d => d.yhat_upper),
        fill: '-1',
        backgroundColor: "rgba(16, 163, 127, 0.3)",
        borderColor: "rgba(16, 163, 127, 0.3)",
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0,
      },
    ],
  };
}

const ForecastPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Получаем предобработанные данные и выбранные колонки из state/SessionStorage
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

  // Если данных нет или пользователь пришёл напрямую, возвращаемся назад
  useEffect(() => {
    if (!modifiedData || modifiedData.length === 0 || !selectedColumns || selectedColumns.length < 2) {
      navigate(-1);
    }
  }, [modifiedData, selectedColumns, navigate]);

  // Сохраняем в sessionStorage при первом заходе (чтобы не потерять при перезагрузке)
  useEffect(() => {
    if (stateModifiedData) {
      sessionStorage.setItem('modifiedData', JSON.stringify(stateModifiedData));
    }
    if (stateSelectedColumns) {
      sessionStorage.setItem('selectedColumns', JSON.stringify(stateSelectedColumns));
    }
  }, [stateModifiedData, stateSelectedColumns]);

  // Имена столбцов
  const dtName = selectedColumns ? selectedColumns[0] : 'ds';
  const yName = selectedColumns ? selectedColumns[1] : 'y';

  // Параметры модели (initial values загружаются из sessionStorage, если есть)
  const [model, setModel] = useState(() => sessionStorage.getItem('forecast_model') || 'Prophet');
  const [horizon, setHorizon] = useState(() => Number(sessionStorage.getItem('forecast_horizon')) || 10);
  const [historyParam, setHistoryParam] = useState(() => Number(sessionStorage.getItem('forecast_history')) || 0);
  const [freq, setFreq] = useState(() => sessionStorage.getItem('forecast_freq') || 'D');
  const [confidenceLevel, setConfidenceLevel] = useState(95);

  // При изменении – сохраняем в sessionStorage
  useEffect(() => {
    sessionStorage.setItem('forecast_model', model);
    sessionStorage.setItem('forecast_horizon', horizon);
    sessionStorage.setItem('forecast_history', historyParam);
    sessionStorage.setItem('forecast_freq', freq);
  }, [model, horizon, historyParam, freq]);

  // Состояние для полученных данных (4 набора)
  const [forecastAll, setForecastAll] = useState([]);
  const [forecastTrain, setForecastTrain] = useState([]);
  const [forecastTest, setForecastTest] = useState([]);
  const [forecastHorizon, setForecastHorizon] = useState([]);

  // Загрузка
  const [loading, setLoading] = useState(false);

  // Управление вкладками для графиков / таблиц
  const [viewTab, setViewTab] = useState(0); // 0 - Графики, 1 - Таблицы
  const handleViewTabChange = (event, newValue) => {
    setViewTab(newValue);
  };

  // Дополнительные вкладки внутри графиков (All / Train / Test / Future)
  const [graphTab, setGraphTab] = useState(0);
  const handleGraphTabChange = (event, newValue) => {
    setGraphTab(newValue);
  };

  // Дополнительные вкладки внутри таблиц (All / Train / Test / Future)
  const [tableTab, setTableTab] = useState(0);
  const handleTableTabChange = (event, newValue) => {
    setTableTab(newValue);
  };

  // Функция возврата на предыдущую страницу
  const handleBack = () => {
    navigate(-1);
  };

  // Запрос на бэкенд
  const handleForecast = async () => {
    setLoading(true);
    try {
      const payload = {
        model,
        horizon: Number(horizon),
        // "history" трактуем как test_size
        history: Number(historyParam),
        dt_name: dtName,
        y_name: yName,
        freq,
        confidence_level: confidenceLevel,
        data: modifiedData,
      };
      const response = await axios.post('http://localhost:8000/api/forecast', payload, { withCredentials: true });
      const {
        forecast_all,
        forecast_train,
        forecast_test,
        forecast_horizon
      } = response.data;

      setForecastAll(forecast_all || []);
      setForecastTrain(forecast_train || []);
      setForecastTest(forecast_test || []);
      setForecastHorizon(forecast_horizon || []);
    } catch (error) {
      console.error("Ошибка прогноза:", error);
    } finally {
      setLoading(false);
    }
  };

  // Скачивание CSV будущего прогноза
  const handleDownloadCSV = () => {
    if (forecastHorizon.length === 0) return;
    const headers = "ds,y_forecast,yhat_lower,yhat_upper,model_name\n";
    const rows = forecastHorizon.map(row =>
      `${row.ds},${row.y_forecast},${row.yhat_lower},${row.yhat_upper},${row.model_name}`
    ).join('\n');
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'forecast_horizon.csv');
  };

  // Категориальные столбцы (для отображения)
  const categoricalColumns = modifiedData && modifiedData.length > 0
    ? Object.keys(modifiedData[0]).filter(col =>
        typeof modifiedData[0][col] === 'string' && col !== dtName && col !== yName
      )
    : [];

  // Общие опции для Chart.js
  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#fff" } },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: {
        ticks: {
          color: "#fff",
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 10,
        },
        grid: { color: "rgba(255,255,255,0.1)" }
      },
      y: {
        ticks: { color: "#fff" },
        grid: { color: "rgba(255,255,255,0.1)" }
      },
    },
  };

  // Данные для графиков
  const chartDataAll = makeChartData(forecastAll, "Факт(All)", "Прогноз(All)");
  const chartDataTrain = makeChartData(forecastTrain, "Факт(Train)", "Прогноз(Train)");
  const chartDataTest = makeChartData(forecastTest, "Факт(Test)", "Прогноз(Test)");
  const chartDataHorizon = (() => {
    // Для будущего нет y_fact, можно либо задать null, либо вообще убрать факт
    const labels = forecastHorizon.map(d => d.ds);
    return {
      labels,
      datasets: [
        {
          label: 'Прогноз(Horizon)',
          data: forecastHorizon.map(d => d.y_forecast),
          borderColor: accentColor,
          backgroundColor: accentColor,
          pointRadius: 3,
          pointHoverRadius: 4,
          borderWidth: 2,
          fill: false,
        },
        {
          label: 'Нижняя граница',
          data: forecastHorizon.map(d => d.yhat_lower),
          fill: '-1',
          backgroundColor: "rgba(16, 163, 127, 0.3)",
          borderColor: "rgba(16, 163, 127, 0.3)",
          borderDash: [5, 5],
          borderWidth: 1,
          pointRadius: 0,
        },
        {
          label: 'Верхняя граница',
          data: forecastHorizon.map(d => d.yhat_upper),
          fill: '-1',
          backgroundColor: "rgba(16, 163, 127, 0.3)",
          borderColor: "rgba(16, 163, 127, 0.3)",
          borderDash: [5, 5],
          borderWidth: 1,
          pointRadius: 0,
        },
      ],
    };
  })();

  // Метрики
  const metricsAll = computeMetrics(forecastAll);
  const metricsTrain = computeMetrics(forecastTrain);
  const metricsTest = computeMetrics(forecastTest);

  return (
    <Box
      sx={{
        p: 3,
        minHeight: "100vh",
        background: "linear-gradient(135deg, #121212, #1e1e1e)",
        color: "#fff",
      }}
    >
      {/* Верхняя панель */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Button
          onClick={handleBack}
          startIcon={<ArrowBackIcon sx={{ color: "#fff" }} />}
          sx={{ color: "#fff", mr: 2 }}
        >
          Назад
        </Button>
        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: "center" }}>
          Прогнозирование (Train / Test / Horizon)
        </Typography>
      </Box>

      {/* Категориальные признаки */}
      {categoricalColumns.length > 0 && (
        <Fade in timeout={600}>
          <Paper
            sx={{
              p: 2,
              mb: 3,
              background: "rgba(16, 163, 127, 0.15)",
              borderRadius: "12px",
              boxShadow: 3,
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Категориальные переменные выборки:
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {categoricalColumns.map(col => (
                <Chip
                  key={col}
                  label={col}
                  sx={{ backgroundColor: accentColor, color: "#fff" }}
                />
              ))}
            </Box>
          </Paper>
        </Fade>
      )}

      {/* Информация о выбранных столбцах */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          backgroundColor: "#18181a",
          borderRadius: "12px",
          boxShadow: 3,
        }}
      >
        <Typography variant="subtitle1">
          Столбец с датой: <strong>{dtName}</strong>
        </Typography>
        <Typography variant="subtitle1">
          Целевая переменная: <strong>{yName}</strong>
        </Typography>
      </Paper>

      {/* Параметры прогноза */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: "linear-gradient(135deg, rgba(16,163,127,0.15), rgba(16,163,127,0.05))",
          borderRadius: "12px",
          boxShadow: 3,
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>Параметры прогноза</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Модель</InputLabel>
              <Select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                label="Модель"
                sx={{ backgroundColor: "#2c2c2c", color: "#fff" }}
              >
                <MenuItem value="Prophet">Prophet</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography gutterBottom>Горизонт (периодов): {horizon}</Typography>
            <Slider
              value={horizon}
              onChange={(e, newVal) => setHorizon(newVal)}
              min={0}
              max={50}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: accentColor }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography gutterBottom>История (test size): {historyParam}</Typography>
              <Tooltip title="Сколько последних точек выделяется для тестовой выборки">
                <IconButton size="small">
                  <HelpOutlineIcon fontSize="small" sx={{ color: "#fff" }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Slider
              value={historyParam}
              onChange={(e, newVal) => setHistoryParam(newVal)}
              min={0}
              max={50}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: accentColor }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Частота</InputLabel>
              <Select
                value={freq}
                onChange={(e) => setFreq(e.target.value)}
                label="Частота"
                sx={{ backgroundColor: "#2c2c2c", color: "#fff" }}
              >
                <MenuItem value="D">День</MenuItem>
                <MenuItem value="W-MON">Неделя (пн)</MenuItem>
                <MenuItem value="M">Месяц</MenuItem>
                <MenuItem value="MS">Начало месяца</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography gutterBottom>Уровень доверия: {confidenceLevel}%</Typography>
              <Tooltip title="Процент доверительного интервала при прогнозировании">
                <IconButton size="small">
                  <HelpOutlineIcon fontSize="small" sx={{ color: "#fff" }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Slider
              value={confidenceLevel}
              onChange={(e, newVal) => setConfidenceLevel(newVal)}
              min={80}
              max={99}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: accentColor }}
            />
          </Grid>
        </Grid>

        {/* Кнопка "Выполнить прогноз" */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button
            variant="contained"
            onClick={handleForecast}
            disabled={loading}
            sx={{ borderRadius: "20px", px: 3, backgroundColor: accentColor }}
          >
            {loading ? <CircularProgress size={24} /> : "Выполнить прогноз"}
          </Button>
        </Box>
      </Paper>

      {/* Основные вкладки: Графики / Таблицы */}
      {(forecastAll.length > 0 || forecastHorizon.length > 0) && (
        <Paper sx={{ mb: 3, backgroundColor: "#1e1e1e", borderRadius: "12px", boxShadow: 3 }}>
          <Tabs
            value={viewTab}
            onChange={handleViewTabChange}
            textColor="inherit"
            indicatorColor="primary"
            variant="fullWidth"
          >
            <Tab label="Графики" />
            <Tab label="Таблицы" />
          </Tabs>

          {/* Вкладка "Графики" */}
          {viewTab === 0 && (
            <Box sx={{ p: 3 }}>
              {/* Дополнительные вкладки: All / Train / Test / Horizon */}
              <Tabs
                value={graphTab}
                onChange={handleGraphTabChange}
                textColor="inherit"
                indicatorColor="primary"
                sx={{ mb: 3 }}
                variant="scrollable"
              >
                <Tab label="All History" />
                <Tab label="Train" disabled={forecastTrain.length === 0} />
                <Tab label="Test" disabled={forecastTest.length === 0} />
                <Tab label="Horizon" disabled={forecastHorizon.length === 0} />
              </Tabs>

              {/* ALL HISTORY */}
              {graphTab === 0 && forecastAll.length > 0 && (
                <Box sx={{ mb: 3, height: 500 }}>
                  <Typography variant="h6">All History</Typography>
                  <Line data={chartDataAll} options={commonChartOptions} />
                  {/* Метрики по All */}
                  {metricsAll && (
                    <Box sx={{ mt: 2, display: "flex", gap: 3, flexWrap: "wrap" }}>
                      <Typography>MAE: {metricsAll.mae.toFixed(3)}</Typography>
                      <Typography>RMSE: {metricsAll.rmse.toFixed(3)}</Typography>
                      {metricsAll.mape && <Typography>MAPE: {metricsAll.mape.toFixed(1)}%</Typography>}
                    </Box>
                  )}
                </Box>
              )}

              {/* TRAIN */}
              {graphTab === 1 && forecastTrain.length > 0 && (
                <Box sx={{ mb: 3, height: 500 }}>
                  <Typography variant="h6">Train</Typography>
                  <Line data={chartDataTrain} options={commonChartOptions} />
                  {/* Метрики по Train */}
                  {metricsTrain && (
                    <Box sx={{ mt: 2, display: "flex", gap: 3, flexWrap: "wrap" }}>
                      <Typography>MAE: {metricsTrain.mae.toFixed(3)}</Typography>
                      <Typography>RMSE: {metricsTrain.rmse.toFixed(3)}</Typography>
                      {metricsTrain.mape && <Typography>MAPE: {metricsTrain.mape.toFixed(1)}%</Typography>}
                    </Box>
                  )}
                </Box>
              )}

              {/* TEST */}
              {graphTab === 2 && forecastTest.length > 0 && (
                <Box sx={{ mb: 3, height: 500 }}>
                  <Typography variant="h6">Test</Typography>
                  <Line data={chartDataTest} options={commonChartOptions} />
                  {/* Метрики по Test */}
                  {metricsTest && (
                    <Box sx={{ mt: 2, display: "flex", gap: 3, flexWrap: "wrap" }}>
                      <Typography>MAE: {metricsTest.mae.toFixed(3)}</Typography>
                      <Typography>RMSE: {metricsTest.rmse.toFixed(3)}</Typography>
                      {metricsTest.mape && <Typography>MAPE: {metricsTest.mape.toFixed(1)}%</Typography>}
                    </Box>
                  )}
                </Box>
              )}

              {/* HORIZON */}
              {graphTab === 3 && forecastHorizon.length > 0 && (
                <Box sx={{ mb: 3, height: 500 }}>
                  <Typography variant="h6">Horizon (Будущее)</Typography>
                  <Line data={chartDataHorizon} options={commonChartOptions} />
                  {/* Скачать CSV */}
                  <Box sx={{ textAlign: "center", mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={handleDownloadCSV}
                      sx={{ borderRadius: "20px", backgroundColor: accentColor }}
                    >
                      Скачать CSV (Horizon)
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Вкладка "Таблицы" */}
          {viewTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Tabs
                value={tableTab}
                onChange={handleTableTabChange}
                textColor="inherit"
                indicatorColor="primary"
                sx={{ mb: 3 }}
                variant="scrollable"
              >
                <Tab label="All" disabled={forecastAll.length === 0} />
                <Tab label="Train" disabled={forecastTrain.length === 0} />
                <Tab label="Test" disabled={forecastTest.length === 0} />
                <Tab label="Horizon" disabled={forecastHorizon.length === 0} />
              </Tabs>

              {/* Таблица ALL */}
              {tableTab === 0 && forecastAll.length > 0 && (
                <Paper
                  sx={{
                    p: 3,
                    mb: 3,
                    backgroundColor: "#1e1e1e",
                    borderRadius: "12px",
                    boxShadow: 3,
                    overflowX: "auto",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    All History (Прогноз + Факт)
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Дата</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Факт</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Прогноз</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Нижняя</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Верхняя</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Модель</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {forecastAll.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ color: "#fff" }}>{row.ds}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.y_fact}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.y_forecast}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.yhat_lower}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.yhat_upper}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.model_name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>
              )}

              {/* Таблица TRAIN */}
              {tableTab === 1 && forecastTrain.length > 0 && (
                <Paper
                  sx={{
                    p: 3,
                    mb: 3,
                    backgroundColor: "#1e1e1e",
                    borderRadius: "12px",
                    boxShadow: 3,
                    overflowX: "auto",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Train (Прогноз + Факт)
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Дата</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Факт</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Прогноз</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Нижняя</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Верхняя</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Модель</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {forecastTrain.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ color: "#fff" }}>{row.ds}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.y_fact}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.y_forecast}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.yhat_lower}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.yhat_upper}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.model_name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>
              )}

              {/* Таблица TEST */}
              {tableTab === 2 && forecastTest.length > 0 && (
                <Paper
                  sx={{
                    p: 3,
                    mb: 3,
                    backgroundColor: "#1e1e1e",
                    borderRadius: "12px",
                    boxShadow: 3,
                    overflowX: "auto",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Test (Прогноз + Факт)
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Дата</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Факт</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Прогноз</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Нижняя</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Верхняя</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Модель</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {forecastTest.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ color: "#fff" }}>{row.ds}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.y_fact}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.y_forecast}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.yhat_lower}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.yhat_upper}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.model_name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Paper>
              )}

              {/* Таблица HORIZON */}
              {tableTab === 3 && forecastHorizon.length > 0 && (
                <Paper
                  sx={{
                    p: 3,
                    mb: 3,
                    backgroundColor: "#1e1e1e",
                    borderRadius: "12px",
                    boxShadow: 3,
                    overflowX: "auto",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Будущее (Horizon)
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Дата</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Прогноз</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Нижняя</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Верхняя</TableCell>
                          <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Модель</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {forecastHorizon.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ color: "#fff" }}>{row.ds}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.y_forecast}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.yhat_lower}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.yhat_upper}</TableCell>
                            <TableCell sx={{ color: "#fff" }}>{row.model_name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                  {/* Скачать CSV */}
                  <Box sx={{ textAlign: "center", mt: 3 }}>
                    <Button
                      variant="contained"
                      onClick={handleDownloadCSV}
                      sx={{ borderRadius: "20px", backgroundColor: accentColor }}
                    >
                      Скачать CSV (Horizon)
                    </Button>
                  </Box>
                </Paper>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ForecastPage;
