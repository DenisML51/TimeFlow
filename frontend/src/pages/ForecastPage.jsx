import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  memo,
} from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  Grid,
  Slider,
  TextField,
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
  Slide,
  Chip,
  useTheme,
  alpha,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ShowChartIcon,
  Percent as PercentIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Line, Bar } from "react-chartjs-2";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { DashboardContext } from "../context/DashboardContext";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Canvas } from "@react-three/fiber";
import { ParticleBackground } from "../components/home/ParticleBackground";
import CategoricalDataBlock from "../components/CategoricalDataBlock";
import { LSTMBlock } from "../components/models/LSTMBlock";
import { GRUBlock } from "../components/models/GRUBlock";
import { TransformerBlock } from "../components/models/TransformerBlock";
import { SarimaBlock } from "../components/models/SARIMABlock";
import { ProphetBlock } from "../components/models/ProphetBlock";
import { XGBoostBlock } from "../components/models/XGBoostBlock";
import GlassPaper from "../components/GlassPaper";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// ----------------------
// Вспомогательные функции
// ----------------------
function computeMetricsOnStandardized(dataArray) {
  const rowsWithFact = dataArray.filter(
    (d) => d.y_fact !== null && d.y_fact !== undefined
  );
  if (!rowsWithFact.length) return null;
  const facts = rowsWithFact.map((d) => d.y_fact);
  const preds = rowsWithFact.map((d) => d.y_forecast);
  const combined = [...facts, ...preds];
  const mean = combined.reduce((acc, v) => acc + v, 0) / combined.length;
  const variance =
    combined.reduce((acc, v) => acc + (v - mean) ** 2, 0) / combined.length;
  const std = Math.sqrt(variance);
  if (std === 0) return { mae: 0, rmse: 0, mape: 0 };
  const factsScaled = facts.map((f) => (f - mean) / std);
  const predsScaled = preds.map((p) => (p - mean) / std);
  let sumAbs = 0,
    sumSq = 0,
    sumPct = 0,
    countPct = 0;
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

function makeSingleModelChartData(dataArray, modelColor) {
  return {
    labels: dataArray.map((d) => d.ds),
    datasets: [
      {
        label: "Факт",
        data: dataArray.map((d) => d.y_fact),
        borderColor: "#14c59a",
        backgroundColor: "#14c59a",
        borderWidth: 0.9,
        pointRadius: 1,
        fill: false,
        order: 0,
      },
      {
        label: "Прогноз",
        data: dataArray.map((d) => d.y_forecast),
        borderColor: modelColor,
        backgroundColor: modelColor,
        borderDash: [6, 6],
        borderWidth: 1,
        pointRadius: 2,
        fill: false,
        order: 1,
      },
      {
        label: "Нижняя",
        data: dataArray.map((d) => d.yhat_lower),
        fill: "-1",
        backgroundColor: `${modelColor}33`,
        borderColor: `${modelColor}33`,
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0,
        order: 1,
      },
      {
        label: "Верхняя",
        data: dataArray.map((d) => d.yhat_upper),
        fill: "-1",
        backgroundColor: `${modelColor}33`,
        borderColor: `${modelColor}33`,
        borderDash: [5, 5],
        borderWidth: 1,
        pointRadius: 0,
        order: 1,
      },
    ],
  };
}

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
      borderColor: "#14c59a",
      backgroundColor: "#14c59a",
      borderWidth: 0.9,
      pointRadius: 1,
      fill: false,
      order: 0,
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
      fill: false,
      order: 1,
    });
  });
  return { labels, datasets };
}

function getChipBorderColor(value, type) {
  if (value === null || value === undefined) return "#666";
  if (type === "mae" || type === "rmse")
    return value < 1 ? "#4CAF50" : value < 5 ? "#FFC107" : "#F44336";
  if (type === "mape")
    return value < 10 ? "#4CAF50" : value < 20 ? "#FFC107" : "#F44336";
  return "#666";
}

