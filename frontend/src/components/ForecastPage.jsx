import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Slide,
  CircularProgress,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Fade,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { saveAs } from 'file-saver';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const accentColor = "#10A37F";

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

  useEffect(() => {
    if (!modifiedData || modifiedData.length === 0 || !selectedColumns || selectedColumns.length < 2) {
      navigate(-1);
    }
  }, [modifiedData, selectedColumns, navigate]);

  useEffect(() => {
    if (stateModifiedData) sessionStorage.setItem('modifiedData', JSON.stringify(stateModifiedData));
    if (stateSelectedColumns) sessionStorage.setItem('selectedColumns', JSON.stringify(stateSelectedColumns));
  }, [stateModifiedData, stateSelectedColumns]);

  const dtName = selectedColumns ? selectedColumns[0] : 'ds';
  const yName = selectedColumns ? selectedColumns[1] : 'y';

  // Параметры модели (сохраняются в sessionStorage)
  const [model, setModel] = useState(() => sessionStorage.getItem('forecast_model') || 'Prophet');
  const [horizon, setHorizon] = useState(() => Number(sessionStorage.getItem('forecast_horizon')) || 10);
  const [historyParam, setHistoryParam] = useState(() => Number(sessionStorage.getItem('forecast_history')) || 10);
  const [freq, setFreq] = useState(() => sessionStorage.getItem('forecast_freq') || 'D');
  const [confidenceLevel, setConfidenceLevel] = useState(95);

  useEffect(() => {
    sessionStorage.setItem('forecast_model', model);
    sessionStorage.setItem('forecast_horizon', horizon);
    sessionStorage.setItem('forecast_history', historyParam);
    sessionStorage.setItem('forecast_freq', freq);
  }, [model, horizon, historyParam, freq]);

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

  const [slideIn, setSlideIn] = useState(true);
  const handleBack = () => {
    setSlideIn(false);
    setTimeout(() => navigate(-1), 300);
  };

  // Вычисление маржи здесь выполняется на сервере, поэтому на фронтенде просто передаём confidenceLevel

  // Функция запроса прогноза с передачей нового параметра confidence_level
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
        confidence_level: confidenceLevel,
        data: modifiedData,
      };
      const response = await axios.post('http://localhost:8000/api/forecast', payload, { withCredentials: true });
      const hist = response.data.forecast_history || [];
      const hor = response.data.forecast_horizon || [];

      setForecastHistory(hist);
      setForecastHorizon(hor);
    } catch (error) {
      console.error("Ошибка прогноза:", error);
    } finally {
      setLoading(false);
    }
  };

  // Вычисление метрик для исторического прогноза
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

  // Данные для графика будущего прогноза (используем доверительные интервалы)
  const horizonChartData = {
    labels: forecastHorizon.map(item => item.ds),
    datasets: [
      {
        label: yName,
        data: forecastHorizon.map(item => item.y_forecast),
        fill: false,
        backgroundColor: accentColor,
        borderColor: accentColor,
        borderWidth: 2,
      },
      {
        label: 'Нижняя граница',
        data: forecastHorizon.map(item => item.yhat_lower),
        fill: '-1',
        backgroundColor: "rgba(16, 163, 127, 0.3)",
        borderColor: "rgba(16, 163, 127, 0.3)",
        borderDash: [5, 5],
        borderWidth: 1,
      },
      {
        label: 'Верхняя граница',
        data: forecastHorizon.map(item => item.yhat_upper),
        fill: '-1',
        backgroundColor: "rgba(16, 163, 127, 0.3)",
        borderColor: "rgba(16, 163, 127, 0.3)",
        borderDash: [5, 5],
        borderWidth: 1,
      },
    ],
  };

  // Данные для графика исторического прогноза
  const historyChartData = {
    labels: forecastHistory.map(item => item.ds),
    datasets: [
      {
        label: 'Фактическое значение',
        data: forecastHistory.map(item => item.y_fact),
        fill: false,
        backgroundColor: "#FF6384",
        borderColor: "#FF6384",
        borderWidth: 2,
      },
      {
        label: 'Прогноз',
        data: forecastHistory.map(item => item.y_forecast),
        fill: false,
        backgroundColor: accentColor,
        borderColor: accentColor,
        borderWidth: 2,
      },
      {
        label: 'Нижняя граница',
        data: forecastHistory.map(item => item.yhat_lower),
        fill: '-1',
        backgroundColor: "rgba(16, 163, 127, 0.3)",
        borderColor: "rgba(16, 163, 127, 0.3)",
        borderDash: [5, 5],
        borderWidth: 1,
      },
      {
        label: 'Верхняя граница',
        data: forecastHistory.map(item => item.yhat_upper),
        fill: '-1',
        backgroundColor: "rgba(16, 163, 127, 0.3)",
        borderColor: "rgba(16, 163, 127, 0.3)",
        borderDash: [5, 5],
        borderWidth: 1,
      },
    ],
  };

  const handleDownloadCSV = () => {
    if (forecastHorizon.length === 0) return;
    const headers = Object.keys(forecastHorizon[0]).join(',') + '\n';
    const rows = forecastHorizon.map(row => Object.values(row).join(',')).join('\n');
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'forecast.csv');
  };

  // Определяем категориальные переменные из исходной выборки (кроме столбцов даты и целевой переменной)
  const categoricalColumns = modifiedData && modifiedData.length > 0
    ? Object.keys(modifiedData[0]).filter(col =>
        typeof modifiedData[0][col] === 'string' && col !== dtName && col !== yName
      )
    : [];

  return (
    <Slide direction="left" in={slideIn} mountOnEnter unmountOnExit>
      <Box sx={{ p: 3, minHeight: "100vh", background: "linear-gradient(135deg, #121212, #1e1e1e)", color: "#fff" }}>
        {/* Верхняя панель с кнопкой назад */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Button onClick={handleBack} startIcon={<ArrowBackIcon sx={{ color: "#fff" }} />} sx={{ color: "#fff" }}>
            Назад
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: "center" }}>
            Прогнозирование
          </Typography>
        </Box>

        {/* Отображение категориальных переменных */}
        {categoricalColumns.length > 0 && (
          <Fade in timeout={600}>
            <Paper sx={{ p: 2, mb: 3, background: "rgba(16, 163, 127, 0.15)", borderRadius: "12px", boxShadow: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Категориальные переменные выборки:</Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {categoricalColumns.map(col => (
                  <Chip key={col} label={col} sx={{ backgroundColor: accentColor, color: "#fff" }} />
                ))}
              </Box>
            </Paper>
          </Fade>
        )}

        {/* Блок с выбранными столбцами */}
        <Paper sx={{ p: 2, mb: 3, backgroundColor: "#18181a", borderRadius: "12px", boxShadow: 3 }}>
          <Typography variant="subtitle1">
            Столбец с датой: <strong>{dtName}</strong>
          </Typography>
          <Typography variant="subtitle1">
            Целевая переменная: <strong>{yName}</strong>
          </Typography>
        </Paper>

        {/* Панель настроек модели */}
        <Paper sx={{ p: 3, mb: 3, background: "linear-gradient(135deg, rgba(16,163,127,0.15), rgba(16,163,127,0.05))", borderRadius: "12px", boxShadow: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Параметры прогноза</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Модель</InputLabel>
                <Select value={model} onChange={(e) => setModel(e.target.value)} label="Модель" sx={{ backgroundColor: "#2c2c2c", color: "#fff" }}>
                  <MenuItem value="Prophet">Prophet</MenuItem>
                  {/* Другие модели можно добавить */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography gutterBottom>Горизонт (периодов): {horizon}</Typography>
              <Slider value={horizon} onChange={(e, newVal) => setHorizon(newVal)} min={1} max={50} step={1} valueLabelDisplay="auto" sx={{ color: accentColor }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography gutterBottom>История (периодов): {historyParam}</Typography>
              <Slider value={historyParam} onChange={(e, newVal) => setHistoryParam(newVal)} min={1} max={50} step={1} valueLabelDisplay="auto" sx={{ color: accentColor }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Частота</InputLabel>
                <Select value={freq} onChange={(e) => setFreq(e.target.value)} label="Частота" sx={{ backgroundColor: "#2c2c2c", color: "#fff" }}>
                  <MenuItem value="MS">Начало месяца</MenuItem>
                  <MenuItem value="M">Месяц</MenuItem>
                  <MenuItem value="W-MON">Неделя (с понедельника)</MenuItem>
                  <MenuItem value="D">День</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={6}>
              <Typography gutterBottom>Уровень доверия: {confidenceLevel}%</Typography>
              <Slider value={confidenceLevel} onChange={(e, newVal) => setConfidenceLevel(newVal)} min={80} max={99} step={1} valueLabelDisplay="auto" sx={{ color: accentColor }} />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button variant="contained" onClick={handleForecast} disabled={loading} sx={{ borderRadius: "20px", px: 3 }}>
              {loading ? <CircularProgress size={24} /> : "Выполнить прогноз"}
            </Button>
          </Box>
        </Paper>

        {/* Вывод результатов: два графика и таблица */}
        {(forecastHorizon.length > 0 || forecastHistory.length > 0) && (
          <>
            <Grid container spacing={3}>
              {forecastHorizon.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, mb: 3, backgroundColor: "#1e1e1e", borderRadius: "12px", boxShadow: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Прогноз на будущее</Typography>
                    <Box sx={{ height: 400 }}>
                      <Line
                        data={horizonChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { labels: { color: "#fff" } },
                            title: { display: true, text: "График прогноза (будущее)", color: "#fff" },
                          },
                          scales: {
                            x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                            y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                          },
                        }}
                      />
                    </Box>
                    <Box sx={{ textAlign: "center", mt: 2 }}>
                      <Button variant="contained" onClick={handleDownloadCSV} sx={{ borderRadius: "20px" }}>
                        Скачать CSV
                      </Button>
                    </Box>
                  </Paper>
                </Grid>
              )}
              {forecastHistory.length > 0 && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, mb: 3, backgroundColor: "#1e1e1e", borderRadius: "12px", boxShadow: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Прогноз на исторических данных</Typography>
                    <Box sx={{ height: 400 }}>
                      <Line
                        data={historyChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { labels: { color: "#fff" } },
                            title: { display: true, text: "Фактические значения vs Прогноз", color: "#fff" },
                          },
                          scales: {
                            x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                            y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                          },
                        }}
                      />
                    </Box>
                    {metrics && (
                      <Box sx={{ mt: 2, display: "flex", justifyContent: "space-around" }}>
                        <Typography variant="body1">MAE: {metrics.mae.toFixed(3)}</Typography>
                        <Typography variant="body1">RMSE: {metrics.rmse.toFixed(3)}</Typography>
                        <Typography variant="body1">MAPE: {metrics.mape.toFixed(1)}%</Typography>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              )}
            </Grid>

            {/* Таблица с прогнозными данными */}
            <Paper sx={{ p: 3, mb: 3, backgroundColor: "#1e1e1e", borderRadius: "12px", boxShadow: 3, overflowX: "auto" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Таблица прогноза</Typography>
              <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
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
                          <TableCell key={i} sx={{ color: "#fff" }}>{val}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Paper>
          </>
        )}
      </Box>
    </Slide>
  );
};

export default ForecastPage;
