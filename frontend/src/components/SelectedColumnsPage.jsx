import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  Typography,
  Paper,
  Grid,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  Radio,
  Slide
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  Check as CheckIcon
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Line, Bar } from "react-chartjs-2";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import CategoricalDataBlock from "./CategoricalDataBlock";

// =========== 1) МЕТРИКИ НА СТАНДАРТИЗОВАННЫХ ДАННЫХ ===========
function computeMetricsOnStandardized(dataArray) {
  const rowsWithFact = dataArray.filter(
    (d) => d.y_fact !== null && d.y_fact !== undefined
  );
  if (!rowsWithFact.length) return null;
  const facts = rowsWithFact.map((d) => d.y_fact);
  const preds = rowsWithFact.map((d) => d.y_forecast);
  const combined = [...facts, ...preds];
  const mean = combined.reduce((acc, v) => acc + v, 0) / combined.length;
  const variance = combined.reduce((acc, v) => acc + (v - mean) ** 2, 0) / combined.length;
  const std = Math.sqrt(variance);
  if (std === 0) return { mae: 0, rmse: 0, mape: 0 };
  const factsScaled = facts.map((f) => (f - mean) / std);
  const predsScaled = preds.map((p) => (p - mean) / std);
  let sumAbs = 0, sumSq = 0, sumPct = 0, countPct = 0;
  for (let i = 0; i < factsScaled.length; i++) {
    const err = factsScaled[i] - predsScaled[i];
    sumAbs += Math.abs(err);
    sumSq += err * err;
    if (factsScaled[i] !== 0) {
      sumPct += Math.abs(err / factsScaled[i]);
      countPct++;
    }
  }
  const mae = sumAbs / factsScaled.length;
  const rmse = Math.sqrt(sumSq / factsScaled.length);
  const mape = countPct > 0 ? (sumPct / countPct) * 100 : null;
  return { mae, rmse, mape };
}

// =========== 2) График для ОДНОЙ МОДЕЛИ ===========
function makeSingleModelChartData(dataArray, modelColor) {
  return {
    labels: dataArray.map((d) => d.ds),
    datasets: [
      {
        label: "Факт",
        data: dataArray.map((d) => d.y_fact),
        borderColor: "#FFD700",
        backgroundColor: "#FFD700",
        borderWidth: 1,
        pointRadius: 2,
        fill: false
      },
      {
        label: "Прогноз",
        data: dataArray.map((d) => d.y_forecast),
        borderColor: modelColor,
        backgroundColor: modelColor,
        borderWidth: 1,
        pointRadius: 2,
        fill: false
      },
      {
        label: "Нижняя",
        data: dataArray.map((d) => d.yhat_lower),
        fill: "-1",
        backgroundColor: `${modelColor}33`,
        borderColor: `${modelColor}33`,
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0
      },
      {
        label: "Верхняя",
        data: dataArray.map((d) => d.yhat_upper),
        fill: "-1",
        backgroundColor: `${modelColor}33`,
        borderColor: `${modelColor}33`,
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0
      }
    ]
  };
}

// =========== 3) График (All Models) ===========
function makeCombinedChartData(modelsArray, modelColorMap) {
  const allDates = new Set();
  modelsArray.forEach((m) => {
    m.segment.forEach((row) => allDates.add(row.ds));
  });
  const labels = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));
  const datasets = [];
  modelsArray.forEach((m) => {
    const color = modelColorMap[m.modelName] || "#36A2EB";
    const mapData = new Map();
    m.segment.forEach((row) => {
      mapData.set(row.ds, { fact: row.y_fact, forecast: row.y_forecast });
    });
    datasets.push({
      label: `Факт (${m.modelName})`,
      data: labels.map((ds) => {
        const item = mapData.get(ds);
        return item ? item.fact : null;
      }),
      borderColor: "#FFD700",
      backgroundColor: "#FFD700",
      borderWidth: 1,
      pointRadius: 2,
      fill: false
    });
    datasets.push({
      label: `Прогноз (${m.modelName})`,
      data: labels.map((ds) => {
        const item = mapData.get(ds);
        return item ? item.forecast : null;
      }),
      borderColor: color,
      backgroundColor: "transparent",
      borderDash: [5, 5],
      borderWidth: 1,
      pointRadius: 2,
      fill: false
    });
  });
  return { labels, datasets };
}

