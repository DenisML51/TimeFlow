import React, { useContext, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
  styled,
  alpha
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import HistoryIcon from "@mui/icons-material/History";
import { AuthContext } from "../context/AuthContext";
import { DashboardContext } from "../context/DashboardContext";
import { motion, useScroll, useTransform } from "framer-motion";
import { TbWaveSine } from "react-icons/tb";
import PersonalCabinetDrawer from "../pages/PersonalCabinetDrawer";

const GlassButton = styled(Button)(({ theme }) => ({
  backdropFilter: 'blur(12px)',
  backgroundColor: alpha(theme.palette.background.paper, 0.1),
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  padding: '8px 24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    transform: 'translateY(-2px)'
  }
}));

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { resetDashboardState } = useContext(DashboardContext);
  const { user, logout } = useContext(AuthContext);
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
          transition={{ duration: 0.8, type: 'spring' }}
          position="fixed"
          sx={{
            background: alpha(theme.palette.background.default, 0.8),
            backdropFilter: 'blur(16px)',
            boxShadow: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <Toolbar sx={{ height: '100%', position: 'relative', zIndex: 1 }}>
            <Box
              component={motion.div}
              whileHover={{ scale: 1.05 }}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              onClick={handleLogoClick}
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
              <TbWaveSine size={32} color={theme.palette.primary.main} />
              <Typography
                variant="h6"
                sx={{
                  ml: 1.5,
                  fontWeight: 800,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, #00ff88 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  position: 'relative'

                }}
              >
                TimeFlow Analytics
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isHovered ? '100%' : 0 }}
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    height: '2px',
                    background: theme.palette.primary.main
                  }}
                />
              </Typography>
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {user ? (
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <GlassButton
                  component={motion.div}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setCabinetOpen(true)}
                  startIcon={<HistoryIcon />}
                >
                  Аккаунт
                </GlassButton>

                <GlassButton
                  component={motion.div}
                  whileHover={{ scale: 1.05 }}
                  onClick={handleLogout}
                  color="error"
                >
                  Выход
                </GlassButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <GlassButton
                  component={motion.div}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate("/login")}
                >
                  Войти
                </GlassButton>
                <GlassButton
                  component={motion.div}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => navigate("/register")}
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, #00ff88 100%)`,
                    color: theme.palette.getContrastText(theme.palette.primary.main)
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
