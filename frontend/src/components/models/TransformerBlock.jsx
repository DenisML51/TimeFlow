import React, { memo, useCallback, useContext, useState } from "react";
import { DashboardContext } from "../../context/DashboardContext";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  TextField,
  Tooltip,
  Typography
} from "@mui/material";
import {
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  HelpOutline as HelpOutlineIcon
} from "@mui/icons-material";

export const TransformerBlock = memo(function TransformerBlock({
  active,
  setActive,
  transformerParams,
  setTransformerParams
}) {
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
    activation: "gelu"
  };

  const currentTransformerParams = transformerParams || defaultTransformerParams;
  const [localSeqLength, setLocalSeqLength] = useState(currentTransformerParams.seq_length);
  const [localLagPeriods, setLocalLagPeriods] = useState(currentTransformerParams.lag_periods);
  const [localWindowSizes, setLocalWindowSizes] = useState(
    typeof currentTransformerParams.window_sizes === "string"
      ? currentTransformerParams.window_sizes
      : currentTransformerParams.window_sizes.join(",")
  );
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
      window_sizes: localWindowSizes
        .split(",")
        .map((val) => parseInt(val.trim()))
        .filter((val) => !isNaN(val)),
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
    transformerParams
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

  const circleStyle = {
    minWidth: 28,
    height: 28,
    borderRadius: "50%",
    backgroundColor: "#2c2c2c",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "0.8rem",
    px: 1,
    ml: 1
  };

  const helpIcon = (title) => (
    <Tooltip title={title} arrow>
      <HelpOutlineIcon sx={{ color: "#10A37F", cursor: "pointer", fontSize: "1rem" }} />
    </Tooltip>
  );

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
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Параметры последовательности */}
          <Accordion TransitionProps={{ unmountOnExit: true }} sx={{ backgroundColor: "#1e1e1e", color: "#fff" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#10A37F" }} />}>
              <Typography>Параметры последовательности</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Длина последовательности (seq_length)</Typography>
                      {helpIcon("Определяет длину входной последовательности для Transformer.")}
                    </Box>
                    <Box sx={circleStyle}>{localSeqLength}</Box>
                  </Box>
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
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Периоды задержки (lag_periods)</Typography>
                      {helpIcon("Число предыдущих периодов для формирования входа модели.")}
                    </Box>
                    <Box sx={circleStyle}>{localLagPeriods}</Box>
                  </Box>
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
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Размеры окон (window_sizes)</Typography>
                      {helpIcon("Список размеров скользящего окна для формирования признаков.")}
                    </Box>
                    <Box sx={circleStyle}>{localWindowSizes}</Box>
                  </Box>
                  <TextField
                    value={localWindowSizes}
                    onChange={(e) => setLocalWindowSizes(e.target.value)}
                    variant="outlined"
                    fullWidth
                    sx={{ backgroundColor: "#2c2c2c", input: { color: "#fff" }, mt: 1 }}
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Архитектура Transformer */}
          <Accordion TransitionProps={{ unmountOnExit: true }} sx={{ backgroundColor: "#1e1e1e", color: "#fff" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#10A37F" }} />}>
              <Typography>Архитектура Transformer</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">d_model</Typography>
                      {helpIcon("Размерность представления входных данных.")}
                    </Box>
                    <Box sx={circleStyle}>{localDModel}</Box>
                  </Box>
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
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">nhead</Typography>
                      {helpIcon("Количество голов в механизме внимания.")}
                    </Box>
                    <Box sx={circleStyle}>{localNHead}</Box>
                  </Box>
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
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Encoder Layers</Typography>
                      {helpIcon("Количество слоёв энкодера в Transformer.")}
                    </Box>
                    <Box sx={circleStyle}>{localNumEncoderLayers}</Box>
                  </Box>
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
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Decoder Layers</Typography>
                      {helpIcon("Количество слоёв декодера в Transformer.")}
                    </Box>
                    <Box sx={circleStyle}>{localNumDecoderLayers}</Box>
                  </Box>
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
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">dim_feedforward</Typography>
                      {helpIcon("Размер скрытого слоя в блоке feedforward.")}
                    </Box>
                    <Box sx={circleStyle}>{localDimFeedforward}</Box>
                  </Box>
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
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Dropout</Typography>
                      {helpIcon("Доля нейронов, отключаемых для предотвращения переобучения.")}
                    </Box>
                    <Box sx={circleStyle}>{localDropout}</Box>
                  </Box>
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
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Параметры обучения */}
          <Accordion TransitionProps={{ unmountOnExit: true }} sx={{ backgroundColor: "#1e1e1e", color: "#fff" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#10A37F" }} />}>
              <Typography>Параметры обучения</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Batch Size</Typography>
                      {helpIcon("Число образцов, обрабатываемых за один шаг обучения.")}
                    </Box>
                    <Box sx={circleStyle}>{localBatchSize}</Box>
                  </Box>
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
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Эпохи (epochs)</Typography>
                      {helpIcon("Количество проходов по всему набору данных.")}
                    </Box>
                    <Box sx={circleStyle}>{localEpochs}</Box>
                  </Box>
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
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Learning Rate</Typography>
                      {helpIcon("Размер шага при обновлении весов.")}
                    </Box>
                    <Box sx={circleStyle}>{localLearningRate}</Box>
                  </Box>
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
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Оптимизатор и критерий */}
          <Accordion TransitionProps={{ unmountOnExit: true }} sx={{ backgroundColor: "#1e1e1e", color: "#fff" }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#10A37F" }} />}>
              <Typography>Оптимизатор и критерий</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Optimizer</Typography>
                      {helpIcon("Оптимизатор, используемый при обучении модели.")}
                    </Box>
                    <Box sx={circleStyle}>{localOptimizer}</Box>
                  </Box>
                  <FormControl fullWidth size="small" sx={{ backgroundColor: "#2c2c2c", borderRadius: "4px", mt: 1 }}>
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
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Criterion</Typography>
                      {helpIcon("Функция потерь, используемая при обучении.")}
                    </Box>
                    <Box sx={circleStyle}>{localCriterion}</Box>
                  </Box>
                  <FormControl fullWidth size="small" sx={{ backgroundColor: "#2c2c2c", borderRadius: "4px", mt: 1 }}>
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
                      <MenuItem value="SmoothL1">SmoothL1</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
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
