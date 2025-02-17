import React, {
  useEffect,
  useContext,
  useMemo,
  useCallback,
  memo,
  useState,
} from "react";
import {
  Box,
  Button,
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
  Slide,
  Collapse,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ShowChartIcon,
  Percent as PercentIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { Line } from "react-chartjs-2";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import CategoricalDataBlock from "../components/CategoricalDataBlock";
import { DashboardContext } from "../context/DashboardContext";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { FloatingLinesBackground } from "../components/AnimatedBackground";
import {Canvas} from "@react-three/fiber";
import {ParticleBackground} from "../components/home/ParticleBackground";

// ================================================
// Вспомогательные функции (метрики, графики)
// ================================================

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
  const labels = Array.from(allDates).sort(
    (a, b) => new Date(a) - new Date(b)
  );

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

// ================================================
// Компоненты для настройки моделей (Prophet, XGBoost, SARIMA)
// ================================================

const ProphetBlock = memo(function ProphetBlock({
  active,
  setActive,
  prophetParams,
  setProphetParams,
}) {
  const [localSeasonalityMode, setLocalSeasonalityMode] = useState(
    prophetParams.seasonality_mode || "additive"
  );
  const [paramsOpen, setParamsOpen] = useState(false);

  useEffect(() => {
    setProphetParams((prev) => ({
      ...prev,
      seasonality_mode: localSeasonalityMode,
    }));
  }, [localSeasonalityMode, setProphetParams]);

  const handleApply = useCallback(() => setActive(true), [setActive]);
  const handleCancel = useCallback(() => setActive(false), [setActive]);
  const toggleParams = useCallback(() => setParamsOpen((prev) => !prev), []);
  const borderColor = active ? "#10A37F" : "#FF4444";

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        border: `2px solid ${borderColor}`,
        borderRadius: 2,
        transition: "border-color 0.2s",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>
          Prophet
        </Typography>
        <Button onClick={toggleParams} variant="text" sx={{ color: "#10A37F" }}>
          {paramsOpen ? "Скрыть параметры" : "Показать параметры"}
        </Button>
      </Box>
      <Collapse in={paramsOpen}>
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
        </Box>
      </Collapse>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
        {active ? (
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            sx={{
              borderColor: "#FF4444",
              color: "#FF4444",
              "&:hover": { borderColor: "#FF4444", backgroundColor: "#ff44441a" },
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
              "&:hover": { borderColor: "#10A37F", backgroundColor: "#10A37F1a" },
            }}
            onClick={handleApply}
          >
            Активировать
          </Button>
        )}
      </Box>
      <Typography variant="caption" sx={{ color: active ? "#10A37F" : "#FF4444" }}>
        {active ? "Активна" : "Выключена"}
      </Typography>
    </Paper>
  );
});

