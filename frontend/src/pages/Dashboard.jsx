import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Fade,
  Chip,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import FilterPanel from "../components/FilterPanel";
import TableDisplay from "../components/TableDisplay";
import { DashboardContext } from "../context/DashboardContext";
import { HistoryContext } from "../context/HistoryContext";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import axios from "axios";

const Dashboard = () => {
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
    uploadedFile,
    setUploadedFile,
    resetDashboardState,
  } = useContext(DashboardContext);

  const { addHistoryItem } = useContext(HistoryContext);

  // Локальные состояния для загрузки файла
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setUploadedFile(event.target.files[0]);
      setMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Выберите файл перед загрузкой.");
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
      setLoading(false);
      setMessage("✅ Файл загружен успешно!");
      const receivedData = response.data.full_data || [];
      const columnNames = response.data.columns || [];
      setOriginalData(receivedData);
      setColumns(columnNames);
      addHistoryItem(file.name);
      // Сохраняем полный массив данных для таблицы
      setTableData(receivedData);
    } catch (error) {
      setLoading(false);
      setMessage("❌ Ошибка загрузки файла. Подробности в консоли.");
      console.error("Ошибка загрузки:", error);
    }
  };

  // Применение фильтров и сортировки к загруженным данным
  useEffect(() => {
    let data = [...originalData];
    Object.entries(filters).forEach(([column, value]) => {
      if (value) {
        data = data.filter((row) => row[column] === value);
      }
    });
    if (sortColumn && sortDirection) {
      data.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (!isNaN(valA) && !isNaN(valB)) {
          return sortDirection === "asc"
            ? Number(valA) - Number(valB)
            : Number(valB) - Number(valA);
        }
        return sortDirection === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }
    setFilteredData(data);
    // Сохраняем полный массив данных для таблицы
    setTableData(data);
  }, [originalData, filters, sortColumn, sortDirection, setFilteredData, setTableData]);

  const handleSortAsc = (column) => {
    setSortColumn(column);
    setSortDirection("asc");
  };

  const handleSortDesc = (column) => {
    setSortColumn(column);
    setSortDirection("desc");
  };

  const updateFilters = (newFilters) => {
    setFilters(newFilters);
  };

  const handleColumnSelect = (column) => {
    setSelectedColumns((prevSelected) => {
      if (prevSelected.includes(column)) {
        return prevSelected.filter((col) => col !== column);
      }
      if (prevSelected.length >= 2) {
        return prevSelected;
      }
      return [...prevSelected, column];
    });
  };

  const handleConfirmSelection = () => {
    console.log('Переход на страницу обработки')
    if (selectedColumns.length === 2) {
      console.log('Выбраны', {selectedColumns})
      console.log('Выбраны все столбцы')
      navigate("/selected", { state: { selectedColumns, filteredData, filters } });
    } else {
    console.warn("Выбрано недостаточно столбцов:", selectedColumns);
    console.log('Переход на страницу предобработки')}
  };

  // Сброс состояния при загрузке нового файла
