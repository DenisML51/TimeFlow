import React, {memo, useCallback, useContext, useState} from "react";
import {DashboardContext} from "../../context/DashboardContext";
import {Box, Button, Collapse, FormControl, InputLabel, MenuItem, Paper, Select, Typography} from "@mui/material";
import {Check as CheckIcon, Close as CloseIcon} from "@mui/icons-material";

export const ProphetBlock = memo(function ProphetBlock({
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