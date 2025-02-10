import React from "react";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { Link, useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <AppBar
      position="static"
      elevation={4}
      sx={{
        background: "linear-gradient(90deg, #1B1B1F 0%, #121212 100%)",
        padding: "10px 20px",
        borderRadius: "12px",
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
          🔥 Forecast Data (Fast API + React JS)
        </Typography>
        {!token ? (
          <>
            <Button
              color="primary"
              component={Link}
              to="/login"
              sx={{
                borderRadius: "30px",
                padding: "8px 20px",
                margin: "0 8px",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "scale(1.1)",
                  backgroundColor: "#0D8F70",
                  color: "#FFFFFF"
                },
              }}
            >
              Войти
            </Button>
            <Button
              color="secondary"
              component={Link}
              to="/register"
              sx={{
                borderRadius: "30px",
                padding: "8px 20px",
                margin: "0 8px",
                backgroundColor: "#303030",
                color: "#fff",
                "&:hover": {
                  transform: "scale(1.1)",
                  backgroundColor: "#2C2C2C",
                },
              }}
            >
              Регистрация
            </Button>
          </>
        ) : (
          <>
            <Button
              color="inherit"
              component={Link}
              to="/dashboard"
              sx={{ borderRadius: "30px", padding: "8px 20px", margin: "0 8px" }}
            >
              Личный кабинет
            </Button>
            <Button
              color="error"
              onClick={handleLogout}
              sx={{
                borderRadius: "30px",
                padding: "8px 20px",
                margin: "0 8px",
                "&:hover": { backgroundColor: "#D32F2F",
                             color: "#FFFFFF"
                 },
              }}
            >
              Выйти
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
