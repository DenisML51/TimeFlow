import React, { useContext } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  Paper
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TimelineIcon from "@mui/icons-material/Timeline";
import AutoGraphIcon from "@mui/icons-material/AutoGraph";
import SecurityIcon from "@mui/icons-material/Security";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Обработка клика по "Начать"
  const handleStart = () => {
    if (user) {
      // Если пользователь залогинен, отправляем в Dashboard (или /selected, /forecast и т.д.)
      navigate("/dashboard");
    } else {
      // Иначе предлагаем зарегистрироваться
      navigate("/register");
    }
  };

  return (
    <Box sx={{ bgcolor: "#121212", color: "#fff", minHeight: "100vh", top: 20 }}>
      {/* Hero-секция с "подложкой" (градиент или картинка) */}
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          py: 10,
          background: "linear-gradient(135deg, #1B1B1F 0%, #0A0A0A 100%)"
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography
            variant="h3"
            component="h1"
            sx={{ fontWeight: 700, mb: 2 }}
          >
            Добро пожаловать в TSFT
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, color: "rgba(255,255,255,0.8)" }}>
            Мощная платформа для прогнозирования временных рядов на базе
            современных моделей и интерактивного анализа данных.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate("/login")}
              sx={{
                borderRadius: "30px",
                px: 4,
                py: 1.5,
                fontSize: "1rem",
                textTransform: "none",
                transition: "transform 0.3s",
                "&:hover": {
                  transform: "scale(1.05)"
                }
              }}
            >
              Войти
            </Button>
            <Button
              variant="outlined"
              color="success"
              onClick={() => navigate("/register")}
              sx={{
                borderRadius: "30px",
                px: 4,
                py: 1.5,
                fontSize: "1rem",
                textTransform: "none",
                transition: "transform 0.3s",
                "&:hover": {
                  transform: "scale(1.05)"
                }
              }}
            >
              Регистрация
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Блок возможностей (иконки + описания) */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography
          variant="h4"
          sx={{ mb: 6, textAlign: "center", fontWeight: 600 }}
        >
          Почему TSFT?
        </Typography>
        <Grid container spacing={4}>
          {/* 1 */}
          <Grid item xs={12} md={3}>
            <Paper
              sx={{
                p: 4,
                bgcolor: "rgba(255,255,255,0.05)",
                borderRadius: "16px",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 24px rgba(0,0,0,0.2)"
                }
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: "#10A37F", mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Загрузка данных
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Загружайте CSV-файлы для последующей обработки. Доступно только
                авторизованным пользователям.
              </Typography>
            </Paper>
          </Grid>
          {/* 2 */}
          <Grid item xs={12} md={3}>
            <Paper
              sx={{
                p: 4,
                bgcolor: "rgba(255,255,255,0.05)",
                borderRadius: "16px",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 24px rgba(0,0,0,0.2)"
                }
              }}
            >
              <TimelineIcon sx={{ fontSize: 48, color: "#10A37F", mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Гибкая предобработка
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Сглаживание, нормализация, удаление выбросов — всё это доступно
                в удобном интерфейсе.
              </Typography>
            </Paper>
          </Grid>
          {/* 3 */}
          <Grid item xs={12} md={3}>
            <Paper
              sx={{
                p: 4,
                bgcolor: "rgba(255,255,255,0.05)",
                borderRadius: "16px",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 24px rgba(0,0,0,0.2)"
                }
              }}
            >
              <AutoGraphIcon sx={{ fontSize: 48, color: "#10A37F", mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Мощное прогнозирование
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Используйте Prophet, ARIMA и другие модели для точных
                прогнозов будущих значений.
              </Typography>
            </Paper>
          </Grid>
          {/* 4 */}
          <Grid item xs={12} md={3}>
            <Paper
              sx={{
                p: 4,
                bgcolor: "rgba(255,255,255,0.05)",
                borderRadius: "16px",
                textAlign: "center",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 24px rgba(0,0,0,0.2)"
                }
              }}
            >
              <SecurityIcon sx={{ fontSize: 48, color: "#10A37F", mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Безопасность
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Данные хранятся на надёжном сервере. Доступ к загрузке и
                обработке только у зарегистрированных пользователей.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Финальный призыв к действию */}
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
          Готовы погрузиться в прогнозирование?
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: "rgba(255,255,255,0.7)" }}>
          Зарегистрируйтесь прямо сейчас и начните анализ и прогнозирование
          своих данных!
        </Typography>
        <Button
          variant="contained"
          sx={{
            borderRadius: "30px",
            px: 4,
            py: 1.5,
            fontSize: "1rem",
            transition: "transform 0.3s",
            backgroundColor: "#10A37F",
            "&:hover": {
              backgroundColor: "#0D8F70",
              transform: "scale(1.05)"
            }
          }}
          onClick={handleStart}
        >
          {user ? "Перейти в личный кабинет" : "Начать сейчас"}
        </Button>
      </Box>
    </Box>
  );
};

export default Home;
