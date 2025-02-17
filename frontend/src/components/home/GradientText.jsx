// src/components/GradientText.jsx
import { Typography, styled } from "@mui/material";

export const GradientText = styled(Typography)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #00FF88 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  display: 'inline-block',
  fontWeight: 700,
  lineHeight: 1.2
}));