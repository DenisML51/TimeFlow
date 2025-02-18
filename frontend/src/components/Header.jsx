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
  background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.background.paper, 0.1)} 100%)`,
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '12px',
  padding: '10px 28px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  color: theme.palette.text.primary,
  '&:hover': {
    background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.25)} 0%, ${alpha(theme.palette.primary.main, 0.15)} 100%)`,
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.2)}`
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
            background: alpha(theme.palette.background.default, 0.65),
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
            backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.02))'
          }}
        >
          <Toolbar sx={{
            height: '100%',
            position: 'relative',
            zIndex: 1,
            padding: { xs: '0 16px', md: '0 32px' }
          }}>
            <Box
              component={motion.div}
              whileHover={{ scale: 1.05 }}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
              onClick={handleLogoClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '8px 16px',
                borderRadius: '12px',
                background: alpha(theme.palette.background.paper, 0.1),
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease'
              }}
            >
              <TbWaveSine
                size={32}
                color={theme.palette.primary.main}
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(16,163,127,0.4))'
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  ml: 2,
                  fontWeight: 800,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, #00ff88 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  position: 'relative',
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}
              >
                TimeFlow
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isHovered ? '100%' : 0 }}
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    height: '2px',
                    background: theme.palette.primary.main,
                    boxShadow: `0 0 8px ${theme.palette.primary.main}`
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
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCabinetOpen(true)}
                  startIcon={<HistoryIcon sx={{ color: theme.palette.primary.main }} />}
                >
                  Аккаунт
                </GlassButton>

                <GlassButton
                  component={motion.div}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  sx={{
                    background: `linear-gradient(45deg, ${alpha(theme.palette.error.main, 0.2)} 0%, ${alpha(theme.palette.error.main, 0.1)} 100%)`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${alpha(theme.palette.error.main, 0.3)} 0%, ${alpha(theme.palette.error.main, 0.2)} 100%)`
                    }
                  }}
                >
                  Выход
                </GlassButton>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <GlassButton
                  component={motion.div}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/login")}
                >
                  Войти
                </GlassButton>
                <GlassButton
                  component={motion.div}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate("/register")}
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, #00ff88 100%)`,
                    color: theme.palette.getContrastText(theme.palette.primary.main),
                    '&:hover': {
                      boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`
                    }
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