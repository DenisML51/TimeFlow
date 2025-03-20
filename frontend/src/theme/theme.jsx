import { alpha, createTheme } from "@mui/material";

// ********** Тёмная тема **********
const baseDarkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#4FACFE",
      secondary: "#00F2FE",
      main2: alpha("#3010a3", 0.1),
    },
    secondary: {
      main: "#1B1B1F",
    },
    background: {
      default: "#1B1B1F",
      paper: "#1B1B1F",
    },
    common: {
      white: "#ffffff",
    },
    text: {
      primary: "#FFFFFF",
      secondary: "#B3B3B3",
    },
    error: {
      main: "#FF4444",
    },
    red: {
      main: "#FF4444",
    },
    feature: {
      ai: {
        main: "#FF6B6B",
        secondary: "#FFE66D",
      },
      analytics: {
        main: "#4FACFE",
        secondary: "#00F2FE",
      },
      session: {
        main: "#9F7AEA",
        secondary: "#FEE140",
      },
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    button: { textTransform: "none" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "50px",
          transition: "all 0.3s ease-in-out",
          "&:hover": { transform: "scale(1.05)" },
        },
      },
    },
  },
});

const darkTheme = {
  ...baseDarkTheme,
  custom: {
    mainColor: baseDarkTheme.palette.primary.main,
    secColor: baseDarkTheme.palette.primary.secondary,
    primaryGradient: `linear-gradient(135deg, ${baseDarkTheme.palette.primary.secondary} 0%, ${baseDarkTheme.palette.primary.main} 100%)`,
    livePreview: `linear-gradient(145deg, ${alpha(baseDarkTheme.palette.primary.main, 0.1)} 0%, ${alpha(baseDarkTheme.palette.background.default, 0.8)} 100%)`,
    paperBackground: alpha(baseDarkTheme.palette.text.primary, 0.02),
    paperBorder: alpha(baseDarkTheme.palette.text.primary, 0.1),
    featureGradients: {
      upload: `linear-gradient(135deg, ${baseDarkTheme.palette.primary.main} 0%, ${baseDarkTheme.palette.primary.secondary} 100%)`,
      ai: `linear-gradient(135deg, ${baseDarkTheme.palette.feature.ai.main} 0%, ${baseDarkTheme.palette.feature.ai.secondary} 100%)`,
      analytics: `linear-gradient(135deg, ${baseDarkTheme.palette.feature.analytics.main} 0%, ${baseDarkTheme.palette.feature.analytics.secondary} 100%)`,
      session: `linear-gradient(135deg, ${baseDarkTheme.palette.feature.session.main} 0%, ${baseDarkTheme.palette.feature.session.secondary} 100%)`,
    },
    headerBackground: alpha(baseDarkTheme.palette.background.default, 0.65),
    headerBackground1: alpha(baseDarkTheme.palette.background.default, 0.065),
    headerBackdrop: "blur(16px)",
    headerBoxShadow: "0 8px 32px rgba(0,0,0,0.1)",
    headerBorderBottom: "1px solid rgba(255,255,255,0.15)",
    headerBackgroundImage: "linear-gradient(rgba(255,255,255,0.02), rgba(255,255,255,0.02))",
    logoBackground: alpha(baseDarkTheme.palette.background.paper, 0.1),
    logoGradient: `linear-gradient(45deg, ${baseDarkTheme.palette.primary.secondary} 20%, ${baseDarkTheme.palette.primary.main} 100%)`,
    glassButtonBackground: `linear-gradient(90deg, ${alpha(baseDarkTheme.palette.primary.main, 0.15)} 0%, ${alpha(baseDarkTheme.palette.background.paper, 0.1)} 100%)`,
    glassButtonBorder: "1px solid rgba(255,255,255,0.15)",
    glassButtonHoverBackground: `linear-gradient(90deg, ${alpha(baseDarkTheme.palette.primary.main, 0.25)} 0%, ${alpha(baseDarkTheme.palette.primary.main, 0.15)} 100%)`,
    glassButtonHoverBoxShadow: `0 8px 24px ${alpha(baseDarkTheme.palette.primary.main, 0.2)}`,
    logoutButtonBackground: `linear-gradient(45deg, ${alpha(baseDarkTheme.palette.error.main, 0.2)} 0%, ${alpha(baseDarkTheme.palette.error.main, 0.1)} 100%)`,
    logoutButtonHoverBackground: `linear-gradient(45deg, ${alpha(baseDarkTheme.palette.error.main, 0.3)} 0%, ${alpha(baseDarkTheme.palette.error.main, 0.2)} 100%)`,
    registerButtonBackground: `linear-gradient(45deg, ${baseDarkTheme.palette.primary.main} 0%, ${baseDarkTheme.palette.primary.secondary} 100%)`,
    registerButtonHoverBoxShadow: `0 8px 24px ${alpha(baseDarkTheme.palette.primary.main, 0.3)}`,
  },
  categorical: {
    background: alpha(baseDarkTheme.palette.primary.main, 0.03),
    border: alpha(baseDarkTheme.palette.primary.main, 0.25),
    text: baseDarkTheme.palette.primary.main,
    chipBackground: alpha(baseDarkTheme.palette.primary.main, 0.15),
    chipHover: alpha(baseDarkTheme.palette.primary.main, 0.25),
    activeBorder: alpha(baseDarkTheme.palette.error.main, 0.25),
    activeText: alpha(baseDarkTheme.palette.error.main, 0.8),
  },
};

