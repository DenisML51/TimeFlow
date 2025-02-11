import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import theme from "./theme/theme";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SelectedColumnsPage from "./components/SelectedColumnsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/Header";
import { DashboardProvider } from "./context/DashboardContext";
import { HistoryProvider } from "./context/HistoryContext";
import { AuthProvider } from "./context/AuthContext";
import "./chartConfig";

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DashboardProvider>
          <HistoryProvider>
            <Router>
              <Box
                sx={{
                  maxWidth: "1200px",
                  margin: "auto",
                  padding: "20px",
                  borderRadius: "16px",
                }}
              >
                <Header />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/selected"
                    element={
                      <ProtectedRoute>
                        <SelectedColumnsPage />
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </Box>
            </Router>
          </HistoryProvider>
        </DashboardProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