// =========== 4) Компонент "ProphetBlock" ===========
function ProphetBlock({ active, setActive, prophetParams, setProphetParams }) {
  const [localSeasonalityMode, setLocalSeasonalityMode] = useState(
    prophetParams.seasonality_mode || "additive"
  );
  const handleApply = () => {
    setProphetParams((prev) => ({ ...prev, seasonality_mode: localSeasonalityMode }));
    setActive(true);
  };
  const handleCancel = () => {
    setActive(false);
  };
  const borderColor = active ? "#10A37F" : "#FF4444";
  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        border: `2px solid ${borderColor}`,
        borderRadius: 2,
        transition: "border-color 0.2s"
      }}
    >
      <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>
        Prophet
      </Typography>
      <Box sx={{ mt: 1 }}>
        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
          <InputLabel>Seasonality Mode</InputLabel>
          <Select
            value={localSeasonalityMode}
            label="Seasonality Mode"
            onChange={(e) => setLocalSeasonalityMode(e.target.value)}
            sx={{ backgroundColor: "#2c2c2c", color: "#fff" }}
          >
            <MenuItem value="additive">Additive</MenuItem>
            <MenuItem value="multiplicative">Multiplicative</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
          {active ? (
            <Button
              variant="outlined"
              startIcon={<CloseIcon />}
              sx={{
                borderColor: "#FF4444",
                color: "#FF4444",
                "&:hover": {
                  borderColor: "#FF4444",
                  backgroundColor: "#ff44441a"
                }
              }}
              onClick={handleCancel}
            >
              Отключить
            </Button>
          ) : (
            <Button
              variant="outlined"
              startIcon={<CheckIcon />}
              sx={{
                borderColor: "#10A37F",
                color: "#10A37F",
                "&:hover": {
                  borderColor: "#10A37F",
                  backgroundColor: "#10A37F1a"
                }
              }}
              onClick={handleApply}
            >
              Активировать
            </Button>
          )}
        </Box>
      </Box>
      <Typography variant="caption" sx={{ color: active ? "#10A37F" : "#FF4444" }}>
        {active ? "Активна" : "Выключена"}
      </Typography>
    </Paper>
  );
}

