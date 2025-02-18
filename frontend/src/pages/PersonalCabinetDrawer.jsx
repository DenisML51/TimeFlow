// src/components/PersonalCabinetDrawer.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import {
  Drawer,
  Box,
  Typography,
  Button,
  IconButton,
  useTheme,
  styled,
  Popover,
  Slide,
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

const DeleteConfirmationPopup = styled(motion.div)(({ theme }) => ({
  position: "absolute",
  top: 40,
  right: 8,
  background: "rgba(30,30,30,0.95)",
  borderRadius: "12px",
  padding: theme.spacing(2),
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(16px)",
  zIndex: 1,
  width: "280px",
}));

const AccountDeleteWrapper = styled(motion.div)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: "12px",
  marginTop: "32px",
  border: "1px solid rgba(255,255,255,0.1)",
  minHeight: "80px",
}));

const AccountDeleteContent = styled(motion.div)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  padding: "16px",
  background: "rgba(30,30,30,0.9)",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

// Обновлённая функция формирования сводки сессии (учтены модели, в том числе LSTM)
const getSessionSummary = (state) => {
  const appliedModels = [];
  if (state.forecastPageState) {
    if (state.forecastPageState.prophetActive) appliedModels.push("Prophet");
    if (state.forecastPageState.xgboostActive) appliedModels.push("XGBoost");
    if (state.forecastPageState.sarimaActive) appliedModels.push("SARIMA");
    if (state.forecastPageState.lstmActive) appliedModels.push("LSTM");
    if (state.forecastPageState.gruActive) appliedModels.push("GRU");
    if (state.forecastPageState.transformerActive) appliedModels.push("Transformer");
  }
  return {
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
    models: appliedModels,
  };
};

