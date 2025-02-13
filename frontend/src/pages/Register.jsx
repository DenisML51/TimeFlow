import React, { useState } from "react";
import { Container, TextField, Button, Typography, Box } from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await axios.post(
        "http://127.0.0.1:8000/auth/register",
        { username, email, password },
        { withCredentials: true }
      );
      navigate("/login");
    } catch (error) {
      alert("Регистрация не удалась. Проверьте данные и попробуйте снова.");
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
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
          Регистрация
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
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          variant="filled"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
          helperText="Пароль должен быть не менее 8 символов, содержать строчные и прописные буквы, цифры и спецсимволы."
          InputProps={{
            sx: {
              borderRadius: "8px",
              backgroundColor: "#2c2c2c",
              color: "white",
              "&:hover": { backgroundColor: "#3a3a3a" },
              "&.Mui-focused": {
                backgroundColor: "#3a3a3a",
                borderBottom: "2px solid #1f59b5",
              },
            },
          }}
          InputLabelProps={{ sx: { color: "#aaa" } }}
        />
        <Button
          variant="contained"
          fullWidth
          onClick={handleRegister}
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
          Зарегистрироваться
        </Button>
      </Box>
    </Container>
  );
};

export default Register;
