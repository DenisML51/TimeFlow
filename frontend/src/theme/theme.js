import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#10A37F",
      secondary: "rgba(16,163,127,0.86)"
    },
    secondary: {
      main: "#1B1B1F",
    },
    background: {
      default: "#131417",
      paper: "#1B1B1F",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#B3B3B3",
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    button: {
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "50px",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "scale(1.05)",
          },
        },
      },
    },
  },
});

export default theme;