const PersonalCabinetDrawer = ({ open, onClose }) => {
  const theme = useTheme();
  const { user, setUser } = useContext(AuthContext);
  const {
    resetDashboardState,
    setOriginalData,
    setFilters,
    setColumns,
    setSelectedColumns,
    setUploadedFileName,
    setSecondPageState,
    setPreprocessingSettings,
    setForecastResults,
    setTablePage,
    setTableRowsPerPage,
    setSessionLocked,
    setCurrentSessionId,
    setForecastPageState, // для загрузки настроек моделей, включая LSTM
  } = useContext(DashboardContext);
  const [sessions, setSessions] = useState([]);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAccountDeleteConfirm, setShowAccountDeleteConfirm] = useState(false);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();
  const cardRefs = useRef({});

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

  useEffect(() => {
    setShowAccountDeleteConfirm(false);
    setDirection(1);
  }, [open]);

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
      if (state.forecastPageState) setForecastPageState(state.forecastPageState); // загружаем настройки моделей (в том числе LSTM)
      if (state.tablePage !== undefined) setTablePage(state.tablePage);
      if (state.tableRowsPerPage !== undefined) setTableRowsPerPage(state.tableRowsPerPage);
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

  const handleDeleteClick = (e, sessionId) => {
    e.stopPropagation();
    setSessionToDelete(sessionId);
    setAnchorEl(e.currentTarget);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:8000/session/${sessionToDelete}`, {
        withCredentials: true,
      });
      setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete));
      setAnchorEl(null);
      setSessionToDelete(null);
    } catch (error) {
      console.error("Error deleting session:", error);
    }
  };

  const handleConfirmAccountDelete = async () => {
    try {
      await axios.delete("http://localhost:8000/auth/account", {
        withCredentials: true,
      });
      resetDashboardState();
      setUser(null);
      onClose();
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  return (
    <>
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
            "&::-webkit-scrollbar": { width: "8px" },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "rgba(16,163,127,0.1)",
              borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "linear-gradient(45deg, #10A37F, #00ff88)",
              borderRadius: "8px",
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

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
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
              Аккаунт
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
                  ref={(el) => (cardRefs.current[session.id] = el)}
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleLoadSession(session.id, session.state)}
                >
                  <IconButton
                    onClick={(e) => handleDeleteClick(e, session.id)}
                    component={motion.div}
                    whileHover={{ scale: 1.1 }}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      color: theme.palette.error.main,
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
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
                  {summary.models && summary.models.length > 0 && (
                    <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {summary.models.map((model, i) => (
                        <Box
                          key={i}
                          sx={{
                            px: 1,
                            py: 0.5,
                            bgcolor: "rgba(16,163,127,0.15)",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            color: "#10A37F",
                            border: "1px solid rgba(16,163,127,0.3)",
                          }}
                        >
                          {model}
                        </Box>
                      ))}
                    </Box>
                  )}
                </SessionCard>
              );
            })}
          </AnimatePresence>

          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            sx={{
              "& .MuiPaper-root": {
                background: "transparent",
                boxShadow: "none",
                overflow: "visible",
              },
            }}
          >
            <DeleteConfirmationPopup
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
                Удалить сессию?
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
                Все данные сессии будут безвозвратно удалены.
              </Typography>
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button
                  onClick={() => setAnchorEl(null)}
                  variant="outlined"
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: "8px",
                    "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                  }}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleConfirmDelete}
                  variant="contained"
                  sx={{
                    px: 2,
                    py: 0.5,
                    borderRadius: "8px",
                    background: theme.palette.error.main,
                    "&:hover": { background: theme.palette.error.dark },
                  }}
                >
                  Удалить
                </Button>
              </Box>
            </DeleteConfirmationPopup>
          </Popover>

          <AccountDeleteWrapper>
            <AnimatePresence initial={false} custom={direction}>
              {showAccountDeleteConfirm ? (
                <AccountDeleteContent
                  key="confirm"
                  custom={direction}
                  variants={{
                    enter: (direction) => ({
                      x: direction > 0 ? "100%" : "-100%",
                      opacity: 0,
                    }),
                    center: { x: 0, opacity: 1 },
                    exit: (direction) => ({
                      x: direction > 0 ? "-100%" : "100%",
                      opacity: 0,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      fullWidth
                      onClick={() => {
                        setDirection(-1);
                        setShowAccountDeleteConfirm(false);
                      }}
                      variant="outlined"
                      sx={{
                        borderRadius: "8px",
                        py: 1,
                        borderColor: "rgba(255,255,255,0.2)",
                        "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                      }}
                    >
                      Отмена
                    </Button>
                    <Button
                      fullWidth
                      onClick={handleConfirmAccountDelete}
                      variant="contained"
                      sx={{
                        borderRadius: "8px",
                        py: 1,
                        background: theme.palette.error.main,
                        "&:hover": { background: theme.palette.error.dark },
                      }}
                    >
                      Подтвердить
                    </Button>
                  </Box>
                </AccountDeleteContent>
              ) : (
                <AccountDeleteContent
                  key="button"
                  custom={direction}
                  variants={{
                    enter: (direction) => ({
                      x: direction > 0 ? "100%" : "-100%",
                      opacity: 0,
                    }),
                    center: { x: 0, opacity: 1 },
                    exit: (direction) => ({
                      x: direction > 0 ? "-100%" : "100%",
                      opacity: 0,
                    }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <Button
                    fullWidth
                    onClick={() => {
                      setDirection(1);
                      setShowAccountDeleteConfirm(true);
                    }}
                    variant="contained"
                    sx={{
                      background: theme.palette.error.main,
                      color: "#fff",
                      borderRadius: "8px",
                      py: 1.5,
                      "&:hover": { background: theme.palette.error.dark },
                    }}
                  >
                    Удалить аккаунт
                  </Button>
                </AccountDeleteContent>
              )}
            </AnimatePresence>
          </AccountDeleteWrapper>
        </Box>
      </Drawer>
    </>
  );
};

export default PersonalCabinetDrawer;
