import React, { useState, useContext, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  useTheme
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { TbLogin, TbCheck, TbAlertCircle } from "react-icons/tb";
import { GradientText } from "../components/home/GradientText";
import { FloatingLinesBackground } from "../components/AnimatedBackground";

const Login = () => {
  const theme = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({});
  const navigate = useNavigate();
  const { fetchUser } = useContext(AuthContext);

  useEffect(() => {
    if (dialogOpen) {
      const timer = setTimeout(() => {
        setDialogOpen(false);
        dialogContent.onClose?.();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, dialogContent]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8000/auth/login",
        { username, password },
        { withCredentials: true }
      );

      await fetchUser();
      showDialog({
        icon: <TbCheck size={40} color="#10A37F" />,
        title: "Добро пожаловать!",
        message: response.data.message,
        onClose: () => navigate("/dashboard")
      });
    } catch (error) {
      showDialog({
        icon: <TbAlertCircle size={40} color={theme.palette.error.main} />,
        title: "Ошибка входа",
        message: error.response?.data?.message || "Неверные учетные данные"
      });
    } finally {
      setLoading(false);
    }
  };

  const showDialog = (content) => {
    setDialogContent(content);
    setDialogOpen(true);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <FloatingLinesBackground density={8} color={alpha(theme.palette.primary.main, 0.1)} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(16px)',
              padding: theme.spacing(4),
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
              position: 'relative',
              '&:before': {
                content: '""',
                position: 'absolute',
                top: -20,
                left: -20,
                right: -20,
                bottom: -20,
                background: `radial-gradient(${theme.palette.primary.main} 0%, transparent 70%)`,
                filter: 'blur(40px)',
                opacity: 0.1,
                zIndex: -1
              }
            }}
          >
            <GradientText variant="h3" sx={{ textAlign: 'center', mb: 4 }}>
              Вход в систему
            </GradientText>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <motion.div whileHover={{ scale: 1.02 }}>
                <TextField
                  fullWidth
                  label="Имя пользователя"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      background: alpha(theme.palette.background.paper, 0.1),
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: theme.palette.primary.main },
                      '&.Mui-focused fieldset': { borderWidth: 2 }
                    }
                  }}
                />
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }}>
                <TextField
                  fullWidth
                  type="password"
                  label="Пароль"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      background: alpha(theme.palette.background.paper, 0.1),
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: theme.palette.primary.main },
                      '&.Mui-focused fieldset': { borderWidth: 2 }
                    }
                  }}
                />
              </motion.div>

              <motion.div whileTap={{ scale: 0.95 }}>
                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  variant="contained"
                  sx={{
                    mt: 2,
                    py: 2,
                    borderRadius: 2,
                    fontSize: 16,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #10A37F 0%, #00FF88 100%)',
                    '&:hover': {
                      boxShadow: '0 8px 32px rgba(16,163,127,0.3)'
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TbLogin size={20} />
                      Войти
                    </Box>
                  )}
                </Button>
              </motion.div>
            </Box>
          </Box>
        </motion.div>
      </Container>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'rgba(30,30,30,0.95)',
            backdropFilter: 'blur(16px)',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)'
          }
        }}
      >
        <DialogContent sx={{ textAlign: 'center', p: 4 }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <Box sx={{ mb: 2 }}>
              {dialogContent.icon}
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              {dialogContent.title}
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              {dialogContent.message}
            </Typography>
          </motion.div>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Login;