import React, { useContext, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  useTheme,
  styled,
   Button,
  alpha
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import HistoryIcon from "@mui/icons-material/History";
import { AuthContext } from "../context/AuthContext";
import { DashboardContext } from "../context/DashboardContext";
import { motion, useScroll, useTransform } from "framer-motion";
import { TbWaveSine } from "react-icons/tb";
import PersonalCabinetDrawer from "../pages/PersonalCabinetDrawer";
import { Brightness4, Brightness7 } from "@mui/icons-material";
import { ColorModeContext } from "../context/ThemeContext";

// Новый стиль для переключателя темы – контейнер в виде капсулы
const ThemeToggleContainer = styled(Box)(({ theme }) => ({
  width: 60,
  height: 30,
  borderRadius: 15,
  background:
    theme.palette.mode === "dark"
      ? alpha(theme.palette.primary.main, 0.2)
      : alpha(theme.palette.primary.secondary, 0.2),
  display: "flex",
  alignItems: "center",
  padding: "0 4px",
  cursor: "pointer",
  position: "relative",
  marginRight: theme.spacing(2),
}));

// Круглый ползунок, который перемещается в зависимости от режима
const ToggleKnob = styled(motion.div)(({ theme }) => ({
  width: 26,
  height: 26,
  borderRadius: "50%",
  background: theme.palette.common.white,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "absolute",
}));

// Остальные кнопки в шапке оставляем без изменений (GlassButton)
const GlassButton = styled(motion(Button))(({ theme }) => ({
  backdropFilter: "blur(12px)",
  background: theme.custom.glassButtonBackground,
  border: theme.custom.glassButtonBorder,
  borderRadius: "12px",
  padding: "10px 28px",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  color: theme.palette.text.primary,
  "&:hover": {
    background: theme.custom.glassButtonHoverBackground,
    transform: "translateY(-2px)",
    boxShadow: theme.custom.glassButtonHoverBoxShadow,
  },
}));

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { resetDashboardState } = useContext(DashboardContext);
  const { user, logout } = useContext(AuthContext);
  const { toggleColorMode, mode } = useContext(ColorModeContext);
  const [cabinetOpen, setCabinetOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { scrollY } = useScroll();
  const headerHeight = useTransform(scrollY, [0, 100], [96, 72]);

  const handleLogout = async () => {
    await logout();
    resetDashboardState();
    navigate("/");
  };

  const handleLogoClick = () => navigate("/");

  return (
    <>
      <motion.div style={{ height: headerHeight }}>
        <AppBar
          component={motion.div}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          position="fixed"
          sx={{
            background: theme.custom.headerBackground1,
            backdropFilter: theme.custom.headerBackdrop,
            boxShadow: theme.custom.headerBoxShadow,
            borderBottom: theme.custom.headerBorderBottom,
            backgroundImage: theme.custom.headerBackgroundImage,
          }}
        >
          <Toolbar
            sx={{
              height: "100%",
              position: "relative",
              zIndex: 1,
              padding: { xs: "0 16px", md: "0 32px" },
            }}
          >
            <Box
              component={motion.div}
              whileHover={{ scale: 1.05 }}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              onClick={handleLogoClick}
              sx={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                padding: "8px 16px",
                borderRadius: "12px",
                transition: "all 0.3s ease",
              }}
            >
              <TbWaveSine
                size={32}
                color={theme.palette.primary.main}
                style={{
                  filter: `drop-shadow(0 0 8px ${theme.palette.primary.main})`,
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  ml: 2,
                  fontWeight: 800,
                  background: theme.custom.logoGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  position: "relative",
                  fontSize: { xs: "1.1rem", md: "1.25rem" },
                }}
              >
                TimeFlow
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isHovered ? "100%" : 0 }}
                  style={{
                    position: "absolute",
                    bottom: -4,
                    height: "2px",
                    background: theme.palette.primary.main,
                    boxShadow: `0 0 8px ${theme.palette.primary.main}`,
                  }}
                />
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Новый компонент переключения темы */}
            <ThemeToggleContainer onClick={toggleColorMode}>
              <ToggleKnob
                animate={{ x: mode === "dark" ? 0 : 30 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {mode === "dark" ? (
                  <Brightness7 fontSize="small" sx={{ color: theme.palette.primary.main }} />
                ) : (
                  <Brightness4 fontSize="small" sx={{ color: theme.palette.primary.main }} />
                )}
              </ToggleKnob>
            </ThemeToggleContainer>

            {user ? (
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", ml: 2 }}>
                <GlassButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCabinetOpen(true)}
                  startIcon={<HistoryIcon sx={{ color: theme.palette.primary.main }} />}
                >
                  Аккаунт
                </GlassButton>

                <GlassButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  sx={{
                    background: theme.custom.logoutButtonBackground,
                    "&:hover": {
                      background: theme.custom.logoutButtonHoverBackground,
                    },
                  }}
                >
                  Выход
                </GlassButton>
              </Box>
            ) : (
              <Box sx={{ display: "flex", gap: 2, ml: 2 }}>
                <GlassButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/login")}
                >
                  Войти
                </GlassButton>
                <GlassButton
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/register")}
                  sx={{
                    background: theme.custom.registerButtonBackground,
                    color: theme.palette.getContrastText(theme.palette.primary.main),
                    "&:hover": {
                      boxShadow: theme.custom.registerButtonHoverBoxShadow,
                    },
                  }}
                >
                  Начать бесплатно
                </GlassButton>
              </Box>
            )}
          </Toolbar>
        </AppBar>
      </motion.div>

      <PersonalCabinetDrawer open={cabinetOpen} onClose={() => setCabinetOpen(false)} />
    </>
  );
};

export default Header;
