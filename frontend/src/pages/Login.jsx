import React, { useState, useContext } from "react";
import { Container, TextField, Button, Typography, Box, CircularProgress } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const navigate = useNavigate();
  const { fetchUser } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault(); // предотвращаем перезагрузку страницы
    setLoading(true);
    try {
      // Отправляем данные на сервер; сервер устанавливает JWT в httpOnly cookie
      const response = await axios.post(
        "http://localhost:8000/auth/login",
        { username, password },
        { withCredentials: true }
      );
      setLoginMessage(response.data.message || "Вход выполнен успешно");
      // Обновляем состояние пользователя в глобальном контексте
      await fetchUser();
      // Переход на дашборд через короткую задержку, чтобы пользователь увидел сообщение
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      alert("Неверные учетные данные");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        component="form"
        onSubmit={handleLogin}
        sx={{
          backgroundColor: "#1e1e1e",
          padding: "30px",
          borderRadius: "12px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.4)",
          textAlign: "center",
          mt: 5,
        }}
      >
        <Typography variant="h4" mb={3} color="white">
          Вход в аккаунт
        </Typography>
        <TextField
          label="Username"
          fullWidth
          margin="normal"
          variant="filled"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          InputProps={{
            sx: {
              borderRadius: "8px",
              backgroundColor: "#2c2c2c",
              color: "white",
              "&:hover": { backgroundColor: "#3a3a3a" },
              "&.Mui-focused": {
                backgroundColor: "#3a3a3a",
                borderBottom: "2px solid #3f51b5",
              },
            },
          }}
          InputLabelProps={{ sx: { color: "#aaa" } }}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="normal"
          variant="filled"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            sx: {
              borderRadius: "8px",
              backgroundColor: "#2c2c2c",
              color: "white",
              "&:hover": { backgroundColor: "#3a3a3a" },
              "&.Mui-focused": {
                backgroundColor: "#3a3a3a",
                borderBottom: "2px solid #3f51b5",
              },
            },
          }}
          InputLabelProps={{ sx: { color: "#aaa" } }}
        />
        {loading ? (
          <CircularProgress sx={{ mt: 3 }} />
        ) : (
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: "#10A37F",
              color: "white",
              mt: 3,
              borderRadius: "8px",
              padding: "12px",
              fontSize: "16px",
              transition: "0.3s",
              "&:hover": {
                backgroundColor: "#0f8f6f",
                transform: "scale(1.05)",
              },
            }}
          >
            Войти
          </Button>
        )}
        {loginMessage && (
          <Typography variant="body1" color="success.main" mt={2}>
            {loginMessage}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default Login;