const AnimatedMetricChip = memo(function AnimatedMetricChip({ label, value, type, icon }) {
  return (
    <Chip
      icon={icon}
      label={`${label}: ${value !== null ? value.toFixed(4) : "N/A"}`}
      sx={{
        fontSize: "0.9rem",
        fontWeight: "bold",
        border: `2px solid ${getChipBorderColor(value, type)}`,
        backgroundColor: "transparent",
        color: getChipBorderColor(value, type),
        transition: "all 0.3s ease-in-out",
        "& .MuiChip-icon": { color: getChipBorderColor(value, type) },
        "&:hover": {
          backgroundColor: getChipBorderColor(value, type),
          color: "#121212",
          "& .MuiChip-icon": { color: "#121212" },
        },
      }}
    />
  );
});

const SpinnerOverlay = () => (
  <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
      backgroundColor: alpha("#000", 0.25),
    }}
  >
    <CircularProgress size={48} sx={{ color: (theme) => theme.palette.primary.main }} />
  </Box>
);

export default function ForecastPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    forecastPageState,
    setForecastPageState,
    forecastResults,
    setForecastResults,
    selectedColumns,
    filteredData,
    setIsDirty,
    filters,
    saveSessionNow,
  } = useContext(DashboardContext);

  const theme = useTheme();

  // Получаем данные, переданные через location.state
  const stateModifiedData = location.state?.modifiedData || [];
  const stateSelectedColumns = location.state?.selectedColumns || [];
  const initialModifiedData = stateModifiedData.length ? stateModifiedData : [];
  const initialSelectedColumns = stateSelectedColumns.length ? stateSelectedColumns : [];

  useEffect(() => {
    if (!initialModifiedData || initialModifiedData.length === 0 || initialSelectedColumns.length < 2) {
      navigate(-1);
    }
  }, [initialModifiedData, initialSelectedColumns, navigate]);

  // Сохраняем сессию при размонтировании страницы
  useEffect(() => {
    return () => {
      saveSessionNow();
    };
  }, [saveSessionNow]);

  const {
    prophetActive,
    prophetParams,
    xgboostActive,
    xgboostParams,
    sarimaActive,
    sarimaParams,
    lstmActive,
    lstmParams,
    gruActive,
    gruParams,
    transformerActive,
    transformerParams,
    commonTab,
    modelTab,
    modelSubTabs,
    modelsOpen,
    csvSelectedCols,
    fileType,
    horizon,
    historySize,
    freq,
    confidenceLevel,
  } = forecastPageState;

  const [localCommonParams, setLocalCommonParams] = useState({
    horizon: horizon,
    historySize: historySize,
    freq: freq,
    confidenceLevel: confidenceLevel,
  });
  const [freqError, setFreqError] = useState("");
  const validFreqRegex = /^[A-Z]+(-[A-Z]+)?$/;
  const [allPossibleCols, setAllPossibleCols] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [csvCategoricalCols, setCsvCategoricalCols] = useState([]);

  const forecastsRunning = useMemo(
    () => forecastResults.some((res) => res.status === "PENDING"),
    [forecastResults]
  );

  useEffect(() => {
    const colSet = new Set(["ds", "y_fact"]);
    forecastResults.forEach((m) => {
      const arr = [
        ...m.forecastAll,
        ...m.forecastTrain,
        ...m.forecastTest,
        ...m.forecastHorizon,
      ];
      arr.forEach((row) => {
        if (row.y_forecast !== undefined && row.y_forecast !== "")
          colSet.add(`${m.modelName}_y_forecast`);
        if (row.yhat_lower !== undefined && row.yhat_lower !== "")
          colSet.add(`${m.modelName}_yhat_lower`);
        if (row.yhat_upper !== undefined && row.yhat_upper !== "")
          colSet.add(`${m.modelName}_yhat_upper`);
      });
    });
    setAllPossibleCols(Array.from(colSet));
  }, [forecastResults]);

  const categoricalCandidates = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    const candidates = [];
    const keys = Object.keys(filteredData[0]);
    keys.forEach((key) => {
      if (!allPossibleCols.includes(key)) {
        const uniqueSet = new Set(filteredData.map((row) => row[key]));
        if (uniqueSet.size === 1) {
          candidates.push({ column: key, value: [...uniqueSet][0] });
        }
      }
    });
    return candidates;
  }, [filteredData, allPossibleCols]);

  const mergedRows = useMemo(() => {
    const bigMap = new Map();
    forecastResults.forEach((m) => {
      const combined = [
        ...m.forecastAll,
        ...m.forecastTrain,
        ...m.forecastTest,
        ...m.forecastHorizon,
      ];
      combined.forEach((row) => {
        if (!bigMap.has(row.ds)) {
          bigMap.set(row.ds, { ds: row.ds, y_fact: null });
        }
        const val = bigMap.get(row.ds);
        if (row.y_fact != null) val.y_fact = row.y_fact;
        if (row.y_forecast != null)
          val[`${m.modelName}_y_forecast`] = row.y_forecast;
        if (row.yhat_lower != null)
          val[`${m.modelName}_yhat_lower`] = row.yhat_lower;
        if (row.yhat_upper != null)
          val[`${m.modelName}_yhat_upper`] = row.yhat_upper;
      });
    });
    const allDs = Array.from(bigMap.keys()).sort((a, b) => new Date(a) - new Date(b));
    return allDs.map((ds) => bigMap.get(ds));
  }, [forecastResults]);

  const modelColorMap = useMemo(() => {
    return {
      Prophet: theme.palette.info.main,
      XGBoost: theme.palette.error.main,
      SARIMA: theme.palette.primary.secondary,
      LSTM: theme.palette.primary.main,
      Transformer: theme.palette.success.main,
      GRU: theme.palette.primary.main,
      factColor: theme.palette.primary.main,
    };
  }, [theme]);

  const combinedChartData = useMemo(() => {
    const subset = forecastResults.map((mRes) => {
      let segment = [];
      if (commonTab === 0) segment = mRes.forecastAll;
      else if (commonTab === 1) segment = mRes.forecastTrain;
      else if (commonTab === 2) segment = mRes.forecastTest;
      else if (commonTab === 3) segment = mRes.forecastHorizon;
      else if (commonTab === 4)
        segment = [...mRes.forecastAll, ...mRes.forecastHorizon];
      return { modelName: mRes.modelName, segment };
    });
    return makeCombinedChartData(subset, modelColorMap);
  }, [forecastResults, commonTab, modelColorMap]);

  const [csvDialogOpen, setCsvDialogOpen] = useState(false);

  const computedPreviewData = useMemo(() => {
    const finalForecastCols = csvSelectedCols.length ? csvSelectedCols : allPossibleCols;
    return mergedRows.slice(0, 5).map((r) => {
      const obj = {};
      finalForecastCols.forEach((col) => {
        obj[col] = r[col] !== undefined ? r[col] : "";
      });
      csvCategoricalCols.forEach((col) => {
        const candidate = categoricalCandidates.find((c) => c.column === col);
        obj[col] = candidate ? candidate.value : "";
      });
      return obj;
    });
  }, [mergedRows, csvSelectedCols, csvCategoricalCols, allPossibleCols, categoricalCandidates]);

  const handleOpenCsvDialog = useCallback(() => {
    setCsvDialogOpen(true);
  }, []);

  const handleCloseCsvDialog = useCallback(() => setCsvDialogOpen(false), []);

  const handleDownloadSelectedCols = useCallback(() => {
    const finalForecastCols = csvSelectedCols.length ? csvSelectedCols : allPossibleCols;
    const finalCols = [...finalForecastCols, ...csvCategoricalCols];
    const finalData = mergedRows.map((r) => {
      const obj = {};
      finalForecastCols.forEach((col) => {
        obj[col] = r[col] !== undefined ? r[col] : "";
      });
      csvCategoricalCols.forEach((col) => {
        const candidate = categoricalCandidates.find((c) => c.column === col);
        obj[col] = candidate ? candidate.value : "";
      });
      return obj;
    });
    if (fileType === "csv") {
      const header = finalCols.join(",");
      const rows = finalData.map((row) =>
        finalCols.map((c) => (row[c] || "")).join(",")
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
  }, [allPossibleCols, csvSelectedCols, fileType, mergedRows, csvCategoricalCols, categoricalCandidates]);

  const handleCommonTabChange = useCallback((e, val) => {
    setForecastPageState((prev) => ({ ...prev, commonTab: val }));
  }, [setForecastPageState]);

  const handleModelTabChange = useCallback((e, val) => {
    setForecastPageState((prev) => ({ ...prev, modelTab: val }));
  }, [setForecastPageState]);

  const handleModelSubTabChange = useCallback((modelIndex, val) => {
    setForecastPageState((prev) => ({
      ...prev,
      modelSubTabs: { ...prev.modelSubTabs, [modelIndex]: val },
    }));
  }, [setForecastPageState]);

  const handleBack = useCallback(() => {
    // Перед переходом назад сохраняем сессию
    saveSessionNow();
    navigate(-1);
  }, [navigate, saveSessionNow]);

  const toggleModels = useCallback(() => {
    setForecastPageState((prev) => {
      const newState = { ...prev, modelsOpen: !prev.modelsOpen };
      setIsDirty(true);
      return newState;
    });
  }, [setForecastPageState, setIsDirty]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: theme.palette.common.white } } },
      scales: {
        x: {
          ticks: {
            color: theme.palette.common.white,
            callback: function (value) {
              const label = this.getLabelForValue(value);
              return label ? label.slice(0, 10) : "";
            },
          },
          grid: { color: alpha(theme.palette.common.white, 0.1) },
        },
        y: {
          ticks: { color: theme.palette.common.white },
          grid: { color: alpha(theme.palette.common.white, 0.1) },
        },
      },
    }),
    [theme]
  );

  // Функция опроса статуса задачи
  const pollTaskStatus = useCallback((taskId, modelName) => {
    if (!taskId) return;
    const intervalId = setInterval(async () => {
      try {
        const statusResp = await axios.get(
          `http://localhost:8000/api/forecast/status/${taskId}`
        );
        if (statusResp.data.status !== "PENDING") {
          clearInterval(intervalId);
          const { forecast_all, forecast_train, forecast_test, forecast_horizon } =
            statusResp.data.result;
          setForecastResults((prevResults) =>
            prevResults.map((res) =>
              res.modelName === modelName
                ? {
                    ...res,
                    forecastAll: forecast_all || [],
                    forecastTrain: forecast_train || [],
                    forecastTest: forecast_test || [],
                    forecastHorizon: forecast_horizon || [],
                    status: statusResp.data.status,
                  }
                : res
            )
          );
        }
      } catch (error) {
        console.error("Ошибка при опросе статуса задачи:", error);
        clearInterval(intervalId);
      }
    }, 3000);
  }, [setForecastResults]);

  const [localIsLoading, setLocalIsLoading] = useState(false);

  // Обработчик кнопки "Построить прогноз"
  const handleForecast = useCallback(async () => {
    if (!validFreqRegex.test(localCommonParams.freq)) {
      setFreqError("Некорректная частота");
      return;
    }
    if (forecastsRunning) return;
    setLocalIsLoading(true);
    setForecastPageState((prev) => ({
      ...prev,
      horizon: localCommonParams.horizon,
      historySize: localCommonParams.historySize,
      freq: localCommonParams.freq,
      confidenceLevel: localCommonParams.confidenceLevel,
    }));
    try {
      const activeModels = [];
      if (prophetActive)
        activeModels.push({ model: "Prophet", uniqueParams: prophetParams });
      if (xgboostActive)
        activeModels.push({ model: "XGBoost", uniqueParams: xgboostParams });
      if (sarimaActive)
        activeModels.push({ model: "SARIMA", uniqueParams: sarimaParams });
      if (lstmActive)
        activeModels.push({ model: "LSTM", uniqueParams: lstmParams });
      if (gruActive)
        activeModels.push({ model: "GRU", uniqueParams: gruParams });
      if (transformerActive)
        activeModels.push({ model: "Transformer", uniqueParams: transformerParams });

      const newResults = [];
      for (let m of activeModels) {
        const payload = {
          model: m.model,
          uniqueParams: m.uniqueParams,
          horizon: localCommonParams.horizon,
          history: localCommonParams.historySize,
          dt_name: initialSelectedColumns[0] || "ds",
          y_name: initialSelectedColumns[1] || "y",
          freq: localCommonParams.freq,
          confidence_level: localCommonParams.confidenceLevel,
          data: initialModifiedData,
        };
        const resp = await axios.post("http://localhost:8000/api/forecast", payload);
        if (!resp.data.task_id) {
          console.error("Task ID отсутствует для модели", m.model);
          continue;
        }
        newResults.push({
          modelName: m.model,
          taskId: resp.data.task_id,
          status: "PENDING",
          forecastAll: [],
          forecastTrain: [],
          forecastTest: [],
          forecastHorizon: [],
        });
        pollTaskStatus(resp.data.task_id, m.model);
      }
      setForecastResults(newResults);
    } catch (err) {
      console.error("Ошибка прогноза:", err);
    } finally {
      setLocalIsLoading(false);
    }
  }, [
    localCommonParams,
    initialModifiedData,
    initialSelectedColumns,
    prophetActive,
    prophetParams,
    xgboostActive,
    xgboostParams,
    sarimaActive,
    sarimaParams,
    lstmActive,
    lstmParams,
    gruActive,
    gruParams,
    transformerActive,
    transformerParams,
    pollTaskStatus,
    setForecastPageState,
    setForecastResults,
    validFreqRegex,
    forecastsRunning,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <Canvas camera={{ position: [0, 0, 1] }} style={{ position: "fixed", top: 0, left: 0 }}>
        <ParticleBackground />
      </Canvas>
      <Box sx={{ position: "relative", minHeight: "100vh" }}>
        {/* Header Section */}
        <Box sx={{ display: "flex", justifyContent: "space-between", m: 2, pt: 2 }}>
          <Button
            variant="contained"
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            sx={{
              background: alpha(theme.palette.primary.main, 0.15),
              color: theme.palette.primary.main,
              borderRadius: "12px",
              px: 3,
              "&:hover": { background: alpha(theme.palette.primary.main, 0.3) },
            }}
          >
            Назад
          </Button>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.secondary} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Прогнозирование
          </Typography>
          <Button></Button>
        </Box>
        <Box sx={{ pt: 2 }}>
          <CategoricalDataBlock filteredData={filteredData} selectedColumns={selectedColumns} filters={filters} />
        </Box>
        <Box sx={{ position: "relative", width: "100%", height: "calc(100vh - 56px)", alignItems: "center" }}>
          <Box
            sx={{
              flexGrow: 1,
              pr: 2,
              pl: 2,
              pt: 2,
              transition: "margin-right 0.3s",
              marginRight: modelsOpen ? "336px" : 0,
              overflowY: "auto",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            <GlassPaper>
              <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", mb: 3, justifyContent: "space-between" }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Общие параметры прогноза
                </Typography>
                <Button
                  variant="contained"
                  onClick={() =>
                    setForecastPageState((prev) => {
                      const newState = { ...prev, modelsOpen: !prev.modelsOpen };
                      setIsDirty(true);
                      return newState;
                    })
                  }
                  startIcon={<SettingsIcon />}
                  sx={{
                    background: alpha(theme.palette.primary.main, 0.15),
                    color: theme.palette.primary.main,
                    borderRadius: "12px",
                  }}
                >
                  Модели
                </Button>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography gutterBottom>Горизонт: {localCommonParams.horizon}</Typography>
                  <Slider
                    value={localCommonParams.horizon}
                    onChange={(e, val) =>
                      setLocalCommonParams((prev) => ({ ...prev, horizon: val }))
                    }
                    min={0}
                    max={50}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography gutterBottom>
                    History (Test Size): {localCommonParams.historySize}
                  </Typography>
                  <Slider
                    value={localCommonParams.historySize}
                    onChange={(e, val) =>
                      setLocalCommonParams((prev) => ({ ...prev, historySize: val }))
                    }
                    min={0}
                    max={50}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Частота"
                    value={localCommonParams.freq}
                    error={!!freqError}
                    placeholder={freqError ? "Частота некорректная" : ""}
                    onChange={(e) =>
                      setLocalCommonParams((prev) => ({ ...prev, freq: e.target.value }))
                    }
                    onFocus={() => setFreqError("")}
                    variant="outlined"
                    fullWidth
                    sx={{
                      background: theme.custom.headerBackground,
                      borderRadius: "10px",
                      input: { color: theme.palette.common.white },
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: freqError ? "red" : theme.palette.common.white,
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography gutterBottom>
                    Уровень доверия: {localCommonParams.confidenceLevel}%
                  </Typography>
                  <Slider
                    value={localCommonParams.confidenceLevel}
                    onChange={(e, val) =>
                      setLocalCommonParams((prev) => ({ ...prev, confidenceLevel: val }))
                    }
                    min={80}
                    max={99}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, textAlign: "center" }}>
                <Button
                  variant="contained"
                  onClick={handleForecast}
                  disabled={localIsLoading || forecastsRunning}
                  sx={{
                    borderRadius: "12px",
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.secondary})`,
                    color: theme.palette.common.black,
                    px: 3,
                    "&:hover": {
                      background: `linear-gradient(45deg, ${theme.palette.primary.secondary}, ${theme.palette.primary.main})`,
                    },
                  }}
                >
                  {(localIsLoading || forecastsRunning) ? (
                    <CircularProgress size={24} sx={{ color: theme.palette.common.black }} />
                  ) : (
                    "Построить прогноз"
                  )}
                </Button>
              </Box>
            </GlassPaper>
            {forecastResults.length > 0 && (
              <GlassPaper
                sx={{
                  m: 2,
                  borderRadius: "16px",
                  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                  p: 3,
                  position: "relative",
                }}
              >
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
                <Box sx={{ height: 500, position: "relative" }}>
                  <Line data={combinedChartData} options={chartOptions} />
                  {forecastResults.some((m) => m.status === "PENDING") && <SpinnerOverlay />}
                </Box>
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleOpenCsvDialog}
                    sx={{
                      borderRadius: "12px",
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.secondary})`,
                      color: theme.palette.common.black,
                      px: 3,
                      "&:hover": {
                        background: `linear-gradient(45deg, ${theme.palette.primary.secondary}, ${theme.palette.primary.main})`,
                      },
                    }}
                  >
                    Скачать (All Models)
                  </Button>
                </Box>
              </GlassPaper>
            )}
            {forecastResults.length > 0 && (
              <GlassPaper
                sx={{
                  m: 2,
                  borderRadius: "16px",
                  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                  p: 3,
                  position: "relative",
                }}
              >
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
                    const modelColorMap = {
                      Prophet: theme.palette.info.main,
                      XGBoost: theme.palette.error.main,
                      SARIMA: theme.palette.primary.secondary,
                      LSTM: theme.palette.primary.main,
                      GRU: theme.palette.primary.main,
                    };
                    const color = modelColorMap[curModel.modelName] || theme.palette.info.main;
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
                          <Box sx={{ height: 400, position: "relative" }}>
                            <Line data={chartAll} options={chartOptions} />
                            {curModel.status === "PENDING" && <SpinnerOverlay />}
                            {metricsAll && (
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2, pt: 3, pb: 10 }}>
                                <AnimatedMetricChip label="MAE" value={metricsAll.mae} type="mae" icon={<TrendingDownIcon />} />
                                <AnimatedMetricChip label="RMSE" value={metricsAll.rmse} type="rmse" icon={<ShowChartIcon />} />
                                {metricsAll.mape !== null && (
                                  <AnimatedMetricChip label="MAPE" value={metricsAll.mape} type="mape" icon={<PercentIcon />} />
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                        {subTab === 1 && (
                          <Box sx={{ height: 400, position: "relative" }}>
                            <Line data={chartTrain} options={chartOptions} />
                            {curModel.status === "PENDING" && <SpinnerOverlay />}
                            {metricsTrain && (
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2, pt: 3, pb: 10 }}>
                                <AnimatedMetricChip label="MAE" value={metricsTrain.mae} type="mae" icon={<TrendingDownIcon />} />
                                <AnimatedMetricChip label="RMSE" value={metricsTrain.rmse} type="rmse" icon={<ShowChartIcon />} />
                                {metricsTrain.mape !== null && (
                                  <AnimatedMetricChip label="MAPE" value={metricsTrain.mape} type="mape" icon={<PercentIcon />} />
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                        {subTab === 2 && (
                          <Box sx={{ height: 400, position: "relative" }}>
                            <Line data={chartTest} options={chartOptions} />
                            {curModel.status === "PENDING" && <SpinnerOverlay />}
                            {metricsTest && (
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2, pt: 3, pb: 10 }}>
                                <AnimatedMetricChip label="MAE" value={metricsTest.mae} type="mae" icon={<TrendingDownIcon />} />
                                <AnimatedMetricChip label="RMSE" value={metricsTest.rmse} type="rmse" icon={<ShowChartIcon />} />
                                {metricsTest.mape !== null && (
                                  <AnimatedMetricChip label="MAPE" value={metricsTest.mape} type="mape" icon={<PercentIcon />} />
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                        {subTab === 3 && (
                          <Box sx={{ height: 400, position: "relative", pt: 5 }}>
                            <Line data={chartHorizon} options={chartOptions} />
                            {curModel.status === "PENDING" && <SpinnerOverlay />}
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2, pt: 3, pb: 10 }}>
                              <Typography sx={{ mt: 2 }}>
                                Прогноз будущего (факт отсутствует).
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </Box>
                    );
                  })()}
              </GlassPaper>
            )}
          </Box>
          <Slide direction="left" in={modelsOpen}>
            <Box
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                width: "320px",
                background: theme.custom.headerBackground,
                borderRadius: "16px",
                border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                height: "calc(100vh - 72px)",
                p: 2,
                overflowY: "auto",
                "&::-webkit-scrollbar": { width: 0 },
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <Typography variant="h6" sx={{ color: theme.palette.common.white, mb: 2 }}>
                Модели
              </Typography>
              <ProphetBlock
                active={prophetActive}
                setActive={(val) =>
                  setForecastPageState((prev) => ({ ...prev, prophetActive: val }))
                }
                prophetParams={prophetParams}
                setProphetParams={(params) =>
                  setForecastPageState((prev) => ({ ...prev, prophetParams: params }))
                }
              />
              <XGBoostBlock
                active={xgboostActive}
                setActive={(val) =>
                  setForecastPageState((prev) => ({ ...prev, xgboostActive: val }))
                }
                xgboostParams={xgboostParams}
                setXgboostParams={(params) =>
                  setForecastPageState((prev) => ({ ...prev, xgboostParams: params }))
                }
              />
              <SarimaBlock
                active={sarimaActive}
                setActive={(val) =>
                  setForecastPageState((prev) => ({ ...prev, sarimaActive: val }))
                }
                sarimaParams={sarimaParams}
                setSarimaParams={(params) =>
                  setForecastPageState((prev) => ({ ...prev, sarimaParams: params }))
                }
              />
              <LSTMBlock
                active={lstmActive}
                setActive={(val) =>
                  setForecastPageState((prev) => ({ ...prev, lstmActive: val }))
                }
                lstmParams={lstmParams}
                setLstmParams={(params) =>
                  setForecastPageState((prev) => ({ ...prev, lstmParams: params }))
                }
              />
              <GRUBlock
                active={gruActive}
                setActive={(val) =>
                  setForecastPageState((prev) => ({ ...prev, gruActive: val }))
                }
                gruParams={gruParams}
                setGruParams={(params) =>
                  setForecastPageState((prev) => ({ ...prev, gruParams: params }))
                }
              />
              <TransformerBlock
                active={transformerActive}
                setActive={(val) =>
                  setForecastPageState((prev) => ({ ...prev, transformerActive: val }))
                }
                transformerParams={transformerParams}
                setTransformerParams={(params) =>
                  setForecastPageState((prev) => ({ ...prev, transformerParams: params }))
                }
              />
            </Box>
          </Slide>
        </Box>
        <Dialog
          open={csvDialogOpen}
          onClose={handleCloseCsvDialog}
          fullWidth
          maxWidth="md"
          PaperProps={{
            sx: {
              background: alpha(theme.palette.background.paper, 0.9),
              backdropFilter: "blur(12px)",
              borderRadius: "16px",
              border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            },
          }}
        >
          <DialogTitle
            sx={{
              color: theme.palette.common.white,
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.secondary} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Сохранить результаты
          </DialogTitle>
          <DialogContent dividers sx={{ color: theme.palette.common.white }}>
            {/* Секция выбора категориальных переменных */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.primary.main }}>
                Категориальные переменные
              </Typography>
              {categoricalCandidates.length > 0 ? (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {categoricalCandidates.map((candidate) => (
                    <Chip
                      key={candidate.column}
                      label={candidate.column}
                      variant={csvCategoricalCols.includes(candidate.column) ? "filled" : "outlined"}
                      onClick={() => {
                        setCsvCategoricalCols((prev) =>
                          prev.includes(candidate.column)
                            ? prev.filter((c) => c !== candidate.column)
                            : [...prev, candidate.column]
                        );
                      }}
                      sx={{
                        borderColor: theme.palette.primary.main,
                        color: csvCategoricalCols.includes(candidate.column)
                          ? theme.palette.common.black
                          : theme.palette.primary.main,
                        bgcolor: csvCategoricalCols.includes(candidate.column)
                          ? theme.palette.primary.main
                          : "transparent",
                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                      }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Нет доступных категориальных переменных
                </Typography>
              )}
            </Box>
            {/* Выбор формата файла */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.primary.main }}>
                Формат файла
              </Typography>
              <RadioGroup
                row
                value={fileType}
                onChange={(e) =>
                  setForecastPageState((prev) => ({ ...prev, fileType: e.target.value }))
                }
                sx={{ gap: 2 }}
              >
                <FormControlLabel
                  value="csv"
                  control={<Radio sx={{ color: theme.palette.primary.main, "&.Mui-checked": { color: theme.palette.success.main } }} />}
                  label="CSV"
                  sx={{ color: theme.palette.common.white }}
                />
                <FormControlLabel
                  value="xlsx"
                  control={<Radio sx={{ color: theme.palette.primary.main, "&.Mui-checked": { color: theme.palette.success.main } }} />}
                  label="Excel"
                  sx={{ color: theme.palette.common.white }}
                />
              </RadioGroup>
            </Box>
            {/* Выбор столбцов */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.primary.main }}>
                Выберите столбцы
              </Typography>
              <Box
                sx={{
                  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                  borderRadius: "8px",
                  p: 2,
                  maxHeight: 200,
                  overflowY: "auto",
                  "&::-webkit-scrollbar": { width: "8px" },
                  "&::-webkit-scrollbar-track": { background: "transparent" },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: alpha(theme.palette.primary.main, 0.4),
                    borderRadius: "4px",
                    border: "2px solid transparent",
                    backgroundClip: "content-box",
                  },
                }}
              >
                {allPossibleCols.map((col) => (
                  <FormControlLabel
                    key={col}
                    control={
                      <Checkbox
                        checked={csvSelectedCols.includes(col)}
                        onChange={(e) =>
                          setForecastPageState((prev) => ({
                            ...prev,
                            csvSelectedCols: e.target.checked
                              ? [...prev.csvSelectedCols, col]
                              : prev.csvSelectedCols.filter((c) => c !== col),
                          }))
                        }
                        sx={{ color: theme.palette.primary.main, "&.Mui-checked": { color: theme.palette.success.main } }}
                      />
                    }
                    label={col}
                    sx={{ color: theme.palette.common.white, width: "100%", m: 0 }}
                  />
                ))}
              </Box>
            </Box>
            {computedPreviewData.length > 0 && (
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1, color: theme.palette.primary.main }}>
                  Предпросмотр данных
                </Typography>
                <Paper sx={{ background: alpha(theme.palette.common.white, 0.05), p: 1 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}` }}>
                        {[...csvSelectedCols, ...csvCategoricalCols].map((col) => (
                          <th
                            key={col}
                            style={{
                              padding: "8px",
                              textAlign: "left",
                              color: theme.palette.primary.main,
                              fontSize: "0.8rem",
                            }}
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {computedPreviewData.map((row, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}` }}>
                          {[...csvSelectedCols, ...csvCategoricalCols].map((col) => (
                            <td
                              key={col}
                              style={{
                                padding: "8px",
                                color: theme.palette.common.white,
                                fontSize: "0.8rem",
                              }}
                            >
                              {row[col] ?? ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Paper>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: `1px solid ${alpha(theme.palette.common.white, 0.1)}` }}>
            <Button
              onClick={handleCloseCsvDialog}
              sx={{
                color: theme.palette.primary.main,
                border: `1px solid ${theme.palette.primary.main}`,
                borderRadius: "8px",
                px: 3,
                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.2) },
              }}
            >
              Отмена
            </Button>
            <Button
              onClick={handleDownloadSelectedCols}
              sx={{
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.secondary})`,
                color: theme.palette.common.black,
                borderRadius: "8px",
                px: 3,
                ml: 2,
                "&:hover": {
                  background: `linear-gradient(45deg, ${theme.palette.primary.secondary}, ${theme.palette.primary.main})`,
                  boxShadow: `0 0 8px ${alpha(theme.palette.primary.main, 0.5)}`,
                },
              }}
            >
              Скачать
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </motion.div>
  );
}
