// src/pages/ForecastPage.jsx
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
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  ToggleButtonGroup,
  ToggleButton,
  Radio,
  Slide,
  Collapse,
  Chip,
  MenuItem
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
import { DashboardContext } from "../context/DashboardContext";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Canvas } from "@react-three/fiber";
import { ParticleBackground } from "../components/home/ParticleBackground";
import CategoricalDataBlock from "../components/CategoricalDataBlock";

// =======================
// Вспомогательные функции для графиков и метрик
// =======================
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

// =======================
// Внутренние компоненты для ввода параметров моделей
// =======================
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
  const { setIsDirty } = useContext(DashboardContext);

  const handleApply = useCallback(() => {
    setProphetParams({ seasonality_mode: localSeasonalityMode });
    setActive(true);
    setIsDirty(true);
    setParamsOpen(false);
  }, [localSeasonalityMode, setProphetParams, setActive, setIsDirty]);

  const handleCancel = useCallback(() => {
    setActive(false);
    setIsDirty(true);
  }, [setActive, setIsDirty]);

  const toggleParams = useCallback(() => {
    // Если параметры закрыты и модель активна, деактивируем её
    if (!paramsOpen && active) {
      setActive(false);
      setIsDirty(true);
    }
    setParamsOpen((prev) => !prev);
  }, [paramsOpen, active, setActive, setIsDirty]);
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
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
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
  const { setIsDirty } = useContext(DashboardContext);

  const handleApply = useCallback(() => {
    setXgboostParams({
      max_depth: localMaxDepth,
      learning_rate: localLearningRate,
      n_estimators: localNEstimators,
      subsample: localSubsample,
      colsample_bytree: localColsampleBytree,
    });
    setActive(true);
    setIsDirty(true);
    setParamsOpen(false); // скрываем параметры при активации
  }, [
    localMaxDepth,
    localLearningRate,
    localNEstimators,
    localSubsample,
    localColsampleBytree,
    setXgboostParams,
    setActive,
    setIsDirty,
    setParamsOpen,
  ]);

  const handleCancel = useCallback(() => {
    setActive(false);
    setIsDirty(true);
  }, [setActive, setIsDirty]);

  const toggleParams = useCallback(() => {
    if (!paramsOpen && active) {
      setActive(false);
      setIsDirty(true);
    }
    setParamsOpen((prev) => !prev);
  }, [paramsOpen, active, setActive, setIsDirty]);

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
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
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
  const { setIsDirty } = useContext(DashboardContext);

  const handleApply = useCallback(() => {
    setSarimaParams({
      p: localP,
      d: localD,
      q: localQ,
      P: localPSeasonal,
      D: localDSeasonal,
      Q: localQSeasonal,
      s: localS,
    });
    setActive(true);
    setIsDirty(true);
    setParamsOpen(false); // скрываем параметры при активации
  }, [
    localP,
    localD,
    localQ,
    localPSeasonal,
    localDSeasonal,
    localQSeasonal,
    localS,
    setSarimaParams,
    setActive,
    setIsDirty,
  ]);

  const handleCancel = useCallback(() => {
    setActive(false);
    setIsDirty(true);
  }, [setActive, setIsDirty]);

  const toggleParams = useCallback(() => {
    if (!paramsOpen && active) {
      setActive(false);
      setIsDirty(true);
    }
    setParamsOpen((prev) => !prev);
  }, [paramsOpen, active, setActive, setIsDirty]);

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
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
            <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>p</Typography>
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
            <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>d</Typography>
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
            <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>q</Typography>
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
            <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>P</Typography>
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
            <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>D</Typography>
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
            <Typography variant="body2" sx={{ color: "#fff", mb: 0.5 }}>Q</Typography>
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
            onClick={handleCancel}
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
            onClick={handleApply}
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
    </Paper>
  );
});

