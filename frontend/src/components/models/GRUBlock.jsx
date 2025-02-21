import React, {memo, useCallback, useContext, useState} from "react";
import {DashboardContext} from "../../context/DashboardContext";
import {
    Box,
    Button,
    Checkbox,
    Collapse,
    FormControl,
    FormControlLabel, InputLabel, MenuItem,
    Paper, Select,
    Slider,
    TextField,
    Typography
} from "@mui/material";
import {Check as CheckIcon, Close as CloseIcon} from "@mui/icons-material";

export const GRUBlock = memo(function GRUBlock({
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