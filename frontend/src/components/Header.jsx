import React, { useContext, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useTheme,
  styled,
  alpha,
  IconButton,
  Menu,
  MenuItem
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TbWaveSine, TbMenu2, TbHistory, TbLogin, TbUserPlus } from "react-icons/tb";
import { AuthContext } from "../context/AuthContext";
import HistoryModal from "./HistoryModal";

const GlassButton = styled(Button)(({ theme }) => ({
  backdropFilter: 'blur(16px)',
  background: alpha(theme.palette.background.paper, 0.1),
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '12px',
  padding: '10px 24px',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.2)} 0%, transparent 100%)`,
    opacity: 0,
    transition: 'opacity 0.4s'
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.2)}`,
    '&:before': { opacity: 1 }
  }
}));

const Header = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout } = useContext(AuthContext);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);

  const headerVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { 
        type: 'spring', 
        stiffness: 100,
        damping: 20
      }
    }
  };

  return (
    <>
      <AppBar
        component={motion.div}
        variants={headerVariants}
        initial={{ y: -100 }}
        animate="visible"
        position="related"
        sx={{
          background: alpha(theme.palette.background.default, 0.88),
          backdropFilter: 'blur(20px)',
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.12)',
          
        }}
      >
        <Toolbar sx={{ 
          height: { xs: 64, md: 80 },
          px: { xs: 2, md: 4 },
          gap: 2
        }}>
          {/* Логотип */}
          <Box
            component={motion.div}
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate("/")}
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <TbWaveSine 
              size={32} 
              color={theme.palette.primary.main} 
              style={{ transform: 'rotate(-10deg)' }}
            />
            <Typography
              variant="h6"
              sx={{
                ml: 1.5,
                fontWeight: 800,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 30%, #00ff88 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontFamily: 'inherit'
              }}
            >
              TSFT
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Десктопное меню */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            {user ? (
              <>
                <GlassButton
                  startIcon={<TbHistory size={20} />}
                  onClick={() => setHistoryOpen(true)}
                >
                  История
                </GlassButton>
                <GlassButton
                  onClick={logout}
                  sx={{ color: theme.palette.error.main }}
                >
                  Выход
                </GlassButton>
              </>
            ) : (
              <>
                <GlassButton
                  startIcon={<TbLogin size={20} />}
                  onClick={() => navigate("/login")}
                >
                  Войти
                </GlassButton>
                <GlassButton
                  startIcon={<TbUserPlus size={20} />}
                  onClick={() => navigate("/register")}
                  sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, #00ff88 100%)`,
                    color: theme.palette.getContrastText(theme.palette.primary.main)
                  }}
                >
                  Регистрация
                </GlassButton>
              </>
            )}
          </Box>

          {/* Мобильное меню */}
          <IconButton
            sx={{ display: { md: 'none' }, color: 'text.primary' }}
            onClick={(e) => setMobileMenuAnchor(e.currentTarget)}
          >
            <TbMenu2 size={24} />
          </IconButton>
        </Toolbar>

        {/* Мобильное меню */}
        <Menu
          anchorEl={mobileMenuAnchor}
          open={Boolean(mobileMenuAnchor)}
          onClose={() => setMobileMenuAnchor(null)}
          sx={{ 
            '& .MuiPaper-root': {
              background: alpha(theme.palette.background.paper, 0.95),
              backdropFilter: 'blur(20px)',
              borderRadius: '12px',
              boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
              minWidth: 200
            }
          }}
        >
          {user ? (
            [
              <MenuItem 
                key="history" 
                onClick={() => {
                  setHistoryOpen(true);
                  setMobileMenuAnchor(null);
                }}
              >
                <TbHistory style={{ marginRight: 16 }} /> История
              </MenuItem>,
              <MenuItem 
                key="logout" 
                onClick={logout}
                sx={{ color: theme.palette.error.main }}
              >
                Выход
              </MenuItem>
            ]
          ) : (
            [
              <MenuItem 
                key="login" 
                onClick={() => navigate("/login")}
              >
                <TbLogin style={{ marginRight: 16 }} /> Войти
              </MenuItem>,
              <MenuItem 
                key="register" 
                onClick={() => navigate("/register")}
                sx={{ 
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 100%)`,
                  fontWeight: 600
                }}
              >
                <TbUserPlus style={{ marginRight: 16 }} /> Регистрация
              </MenuItem>
            ]
          )}
        </Menu>
      </AppBar>

      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
};

export default Header;