// ********** Светлая тема **********
const baseLightTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#4a90e2", // изменено для более мягкого синего оттенка
      secondary: "#50e3c2", // обновлённый акцент – приятный бирюзовый
      main2: alpha("#3010a3", 0.1),
    },
    secondary: {
      main: "#F0F0F0",
    },
    background: {
      default: "#fafafa", // светлый, нейтральный фон
      paper: "#FFFFFF",
    },
    common: {
      white: "#1a1a1a", // корректное значение белого
    },
    text: {
      primary: "#333333", // мягкий тёмно-серый вместо резкого чёрного
      secondary: "#666666", // чуть светлее для второстепенного текста
    },
    error: {
      main: "#FF4444",
    },
    red: {
      main: "#FF4444",
    },
    feature: {
      ai: {
        main: "#FF6B6B",
        secondary: "#FFE66D",
      },
      analytics: {
        main: "#4FACFE",
        secondary: "#00F2FE",
      },
      session: {
        main: "#9F7AEA",
        secondary: "#FEE140",
      },
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    button: { textTransform: "none" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "50px",
          transition: "all 0.3s ease-in-out",
          "&:hover": { transform: "scale(1.05)" },
        },
      },
    },
  },
});

const lightTheme = {
  ...baseLightTheme,
  custom: {
    mainColor: baseLightTheme.palette.primary.main,
    secColor: baseLightTheme.palette.primary.secondary,
    primaryGradient: `linear-gradient(135deg, ${baseLightTheme.palette.primary.secondary} 0%, ${baseLightTheme.palette.primary.main} 100%)`,
    livePreview: `linear-gradient(145deg, ${alpha(baseLightTheme.palette.primary.main, 0.1)} 0%, ${alpha(baseLightTheme.palette.background.default, 0.8)} 100%)`,
    paperBackground: alpha(baseLightTheme.palette.text.primary, 0.02),
    paperBorder: alpha(baseLightTheme.palette.text.primary, 0.1),
    featureGradients: {
      upload: `linear-gradient(135deg, ${baseLightTheme.palette.primary.main} 0%, ${baseLightTheme.palette.primary.secondary} 100%)`,
      ai: `linear-gradient(135deg, ${baseLightTheme.palette.feature.ai.main} 0%, ${baseLightTheme.palette.feature.ai.secondary} 100%)`,
      analytics: `linear-gradient(135deg, ${baseLightTheme.palette.feature.analytics.main} 0%, ${baseLightTheme.palette.feature.analytics.secondary} 100%)`,
      session: `linear-gradient(135deg, ${baseLightTheme.palette.feature.session.main} 0%, ${baseLightTheme.palette.feature.session.secondary} 100%)`,
    },
    headerBackground: alpha(baseLightTheme.palette.background.default, 0.65),
    headerBackground1: alpha(baseLightTheme.palette.background.default, 0.065),
    headerBackdrop: "blur(16px)",
    headerBoxShadow: "0 8px 32px rgba(0,0,0,0.1)",
    headerBorderBottom: "1px solid rgba(0,0,0,0.15)",
    headerBackgroundImage: "linear-gradient(rgba(0,0,0,0.02), rgba(0,0,0,0.02))",
    logoBackground: alpha(baseLightTheme.palette.background.paper, 0.1),
    logoGradient: `linear-gradient(45deg, ${baseLightTheme.palette.primary.secondary} 20%, ${baseLightTheme.palette.primary.main} 100%)`,
    glassButtonBackground: `linear-gradient(90deg, ${alpha(baseLightTheme.palette.primary.main, 0.15)} 0%, ${alpha(baseLightTheme.palette.background.paper, 0.1)} 100%)`,
    glassButtonBorder: "1px solid rgba(0,0,0,0.15)",
    glassButtonHoverBackground: `linear-gradient(90deg, ${alpha(baseLightTheme.palette.primary.main, 0.25)} 0%, ${alpha(baseLightTheme.palette.primary.main, 0.15)} 100%)`,
    glassButtonHoverBoxShadow: `0 8px 24px ${alpha(baseLightTheme.palette.primary.main, 0.2)}`,
    logoutButtonBackground: `linear-gradient(45deg, ${alpha(baseLightTheme.palette.error.main, 0.2)} 0%, ${alpha(baseLightTheme.palette.error.main, 0.1)} 100%)`,
    logoutButtonHoverBackground: `linear-gradient(45deg, ${alpha(baseLightTheme.palette.error.main, 0.3)} 0%, ${alpha(baseLightTheme.palette.error.main, 0.2)} 100%)`,
    registerButtonBackground: `linear-gradient(45deg, ${baseLightTheme.palette.primary.main} 0%, ${baseLightTheme.palette.primary.secondary} 100%)`,
    registerButtonHoverBoxShadow: `0 8px 24px ${alpha(baseLightTheme.palette.primary.main, 0.3)}`,
  },
  categorical: {
    background: alpha(baseLightTheme.palette.primary.main, 0.03),
    border: alpha(baseLightTheme.palette.primary.main, 0.25),
    text: baseLightTheme.palette.primary.main,
    chipBackground: alpha(baseLightTheme.palette.primary.main, 0.15),
    chipHover: alpha(baseLightTheme.palette.primary.main, 0.25),
    activeBorder: alpha(baseLightTheme.palette.error.main, 0.25),
    activeText: alpha(baseLightTheme.palette.error.main, 0.8),
  },
};

export { darkTheme, lightTheme };
