import React, { useContext } from "react";
import { AppBar, Toolbar, Typography, Button, IconButton, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import HistoryIcon from "@mui/icons-material/History";
import HistoryModal from "./HistoryModal";
import { DashboardContext } from "../context/DashboardContext";
import { AuthContext } from "../context/AuthContext";

const Header = () => {
  const navigate = useNavigate();
  const { resetDashboardState } = useContext(DashboardContext);
  const { user, logout } = useContext(AuthContext);
  const [historyOpen, setHistoryOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    resetDashboardState();
    navigate("/");
  };

  return (
    <>
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
            🔥 Data Forecasting Tool (Fast API + React JS)
          </Typography>
          {user ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="body1" sx={{ color: "#fff" }}>
                {user.username} ({user.email})
              </Typography>
              <IconButton onClick={() => setHistoryOpen(true)} sx={{ color: "#fff" }}>
                <HistoryIcon />
              </IconButton>
              <Button
                color="error"
                onClick={handleLogout}
                sx={{
                  borderRadius: "30px",
                  padding: "8px 20px",
                  margin: "0 8px",
                  "&:hover": {
                    backgroundColor: "#D32F2F",
                    color: "#FFFFFF",
                  },
                }}
              >
                Выход
              </Button>
            </Box>
          ) : (
            <Box>
              <Button
                color="primary"
                onClick={() => navigate("/login")}
                sx={{
                  borderRadius: "30px",
                  padding: "8px 20px",
                  margin: "0 8px",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    transform: "scale(1.1)",
                    backgroundColor: "#0D8F70",
                    color: "#FFFFFF",
                  },
                }}
              >
                Войти
              </Button>
              <Button
                color="secondary"
                onClick={() => navigate("/register")}
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
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <HistoryModal open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
};

export default Header;
