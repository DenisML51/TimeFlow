import React, { memo, useCallback, useContext, useState } from "react";
import { DashboardContext } from "../../context/DashboardContext";
import {
  Box,
  Button,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography
} from "@mui/material";
import { Check as CheckIcon, Close as CloseIcon } from "@mui/icons-material";
import { useTheme, alpha } from "@mui/material/styles";

export const ProphetBlock = memo(function ProphetBlock({
  active,
  setActive,
  prophetParams,
  setProphetParams,
}) {
  const theme = useTheme();
  const [localSeasonalityMode, setLocalSeasonalityMode] = useState(
    prophetParams?.seasonality_mode || "additive"
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
    if (!paramsOpen && active) {
      setActive(false);
      setIsDirty(true);
    }
    setParamsOpen((prev) => !prev);
  }, [paramsOpen, active, setActive, setIsDirty]);

  const borderColor = active
    ? theme.palette.primary.main
    : theme.palette.error.main;

  return (
    <Paper
      sx={{
        p: 2,
        mb: 2,
        background: theme.custom.headerBackground,
        border: `2px solid ${borderColor}`,
        borderRadius: 2,
        transition: "border-color 0.2s",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: "bold", color: theme.palette.common.white }}
        >
          Prophet
        </Typography>
        <Button onClick={toggleParams} variant="text" sx={{ color: theme.palette.primary.main }}>
          {paramsOpen ? "Скрыть параметры" : "Показать параметры"}
        </Button>
      </Box>
      <Collapse in={paramsOpen}>
        <Box sx={{ mt: 1 }}>
          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel sx={{ color: theme.palette.common.white }}>Seasonality Mode</InputLabel>
            <Select
              value={localSeasonalityMode}
              label="Seasonality Mode"
              onChange={(e) => setLocalSeasonalityMode(e.target.value)}
              sx={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.common.white,
                "& .MuiSvgIcon-root": { color: theme.palette.common.white },
                "& .MuiOutlinedInput-notchedOutline": { borderColor: theme.palette.common.white }
              }}
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
            onClick={handleCancel}
            sx={{
              borderColor: theme.palette.error.main,
              color: theme.palette.error.main,
              "&:hover": {
                borderColor: theme.palette.error.main,
                backgroundColor: alpha(theme.palette.error.main, 0.1)
              }
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
              color: theme.palette.primary.main,
              "&:hover": {
                borderColor: theme.palette.primary.main,
                backgroundColor: alpha(theme.palette.primary.main, 0.1)
              }
            }}
          >
            Активировать
          </Button>
        )}
      </Box>
    </Paper>
  );
});
