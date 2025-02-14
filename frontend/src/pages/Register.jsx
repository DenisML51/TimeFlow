import React, {useEffect, useState} from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  useTheme,
  Grid
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FloatingLinesBackground } from "../components/AnimatedBackground";
import { TbUserPlus, TbCheck, TbAlertCircle, TbLock } from "react-icons/tb";

const passwordRequirements = [
  { regex: /.{8,}/, label: "Минимум 8 символов" },
  { regex: /[A-Z]/, label: "Заглавная буква" },
  { regex: /[a-z]/, label: "Строчная буква" },
  { regex: /[0-9]/, label: "Цифра" },
  { regex: /[^A-Za-z0-9]/, label: "Спецсимвол" }
];

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState({});
  const navigate = useNavigate();
  const theme = useTheme();

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:8000/auth/register",
        formData,
        { withCredentials: true }
      );

      showDialog({
        icon: <TbCheck size={40} />,
        title: "Успешная регистрация!",
        message: "Проверьте почту для подтверждения аккаунта",
        color: theme.palette.primary.main,
        onClose: () => navigate("/login")
      });
    } catch (error) {
      showDialog({
        icon: <TbAlertCircle size={40} />,
        title: "Ошибка регистрации",
        message: error.response?.data?.message || "Пожалуйста, проверьте введенные данные",
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const passwordStrength = passwordRequirements
    .filter(req => req.regex.test(formData.password))
    .length;

  return (
    <Box sx={{
      position: "relative",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      overflow: "hidden"
    }}>
      <FloatingLinesBackground />

      <Container maxWidth="md" sx={{ position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box
            component="form"
            onSubmit={handleRegister}
            sx={{
              background: "rgba(30, 30, 30, 0.8)",
              backdropFilter: "blur(12px)",
              padding: { xs: 3, sm: 6 },
              borderRadius: "32px",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
              position: "relative",
              overflow: "hidden",
              "&:before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}20 0%, transparent 100%)`,
                pointerEvents: "none"
              }
            }}
          >
            <Typography
              variant="h2"
              sx={{
                textAlign: "center",
                mb: 4,
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, #00ff88 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}
            >
              Создать аккаунт
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <TextField
                    fullWidth
                    name="username"
                    label="Имя пользователя"
                    margin="normal"
                    variant="filled"
                    value={formData.username}
                    onChange={handleChange}
                    sx={textFieldStyles(theme)}
                  />
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }}>
                  <TextField
                    fullWidth
                    name="email"
                    type="email"
                    label="Email"
                    margin="normal"
                    variant="filled"
                    value={formData.email}
                    onChange={handleChange}
                    sx={textFieldStyles(theme)}
                  />
                </motion.div>
              </Grid>

              <Grid item xs={12} md={6}>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <TextField
                    fullWidth
                    name="password"
                    type="password"
                    label="Пароль"
                    margin="normal"
                    variant="filled"
                    value={formData.password}
                    onChange={handleChange}
                    sx={textFieldStyles(theme)}
                  />
                </motion.div>

                <Box sx={{ mt: 3, px: 2 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                    Надежность пароля:
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, height: 4 }}>
                    {[...Array(5)].map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          flex: 1,
                          height: "100%",
                          bgcolor: i < passwordStrength ?
                            theme.palette.primary.main :
                            "rgba(255,255,255,0.1)",
                          borderRadius: 2,
                          transition: "all 0.3s"
                        }}
                      />
                    ))}
                  </Box>

                  <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
                    {passwordRequirements.map((req, i) => (
                      <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <TbLock size={16} color={
                          req.regex.test(formData.password) ?
                          theme.palette.primary.main :
                          "rgba(255,255,255,0.3)"
                        }/>
                        <Typography variant="body2" sx={{
                          color: req.regex.test(formData.password) ?
                            "text.primary" : "text.secondary",
                          transition: "color 0.3s"
                        }}>
                          {req.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Grid>
            </Grid>

            <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.05 }}>
              <Button
                type="submit"
                fullWidth
                disabled={loading || passwordStrength < 5}
                sx={{
                  mt: 4,
                  py: 2,
                  borderRadius: "16px",
                  background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, #00ff88 100%)`,
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "#fff",
                  "&:disabled": {
                    background: "rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.3)"
                  }
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "inherit" }} />
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <TbUserPlus size={24} />
                    Зарегистрироваться
                  </Box>
                )}
              </Button>
            </motion.div>
          </Box>
        </motion.div>
      </Container>

      <Dialog
        open={dialogOpen}
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

const textFieldStyles = (theme) => ({
  "& .MuiFilledInput-root": {
    borderRadius: "12px",
    background: "rgba(255,255,255,0.05)",
    transition: "all 0.3s",
    "&:hover": { background: "rgba(255,255,255,0.08)" },
    "&.Mui-focused": {
      background: "rgba(255,255,255,0.1)",
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}`
    }
  },
  "& .MuiInputLabel-root": {
    color: "#aaa",
    "&.Mui-focused": { color: theme.palette.primary.main }
  }
});

export default Register;