const LSTMBlock = memo(function LSTMBlock({
  active,
  setActive,
  lstmParams,
  setLstmParams
}) {
  const defaultParams = {
    seq_length: 12,
    lag_periods: 6,
    window_sizes: "3,6,12",
    num_layers: 2,
    hidden_dim: 128,
    dropout: 0.3,
    batch_size: 64,
    epochs: 200,
    learning_rate: 0.001,
    patience: 15,
    delta: 0.001,
    n_splits: 5,
    use_attention: true,
    mc_dropout: true,
    mc_samples: 100,
    optimizer_type: "AdamW",
    criterion: "Huber",
  };
  const init = lstmParams || defaultParams;
  const [localSeqLength, setLocalSeqLength] = useState(init.seq_length);
  const [localLagPeriods, setLocalLagPeriods] = useState(init.lag_periods);
  const [localWindowSizes, setLocalWindowSizes] = useState(init.window_sizes);
  const [localNumLayers, setLocalNumLayers] = useState(init.num_layers);
  const [localHiddenDim, setLocalHiddenDim] = useState(init.hidden_dim);
  const [localDropout, setLocalDropout] = useState(init.dropout);
  const [localBatchSize, setLocalBatchSize] = useState(init.batch_size);
  const [localEpochs, setLocalEpochs] = useState(init.epochs);
  const [localLearningRate, setLocalLearningRate] = useState(init.learning_rate);
  const [localPatience, setLocalPatience] = useState(init.patience);
  const [localDelta, setLocalDelta] = useState(init.delta);
  const [localNSplits, setLocalNSplits] = useState(init.n_splits);
  const [localUseAttention, setLocalUseAttention] = useState(init.use_attention);
  const [localMCDropout, setLocalMCDropout] = useState(init.mc_dropout);
  const [localMCSamples, setLocalMCSamples] = useState(init.mc_samples);
  const [localOptimizer, setLocalOptimizer] = useState(init.optimizer_type || "AdamW");
  const [localCriterion, setLocalCriterion] = useState(init.criterion || "Huber");
  const [paramsOpen, setParamsOpen] = useState(false);
  const { setIsDirty } = useContext(DashboardContext);

  const handleApply = useCallback(() => {
    setLstmParams({
      seq_length: localSeqLength,
      lag_periods: localLagPeriods,
      window_sizes: localWindowSizes.split(',').map(val => parseInt(val.trim())).filter(val => !isNaN(val)),
      num_layers: localNumLayers,
      hidden_dim: localHiddenDim,
      dropout: localDropout,
      batch_size: localBatchSize,
      epochs: localEpochs,
      learning_rate: localLearningRate,
      patience: localPatience,
      delta: localDelta,
      n_splits: localNSplits,
      use_attention: localUseAttention,
      mc_dropout: localMCDropout,
      mc_samples: localMCSamples,
      optimizer_type: localOptimizer,
      criterion: localCriterion,
    });
    setActive(true);
    setIsDirty(true);
    setParamsOpen(false); // скрываем параметры при активации
  }, [
    localSeqLength,
    localLagPeriods,
    localWindowSizes,
    localNumLayers,
    localHiddenDim,
    localDropout,
    localBatchSize,
    localEpochs,
    localLearningRate,
    localPatience,
    localDelta,
    localNSplits,
    localUseAttention,
    localMCDropout,
    localMCSamples,
    localOptimizer,
    localCriterion,
    setLstmParams,
    setActive,
    setIsDirty,
    setParamsOpen,
  ]);




  const handleCancel = useCallback(() => {
    setActive(false);
    setIsDirty(true);
  }, [setActive, setIsDirty]);

  const toggleParams = useCallback(() => {
    if (!paramsOpen && active) {
      setActive(false);
      setIsDirty(true);
    }
    setParamsOpen((prev) => !prev);
  }, [paramsOpen, active, setActive, setIsDirty]);

  const borderColor = active ? "#10A37F" : "#FF4444";

  return (
    <Paper sx={{ p: 2, mb: 2, border: `2px solid ${borderColor}`, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>
          LSTM
        </Typography>
        <Button onClick={toggleParams} variant="text" sx={{ color: "#10A37F" }}>
          {paramsOpen ? "Скрыть параметры" : "Показать параметры"}
        </Button>
      </Box>
      <Collapse in={paramsOpen}>
        <Box
          sx={{
            mt: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Длина последовательности (seq_length)</Typography>
            <Slider value={localSeqLength} onChange={(e, val) => setLocalSeqLength(val)} min={1} max={50} step={1} valueLabelDisplay="auto" sx={{ color: "#10A37F" }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Периоды задержки (lag_periods)</Typography>
            <Slider value={localLagPeriods} onChange={(e, val) => setLocalLagPeriods(val)} min={1} max={50} step={1} valueLabelDisplay="auto" sx={{ color: "#10A37F" }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Размеры окон (window_sizes, через запятую)</Typography>
            <TextField
              value={localWindowSizes}
              onChange={(e) => setLocalWindowSizes(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ backgroundColor: "#2c2c2c", input: { color: "#fff" } }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Число слоёв (num_layers)</Typography>
            <Slider value={localNumLayers} onChange={(e, val) => setLocalNumLayers(val)} min={1} max={4} step={1} valueLabelDisplay="auto" sx={{ color: "#10A37F" }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Размер скрытого состояния (hidden_dim)</Typography>
            <Slider value={localHiddenDim} onChange={(e, val) => setLocalHiddenDim(val)} min={16} max={512} step={16} valueLabelDisplay="auto" sx={{ color: "#10A37F" }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Dropout</Typography>
            <Slider value={localDropout} onChange={(e, val) => setLocalDropout(val)} min={0} max={1} step={0.05} valueLabelDisplay="auto" sx={{ color: "#10A37F" }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Batch Size</Typography>
            <Slider value={localBatchSize} onChange={(e, val) => setLocalBatchSize(val)} min={8} max={128} step={8} valueLabelDisplay="auto" sx={{ color: "#10A37F" }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Эпохи (epochs)</Typography>
            <Slider value={localEpochs} onChange={(e, val) => setLocalEpochs(val)} min={10} max={500} step={10} valueLabelDisplay="auto" sx={{ color: "#10A37F" }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Learning Rate</Typography>
            <Slider value={localLearningRate} onChange={(e, val) => setLocalLearningRate(val)} min={0.0001} max={0.01} step={0.0001} valueLabelDisplay="auto" sx={{ color: "#10A37F" }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Patience</Typography>
            <Slider value={localPatience} onChange={(e, val) => setLocalPatience(val)} min={1} max={50} step={1} valueLabelDisplay="auto" sx={{ color: "#10A37F" }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Delta</Typography>
            <Slider value={localDelta} onChange={(e, val) => setLocalDelta(val)} min={0} max={0.01} step={0.0001} valueLabelDisplay="auto" sx={{ color: "#10A37F" }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>n_splits</Typography>
            <Slider value={localNSplits} onChange={(e, val) => setLocalNSplits(val)} min={2} max={10} step={1} valueLabelDisplay="auto" sx={{ color: "#10A37F" }} />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={<Checkbox checked={localUseAttention} onChange={(e) => setLocalUseAttention(e.target.checked)} sx={{ color: "#10A37F" }} />}
              label="Использовать внимание"
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <FormControlLabel
              control={<Checkbox checked={localMCDropout} onChange={(e) => setLocalMCDropout(e.target.checked)} sx={{ color: "#10A37F" }} />}
              label="MC-Dropout"
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>MC-Samples</Typography>
            <Slider value={localMCSamples} onChange={(e, val) => setLocalMCSamples(val)} min={1} max={200} step={1} valueLabelDisplay="auto" sx={{ color: "#10A37F" }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Тип оптимизатора</Typography>
            <TextField
              select
              fullWidth
              variant="outlined"
              value={localOptimizer}
              onChange={(e) => setLocalOptimizer(e.target.value)}
              sx={{ backgroundColor: "#2c2c2c", input: { color: "#fff" } }}
            >
              <MenuItem value="AdamW">AdamW</MenuItem>
              <MenuItem value="Adam">Adam</MenuItem>
              <MenuItem value="SGD">SGD</MenuItem>
              <MenuItem value="RMSprop">RMSprop</MenuItem>
            </TextField>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Критерий</Typography>
            <TextField
              select
              fullWidth
              variant="outlined"
              value={localCriterion}
              onChange={(e) => setLocalCriterion(e.target.value)}
              sx={{ backgroundColor: "#2c2c2c", input: { color: "#fff" } }}
            >
              <MenuItem value="MSE">MSE</MenuItem>
              <MenuItem value="MAE">MAE</MenuItem>
              <MenuItem value="Huber">Huber</MenuItem>
            </TextField>
          </Box>
        </Box>
      </Collapse>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
        {active ? (
          <Button variant="outlined" startIcon={<CloseIcon />} onClick={handleCancel} sx={{ borderColor: "#FF4444", color: "#FF4444" }}>
            Отключить
          </Button>
        ) : (
          <Button variant="outlined" startIcon={<CheckIcon />} onClick={handleApply} sx={{ borderColor: "#10A37F", color: "#10A37F" }}>
            Активировать
          </Button>
        )}
      </Box>
    </Paper>
  );
});

const GRUBlock = memo(function GRUBlock({
  active,
  setActive,
  gruParams,
  setGruParams
}) {
  // Значения по умолчанию для модели GRU
  const defaultParams = {
    seq_length: 24,
    lag_periods: 12,
    window_sizes: "6,12,24", // вводится как строка; при применении преобразуется в массив чисел
    num_layers: 3,
    hidden_dim: 256,
    dropout: 0.4,
    batch_size: 128,
    epochs: 300,
    learning_rate: 0.0005,
    patience: 20,
    delta: 0.001,
    n_splits: 5,
    bidirectional: true,
    residual_connections: true,
    use_layer_norm: true,
    mc_dropout: true,
    mc_samples: 200,
    optimizer_type: "AdamW",
    criterion: "Huber"
  };

  const init = gruParams || defaultParams;

  // Локальные состояния для всех параметров модели
  const [localSeqLength, setLocalSeqLength] = useState(init.seq_length);
  const [localLagPeriods, setLocalLagPeriods] = useState(init.lag_periods);
  const [localWindowSizes, setLocalWindowSizes] = useState(init.window_sizes);
  const [localNumLayers, setLocalNumLayers] = useState(init.num_layers);
  const [localHiddenDim, setLocalHiddenDim] = useState(init.hidden_dim);
  const [localDropout, setLocalDropout] = useState(init.dropout);
  const [localBatchSize, setLocalBatchSize] = useState(init.batch_size);
  const [localEpochs, setLocalEpochs] = useState(init.epochs);
  const [localLearningRate, setLocalLearningRate] = useState(init.learning_rate);
  const [localPatience, setLocalPatience] = useState(init.patience);
  const [localDelta, setLocalDelta] = useState(init.delta);
  const [localNSplits, setLocalNSplits] = useState(init.n_splits);
  const [localBidirectional, setLocalBidirectional] = useState(init.bidirectional);
  const [localResidualConnections, setLocalResidualConnections] = useState(init.residual_connections);
  const [localUseLayerNorm, setLocalUseLayerNorm] = useState(init.use_layer_norm);
  const [localMCDropout, setLocalMCDropout] = useState(init.mc_dropout);
  const [localMCSamples, setLocalMCSamples] = useState(init.mc_samples);
  const [localOptimizer, setLocalOptimizer] = useState(init.optimizer_type);
  const [localCriterion, setLocalCriterion] = useState(init.criterion);

  const { setIsDirty } = useContext(DashboardContext);
  const [paramsOpen, setParamsOpen] = useState(false);

  // Функция применения настроек. Если localWindowSizes является строкой, она разбивается на массив чисел.
  const handleApply = useCallback(() => {
    const parsedWindowSizes = Array.isArray(localWindowSizes)
      ? localWindowSizes
      : typeof localWindowSizes === "string"
      ? localWindowSizes
          .split(",")
          .map((val) => parseInt(val.trim()))
          .filter((val) => !isNaN(val))
      : [];

    setGruParams({
      seq_length: localSeqLength,
      lag_periods: localLagPeriods,
      window_sizes: parsedWindowSizes,
      num_layers: localNumLayers,
      hidden_dim: localHiddenDim,
      dropout: localDropout,
      batch_size: localBatchSize,
      epochs: localEpochs,
      learning_rate: localLearningRate,
      patience: localPatience,
      delta: localDelta,
      n_splits: localNSplits,
      bidirectional: localBidirectional,
      residual_connections: localResidualConnections,
      use_layer_norm: localUseLayerNorm,
      mc_dropout: localMCDropout,
      mc_samples: localMCSamples,
      optimizer_type: localOptimizer,
      criterion: localCriterion,
    });
    setActive(true);
    setIsDirty(true);
    setParamsOpen(false);
  }, [
    localSeqLength,
    localLagPeriods,
    localWindowSizes,
    localNumLayers,
    localHiddenDim,
    localDropout,
    localBatchSize,
    localEpochs,
    localLearningRate,
    localPatience,
    localDelta,
    localNSplits,
    localBidirectional,
    localResidualConnections,
    localUseLayerNorm,
    localMCDropout,
    localMCSamples,
    localOptimizer,
    localCriterion,
    setGruParams,
    setActive,
    setIsDirty,
  ]);

  const handleCancel = useCallback(() => {
    setActive(false);
    setIsDirty(true);
  }, [setActive, setIsDirty]);

  const toggleParams = useCallback(() => {
    if (!paramsOpen && active) {
      setActive(false);
      setIsDirty(true);
    }
    setParamsOpen((prev) => !prev);
  }, [paramsOpen, active, setActive, setIsDirty]);

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        border: `2px solid ${active ? "#10A37F" : "#FF4444"}`,
        borderRadius: 2,
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>
          GRU
        </Typography>
        <Button onClick={toggleParams} variant="text" sx={{ color: "#10A37F" }}>
          {paramsOpen ? "Скрыть параметры" : "Показать параметры"}
        </Button>
      </Box>
      <Collapse in={paramsOpen}>
        <Box
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 2,
          }}
        >
          {/* Числовые параметры */}
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              Длина последовательности (seq_length)
            </Typography>
            <Slider
              value={localSeqLength}
              onChange={(e, val) => setLocalSeqLength(val)}
              min={1}
              max={50}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              Периоды задержки (lag_periods)
            </Typography>
            <Slider
              value={localLagPeriods}
              onChange={(e, val) => setLocalLagPeriods(val)}
              min={1}
              max={50}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              Размеры окон (window_sizes, через запятую)
            </Typography>
            <TextField
              value={localWindowSizes}
              onChange={(e) => setLocalWindowSizes(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{
                backgroundColor: "#2c2c2c",
                input: { color: "#fff" },
              }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              Число слоёв (num_layers)
            </Typography>
            <Slider
              value={localNumLayers}
              onChange={(e, val) => setLocalNumLayers(val)}
              min={1}
              max={10}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              Размер скрытого состояния (hidden_dim)
            </Typography>
            <Slider
              value={localHiddenDim}
              onChange={(e, val) => setLocalHiddenDim(val)}
              min={16}
              max={512}
              step={16}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              Dropout
            </Typography>
            <Slider
              value={localDropout}
              onChange={(e, val) => setLocalDropout(val)}
              min={0}
              max={1}
              step={0.05}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              Batch Size
            </Typography>
            <Slider
              value={localBatchSize}
              onChange={(e, val) => setLocalBatchSize(val)}
              min={8}
              max={256}
              step={8}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              Эпохи (epochs)
            </Typography>
            <Slider
              value={localEpochs}
              onChange={(e, val) => setLocalEpochs(val)}
              min={10}
              max={500}
              step={10}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              Learning Rate
            </Typography>
            <Slider
              value={localLearningRate}
              onChange={(e, val) => setLocalLearningRate(val)}
              min={0.0001}
              max={0.01}
              step={0.0001}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              Patience
            </Typography>
            <Slider
              value={localPatience}
              onChange={(e, val) => setLocalPatience(val)}
              min={1}
              max={50}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              Delta
            </Typography>
            <Slider
              value={localDelta}
              onChange={(e, val) => setLocalDelta(val)}
              min={0}
              max={0.01}
              step={0.0001}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              n_splits
            </Typography>
            <Slider
              value={localNSplits}
              onChange={(e, val) => setLocalNSplits(val)}
              min={2}
              max={10}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          {/* Булевы параметры */}
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={localBidirectional}
                  onChange={(e) => setLocalBidirectional(e.target.checked)}
                  sx={{ color: "#10A37F" }}
                />
              }
              label="Bidirectional"
            />
          </Box>
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={localResidualConnections}
                  onChange={(e) => setLocalResidualConnections(e.target.checked)}
                  sx={{ color: "#10A37F" }}
                />
              }
              label="Residual Connections"
            />
          </Box>
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={localUseLayerNorm}
                  onChange={(e) => setLocalUseLayerNorm(e.target.checked)}
                  sx={{ color: "#10A37F" }}
                />
              }
              label="Layer Normalization"
            />
          </Box>
          <Box>
            <FormControlLabel
              control={
                <Checkbox
                  checked={localMCDropout}
                  onChange={(e) => setLocalMCDropout(e.target.checked)}
                  sx={{ color: "#10A37F" }}
                />
              }
              label="MC-Dropout"
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              MC-Samples
            </Typography>
            <Slider
              value={localMCSamples}
              onChange={(e, val) => setLocalMCSamples(val)}
              min={1}
              max={200}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          {/* Выбор оптимизатора */}
          <Box>
            <FormControl fullWidth size="small" sx={{ backgroundColor: "#2c2c2c", borderRadius: "4px" }}>
              <InputLabel sx={{ color: "#fff" }}>Optimizer</InputLabel>
              <Select
                value={localOptimizer}
                label="Optimizer"
                onChange={(e) => setLocalOptimizer(e.target.value)}
                sx={{ color: "#fff", ".MuiOutlinedInput-notchedOutline": { borderColor: "#fff" } }}
              >
                <MenuItem value="AdamW">AdamW</MenuItem>
                <MenuItem value="Adam">Adam</MenuItem>
                <MenuItem value="SGD">SGD</MenuItem>
                <MenuItem value="RMSprop">RMSprop</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {/* Выбор критерия */}
          <Box>
            <FormControl fullWidth size="small" sx={{ backgroundColor: "#2c2c2c", borderRadius: "4px" }}>
              <InputLabel sx={{ color: "#fff" }}>Criterion</InputLabel>
              <Select
                value={localCriterion}
                label="Criterion"
                onChange={(e) => setLocalCriterion(e.target.value)}
                sx={{ color: "#fff", ".MuiOutlinedInput-notchedOutline": { borderColor: "#fff" } }}
              >
                <MenuItem value="MSE">MSE</MenuItem>
                <MenuItem value="MAE">MAE</MenuItem>
                <MenuItem value="Huber">Huber</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Collapse>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
        {active ? (
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={handleCancel}
            sx={{ borderColor: "#FF4444", color: "#FF4444" }}
          >
            Отключить
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<CheckIcon />}
            onClick={handleApply}
            sx={{ borderColor: "#10A37F", color: "#10A37F" }}
          >
            Активировать
          </Button>
        )}
      </Box>
    </Paper>
  );
});

const TransformerBlock = memo(function TransformerBlock({
  active,
  setActive,
  transformerParams,
  setTransformerParams,
}) {
  // Значения по умолчанию для Transformer, включая уникальные параметры
  const defaultTransformerParams = {
    seq_length: 24,
    lag_periods: 12,
    window_sizes: "6,12,24",
    d_model: 256,
    nhead: 8,
    num_encoder_layers: 3,
    num_decoder_layers: 1,
    dim_feedforward: 512,
    dropout: 0.2,
    batch_size: 64,
    epochs: 150,
    learning_rate: 0.0005,
    optimizer_type: "AdamW",
    criterion: "MSE",
    patience: 20,
    delta: 0.001,
    n_splits: 3,
    mc_dropout: true,
    mc_samples: 100,
    use_encoder: true,
    use_decoder: false,
    activation: "gelu",
  };

  // Если transformerParams не определён, используем значения по умолчанию
  const currentTransformerParams = transformerParams || defaultTransformerParams;

  // Инициализация локальных состояний
  const [localSeqLength, setLocalSeqLength] = useState(currentTransformerParams.seq_length);
  const [localLagPeriods, setLocalLagPeriods] = useState(currentTransformerParams.lag_periods);
  const [localWindowSizes, setLocalWindowSizes] = useState(currentTransformerParams.window_sizes);
  const [localDModel, setLocalDModel] = useState(currentTransformerParams.d_model);
  const [localNHead, setLocalNHead] = useState(currentTransformerParams.nhead);
  const [localNumEncoderLayers, setLocalNumEncoderLayers] = useState(currentTransformerParams.num_encoder_layers);
  const [localNumDecoderLayers, setLocalNumDecoderLayers] = useState(currentTransformerParams.num_decoder_layers);
  const [localDimFeedforward, setLocalDimFeedforward] = useState(currentTransformerParams.dim_feedforward);
  const [localDropout, setLocalDropout] = useState(currentTransformerParams.dropout);
  const [localBatchSize, setLocalBatchSize] = useState(currentTransformerParams.batch_size);
  const [localEpochs, setLocalEpochs] = useState(currentTransformerParams.epochs);
  const [localLearningRate, setLocalLearningRate] = useState(currentTransformerParams.learning_rate);
  const [localOptimizer, setLocalOptimizer] = useState(currentTransformerParams.optimizer_type);
  const [localCriterion, setLocalCriterion] = useState(currentTransformerParams.criterion);

  const [paramsOpen, setParamsOpen] = useState(false);
  const { setIsDirty } = useContext(DashboardContext);

  const handleApply = useCallback(() => {
    setTransformerParams({
      seq_length: localSeqLength,
      lag_periods: localLagPeriods,
      window_sizes: localWindowSizes,
      d_model: localDModel,
      nhead: localNHead,
      num_encoder_layers: localNumEncoderLayers,
      num_decoder_layers: localNumDecoderLayers,
      dim_feedforward: localDimFeedforward,
      dropout: localDropout,
      batch_size: localBatchSize,
      epochs: localEpochs,
      learning_rate: localLearningRate,
      optimizer_type: localOptimizer,
      criterion: localCriterion,
      // Подставляем либо существующие, либо дефолтные значения для остальных параметров:
      patience: transformerParams?.patience ?? defaultTransformerParams.patience,
      delta: transformerParams?.delta ?? defaultTransformerParams.delta,
      n_splits: transformerParams?.n_splits ?? defaultTransformerParams.n_splits,
      mc_dropout: transformerParams?.mc_dropout ?? defaultTransformerParams.mc_dropout,
      mc_samples: transformerParams?.mc_samples ?? defaultTransformerParams.mc_samples,
      use_encoder: transformerParams?.use_encoder ?? defaultTransformerParams.use_encoder,
      use_decoder: transformerParams?.use_decoder ?? defaultTransformerParams.use_decoder,
      activation: transformerParams?.activation ?? defaultTransformerParams.activation,
    });
    setActive(true);
    setIsDirty(true);
    setParamsOpen(false);
  }, [
    localSeqLength,
    localLagPeriods,
    localWindowSizes,
    localDModel,
    localNHead,
    localNumEncoderLayers,
    localNumDecoderLayers,
    localDimFeedforward,
    localDropout,
    localBatchSize,
    localEpochs,
    localLearningRate,
    localOptimizer,
    localCriterion,
    setTransformerParams,
    setActive,
    setIsDirty,
    transformerParams,
  ]);

  const handleCancel = useCallback(() => {
    setActive(false);
    setIsDirty(true);
  }, [setActive, setIsDirty]);

  const toggleParams = useCallback(() => {
    if (!paramsOpen && active) {
      setActive(false);
      setIsDirty(true);
    }
    setParamsOpen((prev) => !prev);
  }, [paramsOpen, active, setActive, setIsDirty]);

  const borderColor = active ? "#10A37F" : "#FF4444";

  return (
    <Paper sx={{ p: 2, mb: 2, border: `2px solid ${borderColor}`, borderRadius: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: "#fff" }}>
          Transformer
        </Typography>
        <Button onClick={toggleParams} variant="text" sx={{ color: "#10A37F" }}>
          {paramsOpen ? "Скрыть параметры" : "Показать параметры"}
        </Button>
      </Box>
      <Collapse in={paramsOpen}>
        <Box
          sx={{
            mt: 1,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 2,
          }}
        >
          {/* Параметры последовательности */}
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Длина последовательности (seq_length)</Typography>
            <Slider
              value={localSeqLength}
              onChange={(e, val) => setLocalSeqLength(val)}
              min={1}
              max={50}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Периоды задержки (lag_periods)</Typography>
            <Slider
              value={localLagPeriods}
              onChange={(e, val) => setLocalLagPeriods(val)}
              min={1}
              max={50}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Размеры окон (window_sizes)</Typography>
            <TextField
              value={localWindowSizes}
              onChange={(e) => setLocalWindowSizes(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ backgroundColor: "#2c2c2c", input: { color: "#fff" } }}
            />
          </Box>
          {/* Параметры архитектуры Transformer */}
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>d_model</Typography>
            <Slider
              value={localDModel}
              onChange={(e, val) => setLocalDModel(val)}
              min={128}
              max={512}
              step={16}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>nhead</Typography>
            <Slider
              value={localNHead}
              onChange={(e, val) => setLocalNHead(val)}
              min={1}
              max={16}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Encoder Layers</Typography>
            <Slider
              value={localNumEncoderLayers}
              onChange={(e, val) => setLocalNumEncoderLayers(val)}
              min={1}
              max={6}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Decoder Layers</Typography>
            <Slider
              value={localNumDecoderLayers}
              onChange={(e, val) => setLocalNumDecoderLayers(val)}
              min={0}
              max={4}
              step={1}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>dim_feedforward</Typography>
            <Slider
              value={localDimFeedforward}
              onChange={(e, val) => setLocalDimFeedforward(val)}
              min={256}
              max={1024}
              step={32}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Dropout</Typography>
            <Slider
              value={localDropout}
              onChange={(e, val) => setLocalDropout(val)}
              min={0}
              max={1}
              step={0.05}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          {/* Параметры обучения */}
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Batch Size</Typography>
            <Slider
              value={localBatchSize}
              onChange={(e, val) => setLocalBatchSize(val)}
              min={8}
              max={256}
              step={8}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Эпохи (epochs)</Typography>
            <Slider
              value={localEpochs}
              onChange={(e, val) => setLocalEpochs(val)}
              min={10}
              max={500}
              step={10}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: "#fff" }}>Learning Rate</Typography>
            <Slider
              value={localLearningRate}
              onChange={(e, val) => setLocalLearningRate(val)}
              min={0.0001}
              max={0.01}
              step={0.0001}
              valueLabelDisplay="auto"
              sx={{ color: "#10A37F" }}
            />
          </Box>
          {/* Выбор оптимайзера */}
          <Box>
            <FormControl fullWidth size="small" sx={{ backgroundColor: "#2c2c2c", borderRadius: "4px" }}>
              <InputLabel sx={{ color: "#fff" }}>Optimizer</InputLabel>
              <Select
                value={localOptimizer}
                label="Optimizer"
                onChange={(e) => setLocalOptimizer(e.target.value)}
                sx={{ color: "#fff", ".MuiOutlinedInput-notchedOutline": { borderColor: "#fff" } }}
              >
                <MenuItem value="AdamW">AdamW</MenuItem>
                <MenuItem value="Adam">Adam</MenuItem>
                <MenuItem value="SGD">SGD</MenuItem>
                <MenuItem value="RMSprop">RMSprop</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {/* Выбор критерия */}
          <Box>
            <FormControl fullWidth size="small" sx={{ backgroundColor: "#2c2c2c", borderRadius: "4px" }}>
              <InputLabel sx={{ color: "#fff" }}>Criterion</InputLabel>
              <Select
                value={localCriterion}
                label="Criterion"
                onChange={(e) => setLocalCriterion(e.target.value)}
                sx={{ color: "#fff", ".MuiOutlinedInput-notchedOutline": { borderColor: "#fff" } }}
              >
                <MenuItem value="MSE">MSE</MenuItem>
                <MenuItem value="MAE">MAE</MenuItem>
                <MenuItem value="Huber">Huber</MenuItem>
                <MenuItem value="Huber">SmoothL1</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Collapse>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
        {active ? (
          <Button
            variant="outlined"
            startIcon={<CloseIcon />}
            onClick={handleCancel}
            sx={{ borderColor: "#FF4444", color: "#FF4444" }}
          >
            Отключить
          </Button>
        ) : (
          <Button
            variant="outlined"
            startIcon={<CheckIcon />}
            onClick={handleApply}
            sx={{ borderColor: "#10A37F", color: "#10A37F" }}
          >
            Активировать
          </Button>
        )}
      </Box>

    </Paper>
  );
});



// =======================
// Основной компонент ForecastPage
// =======================
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
    filters
  } = useContext(DashboardContext);

  const stateModifiedData = location.state?.modifiedData || [];
  const stateSelectedColumns = location.state?.selectedColumns || [];
  const initialModifiedData = stateModifiedData.length ? stateModifiedData : [];
  const initialSelectedColumns = stateSelectedColumns.length ? stateSelectedColumns : [];

  useEffect(() => {
    if (!initialModifiedData || initialModifiedData.length === 0 || initialSelectedColumns.length < 2) {
      navigate(-1);
    }
  }, [initialModifiedData, initialSelectedColumns, navigate]);

  const {
    prophetActive,
    prophetParams,
    xgboostActive,
    xgboostParams,
    sarimaActive,
    sarimaParams,
    lstmActive,
    lstmParams,
    gruActive,    // добавлено
    gruParams,    // добавлено
    transformerActive,      // ← Добавляем сюда
    transformerParams,      // ← Добавляем сюда
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
      LSTM: "#a569bd",
      Transformer: "#00FF00"
    };
    return makeCombinedChartData(subset, modelColorMap);
  }, [forecastResults, commonTab]);

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
  }, [allPossibleCols, csvSelectedCols, fileType, mergedRows]);

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

  const handleBack = useCallback(() => navigate(-1), [navigate]);

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
      <Canvas camera={{ position: [0, 0, 1] }} style={{ position: "fixed", top: 0, left: 0 }}>
        <ParticleBackground />
      </Canvas>
      <Box sx={{ position: "relative", minHeight: "100vh" }}>
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
          <CategoricalDataBlock filteredData={filteredData} selectedColumns={selectedColumns} filters={filters} />
        </Box>
        <Box sx={{ position: "relative", width: "100%", height: "calc(100vh - 56px)", alignItems: "center" }}>
          <Box sx={{ flexGrow: 1, transition: "margin-right 0.3s", marginRight: modelsOpen ? "336px" : 0, overflowY: "auto", "&::-webkit-scrollbar": { display: "none" } }}>
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
                    sx={{ color: "#10A37F" }}
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
                    sx={{ color: "#10A37F" }}
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
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "10px",
                      input: { color: "#fff" },
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: freqError ? "red" : "#fff",
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
                      setLocalCommonParams((prev) => ({
                        ...prev,
                        confidenceLevel: val,
                      }))
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
                    if (!validFreqRegex.test(localCommonParams.freq)) {
                      setFreqError("Некорректная частота");
                      return;
                    }
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
                        activeModels.push({
                          model: "Prophet",
                          uniqueParams: prophetParams,
                        });
                      if (xgboostActive)
                        activeModels.push({
                          model: "XGBoost",
                          uniqueParams: xgboostParams,
                        });
                      if (sarimaActive)
                        activeModels.push({
                          model: "SARIMA",
                          uniqueParams: sarimaParams,
                        });
                      if (lstmActive)
                        activeModels.push({
                          model: "LSTM",
                          uniqueParams: lstmParams,
                        });
                      if (gruActive)
                        activeModels.push({
                          model: "GRU",
                          uniqueParams: gruParams,
                        });
                      if (transformerActive)
                        activeModels.push({
                          model: "Transformer",
                          uniqueParams: transformerParams,
                        });


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
                      Prophet: "#ffd6ab",
                      XGBoost: "#ff6382",
                      SARIMA: "#ff9000",
                      LSTM: "#a569bd",
                      GRU: "#00bcd4",
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
          <Slide direction="left" in={modelsOpen}>
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
                "&::-webkit-scrollbar": { width: 0 },
                scrollbarWidth: "none",
                msOverflowStyle: "none",
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
                setActive={(val) => setForecastPageState(prev => ({ ...prev, gruActive: val }))}
                gruParams={gruParams}
                setGruParams={(params) => setForecastPageState(prev => ({ ...prev, gruParams: params }))}
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