// =========== 5) Основной компонент ForecastPage ===========
export default function ForecastPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Чтение сохранённого состояния из sessionStorage
  const storedState = sessionStorage.getItem("forecastPageState")
    ? JSON.parse(sessionStorage.getItem("forecastPageState"))
    : null;

  // Данные, переданные через location.state (если есть)
  const stateModifiedData = location.state?.modifiedData || [];
  const stateSelectedColumns = location.state?.selectedColumns || [];

  // Если данные не пришли через location, берем сохранённые
  const storedModifiedData = sessionStorage.getItem("modifiedData")
    ? JSON.parse(sessionStorage.getItem("modifiedData"))
    : [];
  const storedSelectedColumns = sessionStorage.getItem("selectedColumns")
    ? JSON.parse(sessionStorage.getItem("selectedColumns"))
    : [];

  // Изначальные данные для прогноза
  const initialModifiedData = stateModifiedData.length
    ? stateModifiedData
    : storedModifiedData;
  const initialSelectedColumns = stateSelectedColumns.length
    ? stateSelectedColumns
    : storedSelectedColumns;

  // Получаем сохранённые фильтры (категориальные данные) из sessionStorage (устанавливаются на первой/второй странице)
  const storedFilters = sessionStorage.getItem("dashboardFilters")
    ? JSON.parse(sessionStorage.getItem("dashboardFilters"))
    : {};

  // Параметры прогноза
  const [horizon, setHorizon] = useState(storedState?.horizon ?? 10);
  const [historySize, setHistorySize] = useState(storedState?.historySize ?? 5);
  const [freq, setFreq] = useState(storedState?.freq || "D");
  const [confidenceLevel, setConfidenceLevel] = useState(
    storedState?.confidenceLevel ?? 95
  );

  // Активность моделей
  const [prophetActive, setProphetActive] = useState(
    storedState?.prophetActive ?? false
  );
  const [prophetParams, setProphetParams] = useState(
    storedState?.prophetParams || { seasonality_mode: "additive" }
  );
  const [arimaActive, setArimaActive] = useState(
    storedState?.arimaActive ?? false
  );

  // Цветовая схема моделей
  const modelColorMap = {
    Prophet: "#36A2EB",
    Arima: "#9966FF"
  };

  // Результаты прогнозирования
  const [forecastResults, setForecastResults] = useState(
    storedState?.forecastResults || []
  );
  const [loading, setLoading] = useState(false);

  // Вкладки общего графика
  const [commonTab, setCommonTab] = useState(storedState?.commonTab || 0);

  // Вкладки для отдельных моделей
  const [modelTab, setModelTab] = useState(storedState?.modelTab || 0);
  const [modelSubTabs, setModelSubTabs] = useState(storedState?.modelSubTabs || {});

  // Меню справа
  const [modelsOpen, setModelsOpen] = useState(storedState?.modelsOpen ?? false);

  // dtName и yName (из выбранных столбцов)
  const dtName = initialSelectedColumns[0] || "ds";
  const yName = initialSelectedColumns[1] || "y";

  // CSV/XLSX
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvSelectedCols, setCsvSelectedCols] = useState(
    storedState?.csvSelectedCols || []
  );
  const [allPossibleCols, setAllPossibleCols] = useState([]);
  const [fileType, setFileType] = useState(storedState?.fileType || "csv");
  const [previewData, setPreviewData] = useState([]);

  // Сохраняем состояние в sessionStorage
  useEffect(() => {
    sessionStorage.setItem(
      "forecastPageState",
      JSON.stringify({
        horizon,
        historySize,
        freq,
        confidenceLevel,
        prophetActive,
        prophetParams,
        arimaActive,
        forecastResults,
        commonTab,
        modelTab,
        modelSubTabs,
        modelsOpen,
        csvSelectedCols,
        fileType
      })
    );
  }, [
    horizon,
    historySize,
    freq,
    confidenceLevel,
    prophetActive,
    prophetParams,
    arimaActive,
    forecastResults,
    commonTab,
    modelTab,
    modelSubTabs,
    modelsOpen,
    csvSelectedCols,
    fileType
  ]);

  // Сохраняем данные, если они пришли через location.state
  useEffect(() => {
    if (stateModifiedData.length) {
      sessionStorage.setItem("modifiedData", JSON.stringify(stateModifiedData));
    }
    if (stateSelectedColumns.length) {
      sessionStorage.setItem("selectedColumns", JSON.stringify(stateSelectedColumns));
    }
  }, [stateModifiedData, stateSelectedColumns]);

  // Если данных нет — возвращаемся назад
  useEffect(() => {
    if (
      !initialModifiedData ||
      !initialSelectedColumns ||
      initialModifiedData.length === 0 ||
      initialSelectedColumns.length < 2
    ) {
      navigate(-1);
    }
  }, [initialModifiedData, initialSelectedColumns, navigate]);

  // Построение прогноза
  const handleBuildForecast = async () => {
    setLoading(true);
    try {
      const activeModels = [];
      if (prophetActive) activeModels.push({ model: "Prophet", uniqueParams: prophetParams });
      if (arimaActive) activeModels.push({ model: "Arima", uniqueParams: {} });
      const newResults = [];
      for (let m of activeModels) {
        const payload = {
          model: m.model,
          horizon,
          history: historySize,
          dt_name: dtName,
          y_name: yName,
          freq,
          confidence_level: confidenceLevel,
          data: initialModifiedData
        };
        const resp = await axios.post("http://localhost:8000/api/forecast", payload);
        const { forecast_all, forecast_train, forecast_test, forecast_horizon } = resp.data;
        newResults.push({
          modelName: m.model,
          forecastAll: forecast_all || [],
          forecastTrain: forecast_train || [],
          forecastTest: forecast_test || [],
          forecastHorizon: forecast_horizon || []
        });
      }
      setForecastResults(newResults);
    } catch (err) {
      console.error("Ошибка прогноза:", err);
    } finally {
      setLoading(false);
    }
  };

  // Формирование списка столбцов для экспорта
  useEffect(() => {
    const colSet = new Set(["ds", "y_fact"]);
    forecastResults.forEach((m) => {
      const arr = [
        ...m.forecastAll,
        ...m.forecastTrain,
        ...m.forecastTest,
        ...m.forecastHorizon
      ];
      arr.forEach((row) => {
        if (row.y_forecast !== undefined) colSet.add(`${m.modelName}_y_forecast`);
        if (row.yhat_lower !== undefined) colSet.add(`${m.modelName}_yhat_lower`);
        if (row.yhat_upper !== undefined) colSet.add(`${m.modelName}_yhat_upper`);
      });
    });
    setAllPossibleCols(Array.from(colSet));
  }, [forecastResults]);

  // Формирование общего массива для экспорта и превью
  const buildMergedRows = () => {
    const bigMap = new Map();
    forecastResults.forEach((m) => {
      const combined = [
        ...m.forecastAll,
        ...m.forecastTrain,
        ...m.forecastTest,
        ...m.forecastHorizon
      ];
      combined.forEach((row) => {
        if (!bigMap.has(row.ds)) {
          bigMap.set(row.ds, { ds: row.ds, y_fact: null });
        }
        const val = bigMap.get(row.ds);
        if (row.y_fact !== undefined && row.y_fact !== null) {
          val.y_fact = row.y_fact;
        }
        if (row.y_forecast !== undefined) {
          val[`${m.modelName}_y_forecast`] = row.y_forecast;
        }
        if (row.yhat_lower !== undefined) {
          val[`${m.modelName}_yhat_lower`] = row.yhat_lower;
        }
        if (row.yhat_upper !== undefined) {
          val[`${m.modelName}_yhat_upper`] = row.yhat_upper;
        }
      });
    });
    const allDs = Array.from(bigMap.keys()).sort((a, b) => new Date(a) - new Date(b));
    return allDs.map((ds) => bigMap.get(ds));
  };

  // Диалог экспорта
  const handleOpenCsvDialog = () => {
    const merged = buildMergedRows();
    setPreviewData(merged.slice(0, 5));
    setCsvDialogOpen(true);
  };
  const handleCloseCsvDialog = () => setCsvDialogOpen(false);

  const handleDownloadSelectedCols = () => {
    const mergedRows = buildMergedRows();
    const finalCols = csvSelectedCols.length ? csvSelectedCols : allPossibleCols;
    const finalData = mergedRows.map((r) => {
      const obj = {};
      finalCols.forEach((col) => {
        obj[col] = r[col] !== undefined ? r[col] : "";
      });
      return obj;
    });
    if (fileType === "csv") {
      const header = finalCols.join(",");
      const rows = finalData.map((row) =>
        finalCols.map((c) => (row[c] !== undefined ? row[c] : "")).join(",")
      );
      const csvContent = [header, ...rows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, "forecast.csv");
    } else {
      const ws = XLSX.utils.json_to_sheet(finalData, { header: finalCols });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "ForecastData");
      XLSX.writeFile(wb, "forecast.xlsx");
    }
    setCsvDialogOpen(false);
  };

  // Обработка вкладок общего графика
  const handleCommonTabChange = (e, val) => setCommonTab(val);
  const handleModelTabChange = (e, val) => setModelTab(val);
  const handleModelSubTabChange = (modelIndex, val) => {
    setModelSubTabs((prev) => ({ ...prev, [modelIndex]: val }));
  };

  // Кнопка "Назад"
  const handleBack = () => navigate(-1);

  // Панель справа
  const panelWidth = 320;
  const toggleModels = () => setModelsOpen((p) => !p);

  const chartOptions = {
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
          }
        },
        grid: { color: "rgba(255,255,255,0.1)" }
      },
      y: {
        ticks: { color: "#fff" },
        grid: { color: "rgba(255,255,255,0.1)" }
      }
    }
  };

  return (
    <Slide direction="left" in={true} mountOnEnter unmountOnExit onExited={handleBack}>
      <Box sx={{ position: "relative", bgcolor: "#1a1a1a", minHeight: "100vh" }}>
        {/* ШАПКА */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 2,
            bgcolor: "#121212",
            color: "#fff"
          }}
        >
          <Button onClick={handleBack} startIcon={<ArrowBackIcon />} sx={{ color: "#fff", mr: 2 }}>
            Назад
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: "center" }}>
            Прогнозирование
          </Typography>
          <IconButton
            onClick={toggleModels}
            sx={{
              color: modelsOpen ? "#FF4444" : "#10A37F",
              border: "1px solid",
              borderColor: modelsOpen ? "#FF4444" : "#10A37F"
            }}
          >
            {modelsOpen ? <CloseIcon /> : <SettingsIcon />}
          </IconButton>
          {/* Интеграция компонента категориальных данных.
              Фильтры извлекаются из sessionStorage (установленные на первой/второй странице) */}
          <CategoricalDataBlock
            filteredData={initialModifiedData}
            selectedColumns={initialSelectedColumns}
            filters={storedFilters}
          />
        </Box>

        {/* ОСНОВНОЙ КОНТЕЙНЕР */}
        <Box
          sx={{
            display: "flex",
            width: "100%",
            height: "calc(100vh - 56px)",
            bgcolor: "#121212"
          }}
        >
          {/* ЛЕВАЯ ЧАСТЬ */}
          <Box
            sx={{
              flexGrow: 1,
              transition: "margin-right 0.3s",
              marginRight: modelsOpen ? `${panelWidth + 16}px` : 0,
              overflowY: "auto",
              "&::-webkit-scrollbar": { display: "none" },
              "-ms-overflow-style": "none",
              "scrollbar-width": "none"
            }}
          >
            {/* Общие параметры прогноза */}
            <Paper sx={{ m: 2, p: 3, borderRadius: 3, backgroundColor: "#2a2a2a" }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Общие параметры прогноза
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography gutterBottom>Горизонт: {horizon}</Typography>
                  <Slider
                    value={horizon}
                    onChange={(e, val) => setHorizon(val)}
                    min={0}
                    max={50}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={{ color: "#10A37F" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography gutterBottom>History (Test Size): {historySize}</Typography>
                  <Slider
                    value={historySize}
                    onChange={(e, val) => setHistorySize(val)}
                    min={0}
                    max={50}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={{ color: "#10A37F" }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Частота</InputLabel>
                    <Select
                      value={freq}
                      label="Частота"
                      onChange={(e) => setFreq(e.target.value)}
                      sx={{ backgroundColor: "#2c2c2c", color: "#fff" }}
                    >
                      <MenuItem value="D">День</MenuItem>
                      <MenuItem value="W-MON">Неделя (Пн)</MenuItem>
                      <MenuItem value="M">Месяц</MenuItem>
                      <MenuItem value="MS">Начало месяца</MenuItem>
                    </Select>
                  </FormControl>
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
              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Button
                  variant="contained"
                  onClick={handleBuildForecast}
                  disabled={loading}
                  sx={{ borderRadius: "20px", backgroundColor: "#10A37F" }}
                >
                  {loading ? <CircularProgress size={24} /> : "Построить прогноз"}
                </Button>
              </Box>
            </Paper>

            {/* Общий график (все модели) */}
            {forecastResults.length > 0 && (
              <Paper sx={{ m: 2, p: 2, borderRadius: 3, backgroundColor: "#2a2a2a" }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Общий график (все модели)
                </Typography>
                <Tabs
                  value={commonTab}
                  onChange={handleCommonTabChange}
                  textColor="inherit"
                  indicatorColor="primary"
                  sx={{ mb: 2 }}
                >
                  <Tab label="All" />
                  <Tab label="Train" />
                  <Tab label="Test" />
                  <Tab label="Horizon" />
                  <Tab label="All+Horizon" />
                </Tabs>
                <Box sx={{ height: 500 }}>
                  {(() => {
                    const subset = forecastResults.map((mRes) => {
                      let segment = [];
                      if (commonTab === 0) segment = mRes.forecastAll;
                      else if (commonTab === 1) segment = mRes.forecastTrain;
                      else if (commonTab === 2) segment = mRes.forecastTest;
                      else if (commonTab === 3) segment = mRes.forecastHorizon;
                      else if (commonTab === 4) segment = [...mRes.forecastAll, ...mRes.forecastHorizon];
                      return { modelName: mRes.modelName, segment };
                    });
                    const data = makeCombinedChartData(subset, modelColorMap);
                    return <Line data={data} options={chartOptions} />;
                  })()}
                </Box>
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleOpenCsvDialog}
                    sx={{ borderRadius: "20px", backgroundColor: "#10A37F" }}
                  >
                    Скачать (All Models)
                  </Button>
                </Box>
              </Paper>
            )}

            {/* Вкладки по отдельным моделям */}
            {forecastResults.length > 0 && (
              <Paper sx={{ m: 2, p: 2, borderRadius: 3, backgroundColor: "#2a2a2a" }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Отдельные модели
                </Typography>
                <Tabs
                  value={modelTab}
                  onChange={handleModelTabChange}
                  textColor="inherit"
                  indicatorColor="primary"
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ mb: 2 }}
                >
                  {forecastResults.map((mRes) => (
                    <Tab key={mRes.modelName} label={mRes.modelName} />
                  ))}
                </Tabs>
                {forecastResults[modelTab] &&
                  (() => {
                    const curModel = forecastResults[modelTab];
                    const color = modelColorMap[curModel.modelName] || "#36A2EB";
                    const subTab = modelSubTabs[modelTab] || 0;
                    const handleSubTabChange = (e, val) => handleModelSubTabChange(modelTab, val);
                    const metricsAll = computeMetricsOnStandardized(curModel.forecastAll);
                    const metricsTrain = computeMetricsOnStandardized(curModel.forecastTrain);
                    const metricsTest = computeMetricsOnStandardized(curModel.forecastTest);
                    const chartAll = makeSingleModelChartData(curModel.forecastAll, color);
                    const chartTrain = makeSingleModelChartData(curModel.forecastTrain, color);
                    const chartTest = makeSingleModelChartData(curModel.forecastTest, color);
                    const chartHorizon = makeSingleModelChartData(curModel.forecastHorizon, color);
                    return (
                      <Box>
                        <Tabs
                          value={subTab}
                          onChange={handleSubTabChange}
                          textColor="inherit"
                          indicatorColor="primary"
                          sx={{ mb: 2 }}
                        >
                          <Tab label="All" disabled={curModel.forecastAll.length === 0} />
                          <Tab label="Train" disabled={curModel.forecastTrain.length === 0} />
                          <Tab label="Test" disabled={curModel.forecastTest.length === 0} />
                          <Tab label="Horizon" disabled={curModel.forecastHorizon.length === 0} />
                        </Tabs>
                        {subTab === 0 && (
                          <Box sx={{ height: 400 }}>
                            <Line data={chartAll} options={chartOptions} />
                            {metricsAll && (
                              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                                <Typography>MAE: {metricsAll.mae.toFixed(4)}</Typography>
                                <Typography>RMSE: {metricsAll.rmse.toFixed(4)}</Typography>
                                {metricsAll.mape && (
                                  <Typography>MAPE: {metricsAll.mape.toFixed(2)}%</Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                        {subTab === 1 && (
                          <Box sx={{ height: 400 }}>
                            <Line data={chartTrain} options={chartOptions} />
                            {metricsTrain && (
                              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                                <Typography>MAE: {metricsTrain.mae.toFixed(4)}</Typography>
                                <Typography>RMSE: {metricsTrain.rmse.toFixed(4)}</Typography>
                                {metricsTrain.mape && (
                                  <Typography>MAPE: {metricsTrain.mape.toFixed(2)}%</Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                        {subTab === 2 && (
                          <Box sx={{ height: 400 }}>
                            <Line data={chartTest} options={chartOptions} />
                            {metricsTest && (
                              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                                <Typography>MAE: {metricsTest.mae.toFixed(4)}</Typography>
                                <Typography>RMSE: {metricsTest.rmse.toFixed(4)}</Typography>
                                {metricsTest.mape && (
                                  <Typography>MAPE: {metricsTest.mape.toFixed(2)}%</Typography>
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                        {subTab === 3 && (
                          <Box sx={{ height: 400 }}>
                            <Line data={chartHorizon} options={chartOptions} />
                            <Typography sx={{ mt: 2 }}>
                              Прогноз будущего (факт отсутствует).
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })()}
              </Paper>
            )}
          </Box>

          {/* Панель справа */}
          <Slide direction="left" in={modelsOpen} mountOnEnter unmountOnExit>
            <Box
              sx={{
                position: "absolute",
                top: 90,
                right: 16,
                width: `${panelWidth}px`,
                height: "calc(100vh - 230px)",
                bgcolor: "#2a2a2a",
                borderRadius: 3,
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
                p: 2,
                overflowY: "auto",
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
                "&::-webkit-scrollbar-thumb": { backgroundColor: "#666", borderRadius: "3px" },
                "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#aaa" }
              }}
            >
              <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
                Модели
              </Typography>
              <ProphetBlock
                active={prophetActive}
                setActive={setProphetActive}
                prophetParams={prophetParams}
                setProphetParams={setProphetParams}
              />
              <Paper
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: 2,
                  border: `2px solid ${arimaActive ? "#10A37F" : "#FF4444"}`,
                  transition: "border-color 0.2s"
                }}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>
                  ARIMA
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {arimaActive ? (
                    <Button
                      variant="outlined"
                      startIcon={<CloseIcon />}
                      sx={{
                        borderColor: "#FF4444",
                        color: "#FF4444",
                        "&:hover": {
                          borderColor: "#FF4444",
                          backgroundColor: "#ff44441a"
                        }
                      }}
                      onClick={() => setArimaActive(false)}
                    >
                      Отключить
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<CheckIcon />}
                      sx={{
                        borderColor: "#10A37F",
                        color: "#10A37F",
                        "&:hover": {
                          borderColor: "#10A37F",
                          backgroundColor: "#10A37F1a"
                        }
                      }}
                      onClick={() => setArimaActive(true)}
                    >
                      Активировать
                    </Button>
                  )}
                </Box>
                <Typography variant="caption" sx={{ color: arimaActive ? "#10A37F" : "#FF4444" }}>
                  {arimaActive ? "Активна" : "Выключена"}
                </Typography>
              </Paper>
            </Box>
          </Slide>
        </Box>

        {/* Диалог экспорта */}
        <Dialog open={csvDialogOpen} onClose={handleCloseCsvDialog} fullWidth maxWidth="md">
          <DialogTitle>Сохранить результаты</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Выберите столбцы и формат файла:
            </Typography>
            <RadioGroup
              row
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              sx={{ mb: 2 }}
            >
              <FormControlLabel value="csv" control={<Radio />} label="CSV" />
              <FormControlLabel value="xlsx" control={<Radio />} label="XLSX" />
            </RadioGroup>
            {!allPossibleCols.length ? (
              <Typography>Нет доступных столбцов</Typography>
            ) : (
              <>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {allPossibleCols.map((col) => (
                    <FormControlLabel
                      key={col}
                      control={
                        <Checkbox
                          checked={csvSelectedCols.includes(col)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCsvSelectedCols((prev) => [...prev, col]);
                            } else {
                              setCsvSelectedCols((prev) => prev.filter((c) => c !== col));
                            }
                          }}
                        />
                      }
                      label={col}
                    />
                  ))}
                </Box>
                {previewData && previewData.length > 0 && (
                  <Box sx={{ mt: 2, overflowX: "auto" }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Превью (первые 5 строк):
                    </Typography>
                    <table
                      style={{
                        borderCollapse: "collapse",
                        width: "100%",
                        color: "#fff",
                        fontSize: "0.85rem"
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: "#333" }}>
                          {csvSelectedCols.map((col) => (
                            <th key={col} style={{ border: "1px solid #555", padding: "4px" }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr key={idx}>
                            {csvSelectedCols.map((col) => (
                              <td key={col} style={{ border: "1px solid #555", padding: "4px" }}>
                                {row[col] !== undefined ? row[col] : ""}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCsvDialog}>Отмена</Button>
            <Button variant="contained" onClick={handleDownloadSelectedCols}>
              Скачать
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Slide>
  );
}
