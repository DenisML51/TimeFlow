import React, {memo, useCallback, useContext, useState} from "react";
import {DashboardContext} from "../../context/DashboardContext";
import {
    Box,
    Button,
    Collapse,
    FormControl,
    InputLabel, MenuItem,
    Paper,
    Select,
    Slider,
    TextField,
    Typography
} from "@mui/material";
import {Check as CheckIcon, Close as CloseIcon} from "@mui/icons-material";

export const TransformerBlock = memo(function TransformerBlock({
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