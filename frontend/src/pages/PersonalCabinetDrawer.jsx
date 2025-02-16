import React, { useState, useEffect, useContext } from "react";
import {
  Drawer,
  Box,
  Typography,
  Button,
  IconButton,
  useTheme,
  styled,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { DashboardContext } from "../context/DashboardContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { TbHistory, TbPlus } from "react-icons/tb";

const drawerWidth = 400;

const SessionCard = styled(motion.div)(({ theme }) => ({
  position: "relative",
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  background: "rgba(255,255,255,0.03)",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(12px)",
  cursor: "pointer",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    background: "rgba(255,255,255,0.05)",
  },
}));

const PersonalCabinetDrawer = ({ open, onClose }) => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const {
    resetDashboardState,
    setOriginalData,
    setColumns,
    setFilters,
    setSelectedColumns,
    setUploadedFileName,
    setSecondPageState,
    setPreprocessingSettings,
    setForecastResults,
    setTablePage,
    setTableRowsPerPage,
    setSessionLocked,
    setCurrentSessionId,
  } = useContext(DashboardContext);
  const [sessions, setSessions] = useState([]);
  const navigate = useNavigate();

  const fetchSessions = async () => {
    try {
      const response = await axios.get("http://localhost:8000/session", {
        withCredentials: true,
      });
      setSessions(response.data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  useEffect(() => {
    if (open) fetchSessions();
  }, [open]);

  // При загрузке сессии из истории – подставляем все сохранённые поля в контекст
  const handleLoadSession = async (sessionId, state) => {
    try {
      if (state.originalData) setOriginalData(state.originalData);
      if (state.columns) setColumns(state.columns);
      if (state.filters) setFilters(state.filters);
      if (state.selectedColumns) setSelectedColumns(state.selectedColumns);
      if (state.uploadedFileName) setUploadedFileName(state.uploadedFileName);
      if (state.secondPageState) setSecondPageState(state.secondPageState);
      if (state.preprocessingSettings) setPreprocessingSettings(state.preprocessingSettings);
      if (state.forecastResults) setForecastResults(state.forecastResults);
      if (state.tablePage !== undefined) setTablePage(state.tablePage);
      if (state.tableRowsPerPage !== undefined)
        setTableRowsPerPage(state.tableRowsPerPage);
      // Загруженная сессия становится активной – любые изменения будут сохраняться
      setSessionLocked(false);
      setCurrentSessionId(sessionId);
      onClose();
      navigate("/dashboard");
    } catch (error) {
      console.error("Error loading session:", error);
    }
  };

  const handleNewSession = () => {
    resetDashboardState();
    onClose();
    navigate("/dashboard");
  };

  const getSessionSummary = (state) => ({
    fileName: state.uploadedFileName || "Untitled Session",
    date: state.updatedAt
      ? new Date(state.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "",
    filters: Object.entries(state.filters || {}).map(
      ([key, value]) => `${key}: ${value}`
    ),
  });

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={300}
      PaperProps={{
        sx: {
          width: drawerWidth,
          background:
            "linear-gradient(195deg, rgba(30,30,30,0.9) 0%, rgba(16,163,127,0.05) 100%)",
          backdropFilter: "blur(24px)",
          p: 3,
          borderLeft: "1px solid rgba(255,255,255,0.1)",
          // Кастомизация скроллбара
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "rgba(16,163,127,0.1)",
            borderRadius: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "linear-gradient(45deg, #10A37F, #00ff88)",
            borderRadius: "8px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "linear-gradient(45deg, #0D8F70, #00e68a)",
          },
        },
      }}
    >
      <Box sx={{ position: "relative" }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 0,
            color: "text.secondary",
            "&:hover": { color: "primary.main" },
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: 4,
          }}
        >
          <TbHistory size={32} color={theme.palette.primary.main} />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, #00ff88 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            История
          </Typography>
        </Box>

        {user && (
          <Box
            sx={{
              mb: 4,
              p: 3,
              bgcolor: "rgba(16,163,127,0.1)",
              borderRadius: "12px",
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600, color: "primary.main" }}>
              {user.username}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              {user.email}
            </Typography>
          </Box>
        )}

        <Button
          fullWidth
          variant="contained"
          onClick={handleNewSession}
          startIcon={<TbPlus />}
          sx={{
            mb: 4,
            py: 1.5,
            borderRadius: "12px",
            fontSize: "1rem",
            fontWeight: 600,
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, #10A37F 100%)`,
            "&:hover": { transform: "scale(1.02)" },
          }}
        >
          Новая сессия
        </Button>

        <AnimatePresence>
          {sessions.map((session) => {
            const summary = getSessionSummary(session.state);
            return (
              <SessionCard
                key={session.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => handleLoadSession(session.id, session.state)}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {summary.fileName}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {summary.date}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {summary.filters.map((filter, i) => (
                    <Box
                      key={i}
                      sx={{
                        px: 1,
                        py: 0.5,
                        bgcolor: "rgba(16,163,127,0.15)",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                      }}
                    >
                      {filter}
                    </Box>
                  ))}
                </Box>
              </SessionCard>
            );
          })}
        </AnimatePresence>
      </Box>
    </Drawer>
  );
};

export default PersonalCabinetDrawer;
