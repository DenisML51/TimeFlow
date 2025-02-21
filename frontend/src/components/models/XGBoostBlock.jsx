import React, {memo, useCallback, useContext, useState} from "react";
import {DashboardContext} from "../../context/DashboardContext";
import {Box, Button, Collapse, Paper, Slider, Typography} from "@mui/material";
import {Check as CheckIcon, Close as CloseIcon} from "@mui/icons-material";

export const XGBoostBlock = memo(function XGBoostBlock({
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