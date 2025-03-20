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
  alpha,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { DashboardContext } from "../context/DashboardContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import { TbHistory, TbPlus } from "react-icons/tb";

const drawerWidth = 400;

// Styled компоненты
const SessionCard = styled(motion.div)(({ theme }) => ({
  position: "relative",
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  background: alpha(theme.palette.common.white, 0.03),
  borderRadius: "16px",
  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
  backdropFilter: "blur(12px)",
  cursor: "pointer",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    background: alpha(theme.palette.common.white, 0.05),
  },
}));

const DeleteConfirmationPopup = styled(motion.div)(({ theme }) => ({
  position: "absolute",
  top: 40,
  right: 8,
  background: alpha(theme.palette.background.paper, 0.95),
  borderRadius: "12px",
  padding: theme.spacing(2),
  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
  backdropFilter: "blur(16px)",
  zIndex: 1,
  width: "280px",
}));

const AccountDeleteWrapper = styled(motion.div)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: "12px",
  marginTop: theme.spacing(4),
  border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
  minHeight: "80px",
}));

const AccountDeleteContent = styled(motion.div)(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  padding: theme.spacing(2),
  background: "transparent", // заменили фон на прозрачный
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="down" ref={ref} {...props} />;
});

// Функция формирования сводки сессии
const getSessionSummary = (state) => {
  const appliedModels = [];
  if (state.forecastPageState) {
    if (state.forecastPageState.prophetActive) appliedModels.push("Prophet");
    if (state.forecastPageState.xgboostActive) appliedModels.push("XGBoost");
    if (state.forecastPageState.sarimaActive) appliedModels.push("SARIMA");
    if (state.forecastPageState.lstmActive) appliedModels.push("LSTM");
    if (state.forecastPageState.gruActive) appliedModels.push("GRU");
    if (state.forecastPageState.transformerActive)
      appliedModels.push("Transformer");
  }
  return {
    fileName: state.uploadedFileName || "Untitled Session",
    date: state.updatedAt
      ? new Date(state.updatedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "",
    filters: Object.entries(state.filters || {})
      .filter(([key, value]) => value !== null && value !== undefined && value !== "")
      .map(([key, value]) => `${key}: ${value}`),
    models: appliedModels,
  };
};

// Компонент отображения одной сессии
const SessionItem = ({ session, onLoad, onDelete, cardRef }) => {
  const theme = useTheme();
  const summary = getSessionSummary(session.state);

  // Поддержка клавиатурного ввода (Enter)
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onLoad(session.id, session.state);
    }
  };

  return (
    <SessionCard
      ref={cardRef}
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      onClick={() => onLoad(session.id, session.state)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Загрузить сессию ${summary.fileName}`}
    >
      <Tooltip title="Удалить сессию">
        <IconButton
          onClick={(e) => onDelete(e, session.id)}
          component={motion.div}
          whileHover={{ scale: 1.1 }}
          sx={{
            position: "absolute",
            top: 8,
            right: 8,
            color: theme.palette.error.main,
          }}
          aria-label="Удалить сессию"
        >
          <CloseIcon />
        </IconButton>
      </Tooltip>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: 600 }}>
          {summary.fileName}
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
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
              fontSize: "0.75rem",
              bgcolor: alpha(theme.palette.primary.main, 0.15),
              borderRadius: "6px",
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
                bgcolor: alpha(theme.palette.primary.main, 0.15),
                borderRadius: "6px",
                fontSize: "0.75rem",
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              {model}
            </Box>
          ))}
        </Box>
      )}
    </SessionCard>
  );
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
    setForecastPageState,
  } = useContext(DashboardContext);

  const [sessions, setSessions] = useState([]);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showAccountDeleteConfirm, setShowAccountDeleteConfirm] = useState(false);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const cardRefs = useRef({});
  const closeButtonRef = useRef(null);

  // Фокусировка на кнопке закрытия при открытии окна
  useEffect(() => {
    if (open && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [open]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get("http://localhost:8000/session", {
        withCredentials: true,
      });
      setSessions(response.data);
    } catch (err) {
      console.error("Ошибка загрузки сессий:", err);
      setError("Ошибка загрузки сессий");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSessions();
      setShowAccountDeleteConfirm(false);
      setDirection(1);
    }
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
      if (state.forecastPageState) setForecastPageState(state.forecastPageState);
      if (state.tablePage !== undefined) setTablePage(state.tablePage);
      if (state.tableRowsPerPage !== undefined)
        setTableRowsPerPage(state.tableRowsPerPage);
      setSessionLocked(false);
      setCurrentSessionId(sessionId);
      onClose();
      navigate("/dashboard");
    } catch (error) {
      console.error("Ошибка загрузки сессии:", error);
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
      console.error("Ошибка удаления сессии:", error);
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
      console.error("Ошибка удаления аккаунта:", error);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      transitionDuration={300}
      PaperProps={{
        sx: {
          width: { xs: "90%", sm: drawerWidth },
          background: `linear-gradient(195deg, ${alpha(
            theme.palette.background.paper,
            0.9
          )} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          backdropFilter: "blur(24px)",
          p: 3,
          borderLeft: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
          "&::-webkit-scrollbar": { width: "8px" },
          "&::-webkit-scrollbar-track": {
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            borderRadius: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.secondary})`,
            borderRadius: "8px",
          },
        },
      }}
      role="dialog"
      aria-modal="true"
    >
      <Box sx={{ position: "relative" }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 0,
            color: theme.palette.text.secondary,
            "&:hover": { color: theme.palette.primary.main },
          }}
          aria-label="Закрыть окно"
          ref={closeButtonRef}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <TbHistory size={32} color={theme.palette.primary.main} />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.secondary} 100%)`,
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
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: "12px",
            }}
          >
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, color: theme.palette.primary.main }}
            >
              {user.username}
            </Typography>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
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
            background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.main} 100%)`,
            "&:hover": { transform: "scale(1.02)" },
          }}
          aria-label="Создать новую сессию"
        >
          Новая сессия
        </Button>

        {/* Индикатор загрузки */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
            <CircularProgress aria-label="Загрузка сессий" />
          </Box>
        )}

        {error && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <AnimatePresence>
          {!loading &&
            sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                onLoad={handleLoadSession}
                onDelete={handleDeleteClick}
                cardRef={(el) => (cardRefs.current[session.id] = el)}
              />
            ))}
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
            <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
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
                  "&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.05) },
                }}
                aria-label="Отмена"
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
                  color: theme.palette.text.primary,
                  background: theme.palette.error.main,
                  "&:hover": { background: theme.palette.error.dark },
                }}
                aria-label="Подтвердить удаление сессии"
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
                      borderColor: alpha(theme.palette.common.white, 0.2),
                      "&:hover": { backgroundColor: alpha(theme.palette.common.white, 0.05) },
                    }}
                    aria-label="Отмена удаления аккаунта"
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
                    aria-label="Подтвердить удаление аккаунта"
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
                  aria-label="Удалить аккаунт"
                >
                  Удалить аккаунт
                </Button>
              </AccountDeleteContent>
            )}
          </AnimatePresence>
        </AccountDeleteWrapper>
      </Box>
    </Drawer>
  );
};

export default PersonalCabinetDrawer;
