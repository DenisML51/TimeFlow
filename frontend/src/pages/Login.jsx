import React, { useState, useContext, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Dialog,
  DialogContent
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { FloatingLinesBackground } from "../components/AnimatedBackground";
import { TbLogin, TbCheck, TbAlertCircle } from "react-icons/tb";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({});
  const navigate = useNavigate();
  const { fetchUser } = useContext(AuthContext);

  // Автоматически закрываем диалог через 3 секунды, если он открыт
  useEffect(() => {
    if (dialogOpen) {
      const timer = setTimeout(() => {
        setDialogOpen(false);
        if (dialogContent.onClose) {
          dialogContent.onClose();
        }
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
        icon: <TbCheck size={40} />,
        title: "Добро пожаловать!",
        message: response.data.message,
        color: "#10A37F",
        onClose: () => navigate("/dashboard")
      });
    } catch (error) {
      showDialog({
        icon: <TbAlertCircle size={40} />,
        title: "Ошибка входа",
        message: error.response?.data?.message || "Неверные учетные данные",
        color: "#ff4444"
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
    <Box
      sx={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        overflow: "hidden"
      }}
    >
      <FloatingLinesBackground />

      {/* Добавляем позиционирование и zIndex, чтобы форма была выше анимированного фона */}
      <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{
              background: "rgba(30, 30, 30, 0.8)",
              backdropFilter: "blur(12px)",
              padding: { xs: "20px", sm: "40px" },
              borderRadius: "24px",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
              position: "relative",
              overflow: "hidden",
              "&:before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "linear-gradient(45deg, #10A37F20 0%, transparent 100%)",
                pointerEvents: "none"
              }
            }}
          >
            <Typography
              variant="h3"
              sx={{
                textAlign: "center",
                mb: 4,
                fontWeight: 700,
                background: "linear-gradient(45deg, #10A37F 30%, #00ff88 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Вход в систему
            </Typography>

            <motion.div whileHover={{ scale: 1.02 }}>
              <TextField
                fullWidth
                label="Имя пользователя"
                margin="normal"
                variant="filled"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{
                  "& .MuiFilledInput-root": {
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.05)",
                    transition: "0.3s",
                    "&:hover": { background: "rgba(255,255,255,0.08)" },
                    "&.Mui-focused": {
                      background: "rgba(255,255,255,0.1)",
                      boxShadow: "0 0 0 2px #10A37F"
                    }
                  },
                  "& .MuiInputLabel-root": {
                    color: "#aaa",
                    "&.Mui-focused": { color: "#10A37F" }
                  }
                }}
              />
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <TextField
                fullWidth
                type="password"
                label="Пароль"
                margin="normal"
                variant="filled"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{
                  "& .MuiFilledInput-root": {
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.05)",
                    transition: "0.3s",
                    "&:hover": { background: "rgba(255,255,255,0.08)" },
                    "&.Mui-focused": {
                      background: "rgba(255,255,255,0.1)",
                      boxShadow: "0 0 0 2px #10A37F"
                    }
                  },
                  "& .MuiInputLabel-root": {
                    color: "#aaa",
                    "&.Mui-focused": { color: "#10A37F" }
                  }
                }}
              />
            </motion.div>

            <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}>
              <Button
                type="submit"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 3,
                  py: 2,
                  borderRadius: "12px",
                  background: "#10A37F",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#ffffff",
                  "&:hover": { background: "#0f8f6f" },
                  "& .MuiCircularProgress-root": { color: "white" }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TbLogin size={20} />
                    Войти в систему
                  </Box>
                )}
              </Button>
            </motion.div>
          </Box>
        </motion.div>
      </Container>

      {/* Модальное окно */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          dialogContent.onClose?.();
        }}
        PaperProps={{
          sx: {
            borderRadius: "24px",
            background: "rgba(30,30,30,0.9)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            boxShadow: "0 16px 32px rgba(0,0,0,0.4)"
          }
        }}
      >
        <DialogContent sx={{ textAlign: "center", p: 4 }}>
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            <Box sx={{ color: dialogContent.color, fontSize: "40px", mb: 2 }}>
              {dialogContent.icon}
            </Box>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
              {dialogContent.title}
            </Typography>
            <Typography variant="body1" sx={{ color: "#aaa" }}>
              {dialogContent.message}
            </Typography>
          </motion.div>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Login;
