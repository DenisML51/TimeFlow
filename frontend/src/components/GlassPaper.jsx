import React from "react";
import { Box } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

const GlassPaper = ({ children, sx }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        background: theme.custom.headerBackground,
        borderRadius: "16px",
        border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 22px rgba(0,0,0,0.2)",
        p: 3,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default GlassPaper;
