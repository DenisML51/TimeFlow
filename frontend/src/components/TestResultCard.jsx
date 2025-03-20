// components/TestResultCard.jsx
import React from "react";
import { Box, Typography, IconButton, Tooltip, useTheme } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { motion } from "framer-motion";

const TestResultCard = ({ testName, statistic, pValue, description }) => {
  const theme = useTheme();
  let bgColor;
  if (pValue < 0.01) {
    bgColor = theme.palette.success.light;
  } else if (pValue < 0.05) {
    bgColor = theme.palette.warning.light;
  } else if (pValue < 0.1) {
    bgColor = theme.palette.warning.dark;
  } else {
    bgColor = theme.palette.error.main;
  }

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          p: 2,
          mb: 2,
          borderRadius: 2,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(255, 255, 255, 0.05)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: theme.palette.common.white }}>
            {testName}
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.common.white }}>
            Statistic: {statistic.toFixed(3)}
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title={description || "Описание отсутствует"}>
            <IconButton size="small" sx={{ color: theme.palette.common.white }}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
          <Box component="span" sx={{ backgroundColor: bgColor, px: 1, py: 0.5, borderRadius: 2 }}>
            <Typography variant="body2" sx={{ color: "#fff" }}>
              p-value: {pValue.toFixed(3)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

export default TestResultCard;
