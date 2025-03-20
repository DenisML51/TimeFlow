import React, { memo, useCallback, useContext, useState } from "react";
import { DashboardContext } from "../../context/DashboardContext";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  MenuItem,
  Paper,
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
import { useTheme, alpha } from "@mui/material/styles";

export const LSTMBlock = memo(function LSTMBlock({
  active,
  setActive,
  lstmParams,
  setLstmParams
}) {
  const theme = useTheme();
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
    criterion: "Huber"
  };

  const init = lstmParams || defaultParams;
  const [localSeqLength, setLocalSeqLength] = useState(init.seq_length);
  const [localLagPeriods, setLocalLagPeriods] = useState(init.lag_periods);
  const [localWindowSizes, setLocalWindowSizes] = useState(
    typeof init.window_sizes === "string"
      ? init.window_sizes
      : init.window_sizes.join(",")
  );
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
      window_sizes: localWindowSizes
        .split(",")
        .map((val) => parseInt(val.trim()))
        .filter((val) => !isNaN(val)),
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
      criterion: localCriterion
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
    localUseAttention,
    localMCDropout,
    localMCSamples,
    localOptimizer,
    localCriterion,
    setLstmParams,
    setActive,
    setIsDirty
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

  // Используем цвета из темы
  const borderColor = active ? theme.palette.primary.main : theme.palette.error.main;

  const circleStyle = {
    minWidth: 28,
    height: 28,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: theme.palette.common.white,
    fontSize: "0.8rem",
    px: 1,
    ml: 1
  };

  const helpIcon = (title) => (
    <Tooltip title={title} arrow>
      <HelpOutlineIcon sx={{ color: theme.palette.primary.main, cursor: "pointer", fontSize: "1rem" }} />
    </Tooltip>
  );

  return (
    <Paper sx={{ p: 2, mb: 2, border: `2px solid ${borderColor}`, borderRadius: 2 , background: theme.custom.headerBackground}}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: theme.palette.common.white }}>
          LSTM
        </Typography>
        <Button onClick={toggleParams} variant="text" sx={{ color: theme.palette.primary.main }}>
          {paramsOpen ? "Скрыть параметры" : "Показать параметры"}
        </Button>
      </Box>
      <Collapse in={paramsOpen}>
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Параметры последовательности */}
          <Accordion TransitionProps={{ unmountOnExit: true }} sx={{color: theme.palette.common.white }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />}>
              <Typography>Параметры последовательности</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Длина последовательности (seq_length)</Typography>
                      {helpIcon("Определяет длину входной последовательности для модели LSTM.")}
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
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Box>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Периоды задержки (lag_periods)</Typography>
                      {helpIcon("Число предыдущих периодов, используемых при формировании входа модели.")}
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
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Box>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">
                        Размеры окон (window_sizes, через запятую)
                      </Typography>
                      {helpIcon("Список размеров скользящего окна для формирования признаков.")}
                    </Box>
                    <Box sx={circleStyle}>{localWindowSizes}</Box>
                  </Box>
                  <TextField
                    value={localWindowSizes}
                    onChange={(e) => setLocalWindowSizes(e.target.value)}
                    variant="outlined"
                    fullWidth
                    sx={{

                      input: { color: theme.palette.common.white },
                      mt: 1
                    }}
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Архитектура LSTM */}
          <Accordion TransitionProps={{ unmountOnExit: true }} sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.common.white }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />}>
              <Typography>Архитектура LSTM</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Число слоёв (num_layers)</Typography>
                      {helpIcon("Количество слоёв LSTM в модели.")}
                    </Box>
                    <Box sx={circleStyle}>{localNumLayers}</Box>
                  </Box>
                  <Slider
                    value={localNumLayers}
                    onChange={(e, val) => setLocalNumLayers(val)}
                    min={1}
                    max={4}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Размер скрытого состояния (hidden_dim)</Typography>
                      {helpIcon("Размерность векторов скрытого состояния в LSTM.")}
                    </Box>
                    <Box sx={circleStyle}>{localHiddenDim}</Box>
                  </Box>
                  <Slider
                    value={localHiddenDim}
                    onChange={(e, val) => setLocalHiddenDim(val)}
                    min={16}
                    max={512}
                    step={16}
                    valueLabelDisplay="auto"
                    sx={{ color: theme.palette.primary.main }}
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
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={localUseAttention}
                          onChange={(e) => setLocalUseAttention(e.target.checked)}
                          sx={{ color: theme.palette.primary.main }}
                        />
                      }
                      label="Использовать внимание"
                    />
                    {helpIcon("Включает механизм внимания поверх LSTM для фокусировки на важных шагах последовательности.")}
                  </Box>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Параметры обучения */}
          <Accordion TransitionProps={{ unmountOnExit: true }} sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.common.white }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />}>
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
                    max={128}
                    step={8}
                    valueLabelDisplay="auto"
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Эпохи (epochs)</Typography>
                      {helpIcon("Сколько раз модель проходит по всему набору данных во время обучения.")}
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
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Learning Rate</Typography>
                      {helpIcon("Определяет скорость обучения — размер шага при обновлении весов.")}
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
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Patience</Typography>
                      {helpIcon("Количество эпох без улучшения, после которых обучение может быть остановлено.")}
                    </Box>
                    <Box sx={circleStyle}>{localPatience}</Box>
                  </Box>
                  <Slider
                    value={localPatience}
                    onChange={(e, val) => setLocalPatience(val)}
                    min={1}
                    max={50}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Delta</Typography>
                      {helpIcon("Минимальное улучшение ошибки для сброса счётчика Early Stopping.")}
                    </Box>
                    <Box sx={circleStyle}>{localDelta}</Box>
                  </Box>
                  <Slider
                    value={localDelta}
                    onChange={(e, val) => setLocalDelta(val)}
                    min={0}
                    max={0.01}
                    step={0.0001}
                    valueLabelDisplay="auto"
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">n_splits</Typography>
                      {helpIcon("Количество разбиений в кросс-валидации при обучении/оценке модели.")}
                    </Box>
                    <Box sx={circleStyle}>{localNSplits}</Box>
                  </Box>
                  <Slider
                    value={localNSplits}
                    onChange={(e, val) => setLocalNSplits(val)}
                    min={2}
                    max={10}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* Дополнительные настройки */}
          <Accordion TransitionProps={{ unmountOnExit: true }} sx={{ backgroundColor: theme.palette.background.paper, color: theme.palette.common.white }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: theme.palette.primary.main }} />}>
              <Typography>Дополнительные настройки</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 2
                }}
              >
                {/* MC-Dropout */}
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={localMCDropout}
                          onChange={(e) => setLocalMCDropout(e.target.checked)}
                          sx={{ color: theme.palette.primary.main }}
                        />
                      }
                      label="MC-Dropout"
                    />
                    {helpIcon("Использование dropout на этапе предсказания для оценки неопределённости (Monte Carlo Dropout).")}
                  </Box>
                </Box>

                {/* MC-Samples */}
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">MC-Samples</Typography>
                      {helpIcon("Количество выборок при использовании MC-Dropout для усреднения предсказаний.")}
                    </Box>
                    <Box sx={circleStyle}>{localMCSamples}</Box>
                  </Box>
                  <Slider
                    value={localMCSamples}
                    onChange={(e, val) => setLocalMCSamples(val)}
                    min={1}
                    max={200}
                    step={1}
                    valueLabelDisplay="auto"
                    sx={{ color: theme.palette.primary.main }}
                  />
                </Box>

                {/* Тип оптимизатора */}
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Тип оптимизатора</Typography>
                      {helpIcon("Оптимизатор, используемый при обучении (Adam, SGD и т.д.).")}
                    </Box>
                    <Box sx={circleStyle}>{localOptimizer}</Box>
                  </Box>
                  <TextField
                    select
                    fullWidth
                    variant="outlined"
                    value={localOptimizer}
                    onChange={(e) => setLocalOptimizer(e.target.value)}
                    sx={{
                      input: { color: theme.palette.common.white },
                      mt: 1
                    }}
                  >
                    <MenuItem value="AdamW">AdamW</MenuItem>
                    <MenuItem value="Adam">Adam</MenuItem>
                    <MenuItem value="SGD">SGD</MenuItem>
                    <MenuItem value="RMSprop">RMSprop</MenuItem>
                  </TextField>
                </Box>

                {/* Критерий */}
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2">Критерий</Typography>
                      {helpIcon("Функция потерь: MSE, MAE или Huber.")}
                    </Box>
                    <Box sx={circleStyle}>{localCriterion}</Box>
                  </Box>
                  <TextField
                    select
                    fullWidth
                    variant="outlined"
                    value={localCriterion}
                    onChange={(e) => setLocalCriterion(e.target.value)}
                    sx={{
                      input: { color: theme.palette.common.white },
                      mt: 1
                    }}
                  >
                    <MenuItem value="MSE">MSE</MenuItem>
                    <MenuItem value="MAE">MAE</MenuItem>
                    <MenuItem value="Huber">Huber</MenuItem>
                  </TextField>
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
            sx={{
              borderColor: theme.palette.error.main,
              color: theme.palette.error.main
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
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main
            }}
          >
            Активировать
          </Button>
        )}
      </Box>
    </Paper>
  );
});
