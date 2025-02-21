import React, {memo, useCallback, useContext, useState} from "react";
import {DashboardContext} from "../../context/DashboardContext";
import {Box, Button, Collapse, Paper, ToggleButton, ToggleButtonGroup, Typography} from "@mui/material";
import {Check as CheckIcon, Close as CloseIcon} from "@mui/icons-material";

export const SarimaBlock = memo(function SarimaBlock({
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