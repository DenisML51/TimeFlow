import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Button,
  CircularProgress,
  Chip,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  TbUpload,
  TbX,
  TbChartLine,
  TbFilter,
  TbArrowRight,
  TbInfoCircle,
} from "react-icons/tb";
import FilterPanel from "../components/FilterPanel";
import TableDisplay from "../components/TableDisplay";
import { FloatingLinesBackground } from "../components/AnimatedBackground";
import { DashboardContext } from "../context/DashboardContext";
import { HistoryContext } from "../context/HistoryContext";
import axios from "axios";

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    originalData,
    setOriginalData,
    filters,
    setFilters,
    sortColumn,
    setSortColumn,
    sortDirection,
    setSortDirection,
    filteredData,
    setFilteredData,
    tableData,
    setTableData,
    columns,
    setColumns,
    selectedColumns,
    setSelectedColumns,
    setUploadedFile,
    uploadedFileName,
    setUploadedFileName,
    currentSessionId,
    setCurrentSessionId,
    resetDashboardState,
    secondPageState,
    preprocessingSettings,
    forecastResults,
    tablePage,
    tableRowsPerPage,
  } = useContext(DashboardContext);
  const { addHistoryItem } = useContext(HistoryContext);

  const [file, setFile] = useState(null);
  const [, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadedFile(selectedFile);
      setUploadedFileName(selectedFile.name);
      setMessage("");
      // При загрузке нового файла новая сессия активна
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    try {
      setLoading(true);
      const response = await axios.post(
        "http://localhost:8000/api/upload",
        formData,
        { withCredentials: true }
      );
      const receivedData = response.data.full_data || [];
      const columnNames = response.data.columns || [];
      setOriginalData(receivedData);
      setColumns(columnNames);
      addHistoryItem(file.name);
      analyzeData(receivedData);

      // Формируем объект состояния для новой сессии, включая все необходимые поля
      const sessionState = {
        originalData: receivedData,
        columns: columnNames,
        filters,
        selectedColumns,
        uploadedFileName: file.name,
        sortColumn,
        sortDirection,
        preprocessingSettings,
        forecastResults,
        secondPageState,
        tablePage,
        tableRowsPerPage,
      };
      const sessionResponse = await axios.post(
        "http://localhost:8000/session",
        { state: sessionState },
        { withCredentials: true }
      );
      setCurrentSessionId(sessionResponse.data.id);
    } catch (error) {
      setMessage("Error uploading file");
      console.error("Upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeData = (data) => {
    if (data.length === 0) return;
    const numericColumns = columns.filter((col) =>
      data.some((row) => !isNaN(parseFloat(row[col])))
    );
    const computedStats = numericColumns.reduce((acc, col) => {
      const values = data
        .map((row) => parseFloat(row[col]))
        .filter((v) => !isNaN(v));
      acc[col] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
      };
      return acc;
    }, {});
    setStats(computedStats);
  };

  const handleReset = () => {
    resetDashboardState();
    setFile(null);
    setMessage("");
    sessionStorage.removeItem("forecastPageState");
    const fileInput = document.getElementById("upload-file");
    if (fileInput) fileInput.value = "";
  };

  const handleConfirmSelection = () => {
    if (Array.isArray(selectedColumns) && selectedColumns.length === 2) {
      navigate("/preprocessing", {
        state: { selectedColumns, filteredData, filters },
      });
    }
  };

  const handleSortAsc = (column) => {
    setSortColumn(column);
    setSortDirection("asc");
  };

  const handleSortDesc = (column) => {
    setSortColumn(column);
    setSortDirection("desc");
  };

  useEffect(() => {
    let data = [...originalData];
    Object.entries(filters).forEach(([column, value]) => {
      if (value) data = data.filter((row) => row[column] === value);
    });
    if (sortColumn && sortDirection) {
      data.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (!isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB))) {
          return sortDirection === "asc"
            ? parseFloat(valA) - parseFloat(valB)
            : parseFloat(valB) - parseFloat(valA);
        }
        return sortDirection === "asc"
          ? valA.toString().localeCompare(valB.toString())
          : valB.toString().localeCompare(valA.toString());
      });
    }
    setFilteredData(data);
    setTableData(data);
  }, [originalData, filters, sortColumn, sortDirection]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        p: 4,
        background: theme.palette.background.default,
      }}
    >
      <FloatingLinesBackground density={6} />
      <Grid container spacing={4} sx={{ position: "relative", zIndex: 1 }}>
        {/* File Upload Section */}
        <Grid item xs={12}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Box
              sx={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "20px",
                p: 4,
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              }}
            >
              <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3 }}>
                <TbUpload size={32} color={theme.palette.primary.main} />
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, #00ff88 100%)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Загркзка и обработка данных
                </Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <input type="file" accept=".csv" onChange={handleFileChange} id="upload-file" hidden />
                <Button
                  component="label"
                  variant="contained"
                  htmlFor="upload-file"
                  startIcon={<TbUpload />}
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: "12px",
                    textTransform: "none",
                    fontSize: "1rem",
                  }}
                >
                  Выберите файл
                </Button>
                {file && (
                  <AnimatePresence>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Chip
                        label={file.name}
                        onDelete={handleReset}
                        deleteIcon={<TbX />}
                        sx={{
                          bgcolor: "rgba(16,163,127,0.15)",
                          color: theme.palette.primary.main,
                          fontWeight: 500,
                        }}
                      />
                    </motion.div>
                  </AnimatePresence>
                )}
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={!file || loading}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: "12px",
                    bgcolor: theme.palette.primary.main,
                    "&:disabled": { bgcolor: "rgba(255,255,255,0.1)" },
                  }}
                >
                  {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Статистика данных"}
                </Button>
              </Box>
              {stats && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                  <Box sx={{ mt: 4, display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {Object.entries(stats).map(([col, values]) => (
                      <Box key={col} sx={{ bgcolor: "rgba(16,163,127,0.1)", p: 2, borderRadius: "12px", minWidth: "200px" }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                          {col}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography>Min: {values.min.toFixed(2)}</Typography>
                          <Typography>Max: {values.max.toFixed(2)}</Typography>
                          <Typography>Avg: {values.avg.toFixed(2)}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </motion.div>
              )}
            </Box>
          </motion.div>
        </Grid>
  
        {/* Filters & Table Section */}
        <Grid item xs={12} md={3}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Box sx={{ p: 3, bgcolor: "rgba(255,255,255,0.05)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3, gap: 1 }}>
                <TbFilter size={24} color={theme.palette.primary.main} />
                <Typography variant="h6" sx={{ fontWeight: 500 }}>Фильтры</Typography>
              </Box>
              <FilterPanel originalData={originalData} columns={columns} filters={filters} updateFilters={setFilters} />
            </Box>
          </motion.div>
        </Grid>
  
        <Grid item xs={12} md={9}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Box sx={{ bgcolor: "rgba(255,255,255,0.05)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)", p: 3 }}>
              <TableDisplay
                data={tableData}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSortAsc={handleSortAsc}
                onSortDesc={handleSortDesc}
                onColumnSelect={(value) => {
                  setSelectedColumns((prev) => {
                    if (prev.includes(value)) return prev.filter((col) => col !== value);
                    if (prev.length < 2) return [...prev, value];
                    return prev;
                  });
                }}
                selectedColumns={selectedColumns}
              />
              {Array.isArray(selectedColumns) && selectedColumns.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <Box sx={{ mt: 4, p: 3, bgcolor: "rgba(16,163,127,0.1)", borderRadius: "12px", border: "1px solid rgba(16,163,127,0.3)" }}>
                    <Typography variant="h6" sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1, color: theme.palette.primary.main }}>
                      <TbChartLine size={24} />
                      Выбранные признаки
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      {selectedColumns.map((col) => (
                        <Chip
                          key={col}
                          label={col}
                          onDelete={() => {
                            setSelectedColumns((prev) => prev.filter((c) => c !== col));
                          }}
                          sx={{
                            bgcolor: "rgba(16,163,127,0.2)",
                            color: "#fff",
                            fontSize: "0.9rem",
                            py: 1.5,
                            px: 2,
                          }}
                        />
                      ))}
                    </Box>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleConfirmSelection}
                      disabled={selectedColumns.length !== 2}
                      endIcon={<TbArrowRight />}
                      sx={{
                        mt: 3,
                        py: 1.5,
                        borderRadius: "12px",
                        fontSize: "1rem",
                        bgcolor: theme.palette.primary.main,
                        "&:disabled": { bgcolor: "rgba(255,255,255,0.1)" },
                      }}
                    >
                      Продолжить анализ
                    </Button>
                    {selectedColumns.length !== 2 && (
                      <Typography variant="body2" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
                        <TbInfoCircle />
                        Выберите временную и таргетную переменную
                      </Typography>
                    )}
                  </Box>
                </motion.div>
              )}
            </Box>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
