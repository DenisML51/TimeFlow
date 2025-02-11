import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SelectedColumnsPage from './components/SelectedColumnsPage';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import { CustomThemeProvider } from './context/ThemeContext';
import { DashboardProvider } from './context/DashboardContext';

const App = () => {
  return (
    <CustomThemeProvider>
      <CssBaseline />
      <Header />
      <DashboardProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/selected" element={
              <ProtectedRoute>
                <SelectedColumnsPage />
              </ProtectedRoute>
            } />
          </Routes>
        </Router>
      </DashboardProvider>
    </CustomThemeProvider>
  );
};

export default App;