const XGBoostBlock = memo(function XGBoostBlock({
  active,
  setActive,
  xgboostParams,
  setXgboostParams,
}) {
  const [localMaxDepth, setLocalMaxDepth] = useState(xgboostParams.max_depth || 6);
  const [localLearningRate, setLocalLearningRate] = useState(
    xgboostParams.learning_rate || 0.1
  );
  const [localNEstimators, setLocalNEstimators] = useState(
    xgboostParams.n_estimators || 100
  );
  const [localSubsample, setLocalSubsample] = useState(xgboostParams.subsample || 1);
  const [localColsampleBytree, setLocalColsampleBytree] = useState(
    xgboostParams.colsample_bytree || 1
  );
  const [paramsOpen, setParamsOpen] = useState(false);

  useEffect(() => {
    setXgboostParams({
      max_depth: localMaxDepth,
      learning_rate: localLearningRate,
      n_estimators: localNEstimators,
      subsample: localSubsample,
      colsample_bytree: localColsampleBytree,
    });
  }, [
    localMaxDepth,
    localLearningRate,
    localNEstimators,
    localSubsample,
    localColsampleBytree,
    setXgboostParams,
  ]);

  const handleApply = useCallback(() => setActive(true), [setActive]);
  const handleCancel = useCallback(() => setActive(false), [setActive]);
  const toggleParams = useCallback(() => setParamsOpen((prev) => !prev), []);
  const borderColor = active ? "#10A37F" : "#FF4444";

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        border: `2px solid ${borderColor}`,
        borderRadius: 2,
        transition: "border-color 0.2s",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>
          XGBoost
        </Typography>
        <Button onClick={toggleParams} variant="text" sx={{ color: "#10A37F" }}>
          {paramsOpen ? "Скрыть параметры" : "Показать параметры"}
        </Button>
      </Box>
      <Collapse in={paramsOpen}>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" sx={{ color: "#fff" }} gutterBottom>
            Max Depth: {localMaxDepth}
          </Typography>
          <Slider
            value={localMaxDepth}
            onChange={(e, val) => setLocalMaxDepth(val)}
            min={1}
            max={15}
            step={1}
            valueLabelDisplay="auto"
            sx={{ color: "#10A37F", mb: 2 }}
          />
          <Typography variant="body2" sx={{ color: "#fff" }} gutterBottom>
            Learning Rate: {localLearningRate}
          </Typography>
          <Slider
            value={localLearningRate}
            onChange={(e, val) => setLocalLearningRate(val)}
            min={0.01}
            max={1}
            step={0.01}
            valueLabelDisplay="auto"
            sx={{ color: "#10A37F", mb: 2 }}
          />
          <Typography variant="body2" sx={{ color: "#fff" }} gutterBottom>
            n_estimators: {localNEstimators}
          </Typography>
          <Slider
            value={localNEstimators}
            onChange={(e, val) => setLocalNEstimators(val)}
            min={10}
            max={500}
            step={10}
            valueLabelDisplay="auto"
            sx={{ color: "#10A37F", mb: 2 }}
          />
          <Typography variant="body2" sx={{ color: "#fff" }} gutterBottom>
            Subsample: {localSubsample}
          </Typography>
          <Slider
            value={localSubsample}
            onChange={(e, val) => setLocalSubsample(val)}
            min={0.5}
            max={1}
            step={0.1}
            valueLabelDisplay="auto"
            sx={{ color: "#10A37F", mb: 2 }}
          />
          <Typography variant="body2" sx={{ color: "#fff" }} gutterBottom>
            Colsample by tree: {localColsampleBytree}
          </Typography>
          <Slider
            value={localColsampleBytree}
            onChange={(e, val) => setLocalColsampleBytree(val)}
            min={0.5}
            max={1}
            step={0.1}
            valueLabelDisplay="auto"
            sx={{ color: "#10A37F", mb: 2 }}
          />
        </Box>
      </Collapse>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
        {active ? (
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={handleCancel}
            sx={{
              borderColor: "#FF4444",
              color: "#FF4444",
              "&:hover": { borderColor: "#FF4444", backgroundColor: "#ff44441a" },
            }}
          >
            Отключить
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<CheckIcon />}
            onClick={handleApply}
            sx={{
              borderColor: "#10A37F",
              color: "#10A37F",
              "&:hover": { borderColor: "#10A37F", backgroundColor: "#10A37F1a" },
            }}
          >
            Активировать
          </Button>
        )}
      </Box>
      <Typography
        variant="caption"
        sx={{ color: active ? "#10A37F" : "#FF4444", mt: 1, display: "block" }}
      >
        {active ? "Активна" : "Выключена"}
      </Typography>
    </Paper>
  );
});