// Функция сброса состояния при загрузке нового файла
const handleReset = () => {
  // Сброс состояния дашборда (уже реализовано)
  resetDashboardState();
  setFile(null);
  setMessage("");

  // Очистка sessionStorage для сброса состояния страницы прогноза
  sessionStorage.removeItem("forecastPageState");
  sessionStorage.removeItem("modifiedData");
  sessionStorage.removeItem("selectedColumns");

  // Сброс значения инпута файла
  const fileInput = document.getElementById("upload-file");
  if (fileInput) fileInput.value = "";
};


  return (
    <Box sx={{ minHeight: "91vh", background: "#121212", p: 3 }}>
      {/* Контейнер с симметричными горизонтальными отступами */}
      <Grid container spacing={0} justifyContent="center" maxWidth="xl" sx={{ mx: "auto", px: 2 }}>
        {/* Верхний блок: загрузка файла и информация о датасете */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              mb: 5,
              borderRadius: "16px",
              bgcolor: "rgba(255,255,255,0.05)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              border: "1px solid rgba(255,255,255,0.1)",
              transition: "transform 0.3s, box-shadow 0.3s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0 12px 40px rgba(16,163,127,0.2)",
              },
            }}
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="h5" sx={{ color: "#e0e0e0", fontWeight: 500 }}>
                Загрузите новый файл или сформируйте выборку
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="upload-file"
                />
                <label htmlFor="upload-file">
                  <Button
                    variant="outlined"
                    component="span"
                    sx={{
                      borderRadius: "12px",
                      borderColor: "#10A37F",
                      color: "#10A37F",
                      px: 3,
                      py: 1,
                    }}
                    startIcon={<CloudUploadIcon />}
                  >
                    Выбрать файл
                  </Button>
                </label>
                {file && (
                  <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={loading}
                    sx={{
                      borderRadius: "12px",
                      px: 3,
                      py: 1,
                      bgcolor: loading ? "rgba(16,163,127,0.3)" : "#10A37F",
                      "&:hover:not(:disabled)": {
                        bgcolor: "#0D8F70",
                        transform: "scale(1.05)",
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: "#fff", mr: 1 }} />
                    ) : (
                      "Загрузить"
                    )}
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleReset}
                  sx={{
                    borderRadius: "12px",
                    px: 3,
                    py: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    transition: "all 0.3s",
                    "&:hover": {
                      bgcolor: "#B71C1C",
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  <RestartAltIcon />
                  Новый файл
                </Button>
              </Box>
              {(uploadedFile && originalData.length > 0) && (
                <Fade in={true}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(16,163,127,0.05)",
                      borderRadius: "12px",
                      p: 2,
                      border: "1px solid rgba(16,163,127,0.4)",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <InsertDriveFileIcon sx={{ mr: 1.5, color: "#10A37F", fontSize: 32 }} />
                      <Typography variant="body1" sx={{ fontWeight: 500, color: "#e0e0e0" }}>
                        {uploadedFile.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: "#b0b0b0" }}>
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                    <Box sx={{ mt: 2, textAlign: "center" }}>
                      <Typography variant="body2" sx={{ color: "#10A37F" }}>
                        Строк: {originalData.length} | Столбцов: {columns.length}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#b0b0b0" }}>
                        Файл готов для дальнейшей обработки!
                      </Typography>
                    </Box>
                  </Box>
                </Fade>
              )}
              {message && (
                <Typography
                  variant="body1"
                  sx={{
                    color: message.startsWith("✅") ? "#10A37F" : "#ff4444",
                    fontWeight: 500,
                  }}
                >
                  {message}
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Левая панель – фильтры */}
        <Grid item xs={12} md={3} sx={{ px: 2 }}>
          <FilterPanel
            originalData={originalData}
            columns={columns}
            filters={filters}
            updateFilters={updateFilters}
          />
        </Grid>

        {/* Правая панель – таблица и блок с выбранными столбцами */}
        <Grid item xs={12} md={9} sx={{ px: 2 }}>
          {tableData.length > 0 && (
            <Box mt={4}>
              <TableDisplay
                data={tableData}
                onSortAsc={handleSortAsc}
                onSortDesc={handleSortDesc}
                onColumnSelect={handleColumnSelect}
                selectedColumns={selectedColumns}
              />
              {selectedColumns.length > 0 && (
                <Paper
                  sx={{
                    mt: 3,
                    p: 3,
                    borderRadius: "16px",
                    bgcolor: "rgba(16,163,127,0.05)",
                    border: "1px solid rgba(16,163,127,0.4)",
                    backdropFilter: "blur(4px)",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ color: "#10A37F", fontWeight: 600 }}>
                    Выбранные столбцы
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {selectedColumns.map((col) => (
                      <Chip
                        key={col}
                        label={col}
                        sx={{
                          backgroundColor: "rgba(16,163,127,0.2)",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: "1rem",
                        }}
                      />
                    ))}
                  </Box>
                  <Button
                    variant="contained"
                    onClick={handleConfirmSelection}
                    disabled={selectedColumns.length !== 2}
                    sx={{
                      borderRadius: "12px",
                      background:
                        selectedColumns.length === 2
                          ? "linear-gradient(90deg, #10A37F 0%, #0D8F70 100%)"
                          : "rgba(16,163,127,0.3)",
                      px: 4,
                      py: 1.2,
                      fontSize: "1rem",
                      textTransform: "none",
                      boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                      transition: "transform 0.3s, box-shadow 0.3s",
                      "&:hover": {
                        transform: selectedColumns.length === 2 ? "scale(1.05)" : "none",
                        boxShadow: selectedColumns.length === 2 ? "0 6px 12px rgba(0,0,0,0.3)" : undefined,
                      },
                    }}
                  >
                    Подтвердить выбор
                  </Button>
                </Paper>
              )}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