const SarimaBlock = memo(function SarimaBlock({
  active,
  setActive,
  sarimaParams,
  setSarimaParams,
}) {
  const [localP, setLocalP] = useState(sarimaParams.p || 1);
  const [localD, setLocalD] = useState(sarimaParams.d || 1);
  const [localQ, setLocalQ] = useState(sarimaParams.q || 1);
  const [localPSeasonal, setLocalPSeasonal] = useState(sarimaParams.P || 1);
  const [localDSeasonal, setLocalDSeasonal] = useState(sarimaParams.D || 1);
  const [localQSeasonal, setLocalQSeasonal] = useState(sarimaParams.Q || 1);
  const [localS, setLocalS] = useState(sarimaParams.s || 12);
  const [paramsOpen, setParamsOpen] = useState(false);

  useEffect(() => {
    setSarimaParams({
      p: localP,
      d: localD,
      q: localQ,
      P: localPSeasonal,
      D: localDSeasonal,
      Q: localQSeasonal,
      s: localS,
    });
  }, [
    localP,
    localD,
    localQ,
    localPSeasonal,
    localDSeasonal,
    localQSeasonal,
    localS,
    setSarimaParams,
  ]);

  const toggleParams = useCallback(() => setParamsOpen((prev) => !prev), []);
  const borderColor = active ? "#10A37F" : "#FF4444";

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        border: `2px solid ${borderColor}`,
        borderRadius: 2,
        transition: "border-color 0.2s",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>
          SARIMA
        </Typography>
        <Box>
          <Button onClick={toggleParams} variant="text" size="small" sx={{ color: "#10A37F" }}>
            {paramsOpen ? "Скрыть параметры" : "Показать параметры"}
          </Button>
        </Box>
      </Box>
      <Collapse in={paramsOpen}>
        <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>
              p
            </Typography>
            <ToggleButtonGroup
              value={localP}
              exclusive
              onChange={(e, newVal) => newVal !== null && setLocalP(newVal)}
              size="small"
              color="primary"
            >
              {[0, 1, 2, 3, 4, 5].map((val) => (
                <ToggleButton key={val} value={val} sx={{ color: "#fff", borderColor: "#10A37F" }}>
                  {val}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>
              d
            </Typography>
            <ToggleButtonGroup
              value={localD}
              exclusive
              onChange={(e, newVal) => newVal !== null && setLocalD(newVal)}
              size="small"
              color="primary"
            >
              {[0, 1, 2, 3, 4, 5].map((val) => (
                <ToggleButton key={val} value={val} sx={{ color: "#fff", borderColor: "#10A37F" }}>
                  {val}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>
              q
            </Typography>
            <ToggleButtonGroup
              value={localQ}
              exclusive
              onChange={(e, newVal) => newVal !== null && setLocalQ(newVal)}
              size="small"
              color="primary"
            >
              {[0, 1, 2, 3, 4, 5].map((val) => (
                <ToggleButton key={val} value={val} sx={{ color: "#fff", borderColor: "#10A37F" }}>
                  {val}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>
              P
            </Typography>
            <ToggleButtonGroup
              value={localPSeasonal}
              exclusive
              onChange={(e, newVal) => newVal !== null && setLocalPSeasonal(newVal)}
              size="small"
              color="primary"
            >
              {[0, 1, 2, 3, 4, 5].map((val) => (
                <ToggleButton key={val} value={val} sx={{ color: "#fff", borderColor: "#10A37F" }}>
                  {val}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>
              D
            </Typography>
            <ToggleButtonGroup
              value={localDSeasonal}
              exclusive
              onChange={(e, newVal) => newVal !== null && setLocalDSeasonal(newVal)}
              size="small"
              color="primary"
            >
              {[0, 1, 2, 3, 4, 5].map((val) => (
                <ToggleButton key={val} value={val} sx={{ color: "#fff", borderColor: "#10A37F" }}>
                  {val}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>
              Q
            </Typography>
            <ToggleButtonGroup
              value={localQSeasonal}
              exclusive
              onChange={(e, newVal) => newVal !== null && setLocalQSeasonal(newVal)}
              size="small"
              color="primary"
            >
              {[0, 1, 2, 3, 4, 5].map((val) => (
                <ToggleButton key={val} value={val} sx={{ color: "#fff", borderColor: "#10A37F" }}>
                  {val}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>
              Seasonal Period (s)
            </Typography>
            <ToggleButtonGroup
              value={localS}
              exclusive
              onChange={(e, newVal) => newVal !== null && setLocalS(newVal)}
              size="small"
              color="primary"
            >
              {[1, 2, 3, 4, 6, 12, 24].map((val) => (
                <ToggleButton key={val} value={val} sx={{ color: "#fff", borderColor: "#10A37F" }}>
                  {val}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Collapse>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
        {active ? (
          <Button
            startIcon={<CloseIcon />}
            variant="outlined"
            onClick={() => setActive(false)}
            sx={{
              mr: 1,
              borderColor: "#FF4444",
              color: "#FF4444",
              "&:hover": { borderColor: "#FF4444", backgroundColor: "#ff44441a" },
            }}
          >
            Отключить
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<CheckIcon />}
            onClick={() => setActive(true)}
            sx={{
              mr: 1,
              borderColor: "#10A37F",
              color: "#10A37F",
              "&:hover": { borderColor: "#10A37F", backgroundColor: "#10A37F1a" },
            }}
          >
            Активировать
          </Button>
        )}
      </Box>
      <Typography variant="caption" sx={{ color: active ? "#10A37F" : "#FF4444", mt: 1, display: "block" }}>
        {active ? "Активна" : "Выключена"}
      </Typography>
    </Paper>
  );
});

// ================================================
// Основной компонент ForecastPage
// ================================================

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
    filters,
  } = useContext(DashboardContext);

  // Данные для прогноза из предыдущей страницы
  const stateModifiedData = location.state?.modifiedData || [];
  const stateSelectedColumns = location.state?.selectedColumns || [];
  const initialModifiedData = stateModifiedData.length ? stateModifiedData : [];
  const initialSelectedColumns = stateSelectedColumns.length ? stateSelectedColumns : [];

  // Если данных для прогноза нет, возвращаем пользователя назад
  useEffect(() => {
    if (!initialModifiedData || initialModifiedData.length === 0 || initialSelectedColumns.length < 2) {
      navigate(-1);
    }
  }, [initialModifiedData, initialSelectedColumns, navigate]);

  const {
    horizon,
    historySize,
    freq,
    confidenceLevel,
    prophetActive,
    prophetParams,
    xgboostActive,
    xgboostParams,
    sarimaActive,
    sarimaParams,
    commonTab,
    modelTab,
    modelSubTabs,
    modelsOpen,
    csvSelectedCols,
    fileType,
  } = forecastPageState;

  // Локальное состояние для списка всех возможных столбцов (для экспорта)
  const [allPossibleCols, setAllPossibleCols] = useState([]);

  // Сбор всех возможных столбцов из forecastResults
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

  // Мемоизированное построение объединённых строк для экспорта
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
    const allDs = Array.from(bigMap.keys()).sort(
      (a, b) => new Date(a) - new Date(b)
    );
    return allDs.map((ds) => bigMap.get(ds));
  }, [forecastResults]);

  // Мемоизированные данные для общего графика
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
    const modelColorMap = {
      Prophet: "#36A2EB",
      XGBoost: "#ff6382",
      SARIMA: "#f8fd68",
    };
    return makeCombinedChartData(subset, modelColorMap);
  }, [forecastResults, commonTab]);

  // Диалог экспорта
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  const handleOpenCsvDialog = useCallback(() => {
    setPreviewData(mergedRows.slice(0, 5));
    setCsvDialogOpen(true);
  }, [mergedRows]);

  const handleCloseCsvDialog = useCallback(() => setCsvDialogOpen(false), []);

  const handleDownloadSelectedCols = useCallback(() => {
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
  }, [allPossibleCols, csvSelectedCols, fileType, mergedRows]);

  // Обработчики табов и навигации
  const handleCommonTabChange = useCallback((e, val) => {
    setForecastPageState((prev) => ({ ...prev, commonTab: val }));
  }, [setForecastPageState]);

  const handleModelTabChange = useCallback((e, val) => {
    setForecastPageState((prev) => ({ ...prev, modelTab: val }));
  }, [setForecastPageState]);

  const handleModelSubTabChange = useCallback(
    (modelIndex, val) => {
      setForecastPageState((prev) => ({
        ...prev,
        modelSubTabs: { ...prev.modelSubTabs, [modelIndex]: val },
      }));
    },
    [setForecastPageState]
  );

  const handleBack = useCallback(() => navigate(-1), [navigate]);
  const toggleModels = useCallback(
    () =>
      setForecastPageState((prev) => ({
        ...prev,
        modelsOpen: !prev.modelsOpen,
      })),
    [setForecastPageState]
  );

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

  // Функция для получения цвета обводки чипа по значению метрики
  const getChipBorderColor = useCallback((value, type) => {
    if (value === null || value === undefined) return "#666";
    if (type === "mae" || type === "rmse")
      return value < 1 ? "#4CAF50" : value < 5 ? "#FFC107" : "#F44336";
    if (type === "mape")
      return value < 10 ? "#4CAF50" : value < 20 ? "#FFC107" : "#F44336";
    return "#666";
  }, []);

  const AnimatedMetricChip = memo(function AnimatedMetricChip({ label, value, type, icon }) {
    const borderColor = getChipBorderColor(value, type);
    return (
      <Chip
        icon={icon}
        label={`${label}: ${value !== null ? value.toFixed(4) : "N/A"}`}
        sx={{
          fontSize: "0.9rem",
          fontWeight: "bold",
          border: `2px solid ${borderColor}`,
          backgroundColor: "transparent",
          color: borderColor,
          transition: "all 0.3s ease-in-out",
          "& .MuiChip-icon": { color: borderColor },
          "&:hover": {
            backgroundColor: borderColor,
            color: "#121212",
            "& .MuiChip-icon": { color: "#121212" },
          },
        }}
      />
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      style={{ position: "relative", minHeight: "100vh" }}
    >
            <Canvas camera={{ position: [0, 0, 1] }} style={{ position: 'fixed', top: 0, left: 0 }}>
        <ParticleBackground />
      </Canvas>
      <Box sx={{ position: "relative", minHeight: "100vh" }}>
        {/* Шапка */}
        <Box sx={{ display: "flex", justifyContent: "space-between", m: 2, pt: 2 }}>
          <Button
            variant="contained"
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            sx={{
              background: "rgba(16,163,127,0.15)",
              color: "#10A37F",
              borderRadius: "12px",
              px: 3,
              "&:hover": { background: "rgba(16,163,127,0.3)" },
            }}
          >
            Назад
          </Button>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(45deg, #10A37F 30%, #00ff88 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Прогнозирование
          </Typography>
          <Button
            variant="contained"
            onClick={toggleModels}
            endIcon={<ArrowForwardIcon />}
            sx={{
              background: "rgba(16,163,127,0.15)",
              color: "#10A37F",
              borderRadius: "12px",
              px: 3,
              "&:hover": { background: "rgba(16,163,127,0.3)" },
            }}
          >
            Модели
          </Button>
        </Box>
        <Box sx={{ pt: 2 }}>
          <CategoricalDataBlock
            filteredData={filteredData}
            selectedColumns={selectedColumns}
            filters={filters}
          />
        </Box>
        {/* Основной контейнер */}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            height: "calc(100vh - 56px)",
            alignItems: "center",
          }}
        >
          {/* Левая часть */}
          <Box
            sx={{
              flexGrow: 1,
              transition: "margin-right 0.3s",
              marginRight: modelsOpen ? "336px" : 0,
              overflowY: "auto",
              "&::-webkit-scrollbar": { display: "none" },
              "-ms-overflow-style": "none",
              "scrollbar-width": "none",
            }}
          >
            <Paper
              sx={{
                background: "rgba(255, 255, 255, 0.05)",
                m: 2,
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                p: 3,
              }}
            >
              <Typography variant="h6" sx={{ mb: 2 }}>
                Общие параметры прогноза
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography gutterBottom>Горизонт: {horizon}</Typography>
                  <Slider
                    value={horizon}
                    onChange={(e, val) =>
                      setForecastPageState((prev) => ({ ...prev, horizon: val }))
                    }
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
                    onChange={(e, val) =>
                      setForecastPageState((prev) => ({ ...prev, historySize: val }))
                    }
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
                      onChange={(e) =>
                        setForecastPageState((prev) => ({ ...prev, freq: e.target.value }))
                      }
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
                    onChange={(e, val) =>
                      setForecastPageState((prev) => ({ ...prev, confidenceLevel: val }))
                    }
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
                  onClick={async () => {
                    // Построение прогноза
                    setForecastPageState((prev) => ({ ...prev })); // для отметки изменений
                    try {
                      const activeModels = [];
                      if (prophetActive)
                        activeModels.push({ model: "Prophet", uniqueParams: prophetParams });
                      if (xgboostActive)
                        activeModels.push({ model: "XGBoost", uniqueParams: xgboostParams });
                      if (sarimaActive)
                        activeModels.push({ model: "SARIMA", uniqueParams: sarimaParams });

                      const newResults = [];
                      for (let m of activeModels) {
                        const payload = {
                          model: m.model,
                          uniqueParams: m.uniqueParams,
                          horizon,
                          history: historySize,
                          dt_name: initialSelectedColumns[0] || "ds",
                          y_name: initialSelectedColumns[1] || "y",
                          freq,
                          confidence_level: confidenceLevel,
                          data: initialModifiedData,
                        };
                        const resp = await axios.post("http://localhost:8000/api/forecast", payload);
                        const { forecast_all, forecast_train, forecast_test, forecast_horizon } = resp.data;
                        newResults.push({
                          modelName: m.model,
                          forecastAll: forecast_all || [],
                          forecastTrain: forecast_train || [],
                          forecastTest: forecast_test || [],
                          forecastHorizon: forecast_horizon || [],
                        });
                      }
                      setForecastResults(newResults);
                    } catch (err) {
                      console.error("Ошибка прогноза:", err);
                    }
                  }}
                  disabled={false}
                  sx={{ borderRadius: "16px", backgroundColor: "#10A37F" }}
                >
                  <CircularProgress size={24} sx={{ display: "none" }} />
                  Построить прогноз
                </Button>
              </Box>
            </Paper>
            {forecastResults.length > 0 && (
              <Paper
                sx={{
                  background: "rgba(255, 255, 255, 0.05)",
                  m: 2,
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                  p: 3,
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
                <Box sx={{ height: 500 }}>
                  <Line data={combinedChartData} options={chartOptions} />
                </Box>
                <Box sx={{ textAlign: "center", mt: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleOpenCsvDialog}
                    sx={{ borderRadius: "12px", backgroundColor: "#10A37F" }}
                  >
                    Скачать (All Models)
                  </Button>
                </Box>
              </Paper>
            )}
            {forecastResults.length > 0 && (
              <Paper
                sx={{
                  background: "rgba(255, 255, 255, 0.05)",
                  m: 2,
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                  p: 3,
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
                      Prophet: "#36A2EB",
                      XGBoost: "#ff6382",
                      SARIMA: "#f8fd68",
                    };
                    const color = modelColorMap[curModel.modelName] || "#36A2EB";
                    const subTab = modelSubTabs[modelTab] || 0;
                    const handleSubTabChange = (e, val) =>
                      handleModelSubTabChange(modelTab, val);
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
                              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 2, pt: 3, pb: 10 }}>
                                <AnimatedMetricChip
                                  label="MAE"
                                  value={metricsAll.mae}
                                  type="mae"
                                  icon={<TrendingDownIcon />}
                                />
                                <AnimatedMetricChip
                                  label="RMSE"
                                  value={metricsAll.rmse}
                                  type="rmse"
                                  icon={<ShowChartIcon />}
                                />
                                {metricsAll.mape !== null && (
                                  <AnimatedMetricChip
                                    label="MAPE"
                                    value={metricsAll.mape}
                                    type="mape"
                                    icon={<PercentIcon />}
                                  />
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
                                {metricsTrain.mape && <Typography>MAPE: {metricsTrain.mape.toFixed(2)}%</Typography>}
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
                                {metricsTest.mape && <Typography>MAPE: {metricsTest.mape.toFixed(2)}%</Typography>}
                              </Box>
                            )}
                          </Box>
                        )}
                        {subTab === 3 && (
                          <Box sx={{ height: 400 }}>
                            <Line data={chartHorizon} options={chartOptions} />
                            <Typography sx={{ mt: 2 }}>Прогноз будущего (факт отсутствует).</Typography>
                          </Box>
                        )}
                      </Box>
                    );
                  })()}
              </Paper>
            )}
          </Box>
          {/* Правая панель */}
          <Slide direction="left" in={modelsOpen} mountOnEnter unmountOnExit>
            <Box
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                width: "320px",
                background: "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                height: "calc(100vh - 72px)",
                p: 2,
                overflowY: "auto",
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
                "&::-webkit-scrollbar-thumb": { backgroundColor: "#666", borderRadius: "3px" },
                "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#aaa" },
              }}
            >
              <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
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
              onChange={(e) =>
                setForecastPageState((prev) => ({ ...prev, fileType: e.target.value }))
              }
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
                            if (e.target.checked)
                              setForecastPageState((prev) => ({
                                ...prev,
                                csvSelectedCols: [...prev.csvSelectedCols, col],
                              }));
                            else
                              setForecastPageState((prev) => ({
                                ...prev,
                                csvSelectedCols: prev.csvSelectedCols.filter((c) => c !== col),
                              }));
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
                        fontSize: "0.85rem",
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
    </motion.div>
  );
}
