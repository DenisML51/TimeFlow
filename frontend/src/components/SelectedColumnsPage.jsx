import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  IconButton,
  Slide,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const SelectedColumnsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // Извлекаем данные из state; если их нет – используем пустые значения
  const { selectedColumns, filteredData, filters } = location.state || { 
    selectedColumns: [], 
    filteredData: [], 
    filters: {} 
  };

  // Локальное состояние для контроля анимации
  const [show, setShow] = useState(true);

  // Функция, вызываемая при клике на кнопку "назад"
  const handleBack = () => {
    setShow(false); // Запускаем выходную анимацию
  };

  // После завершения анимации происходит возврат на предыдущую страницу
  const handleExited = () => {
    navigate(-1);
  };

  // Если данных нет, выводим сообщение с кнопкой возврата
  if (!selectedColumns.length || !filteredData.length) {
    return (
      <Box sx={{ p: 2, backgroundColor: "#121212", minHeight: "100vh", color: "#fff" }}>
        <Typography variant="h6">
          Нет данных для отображения. Вернитесь назад и выберите столбцы.
        </Typography>
        <IconButton onClick={() => navigate(-1)} sx={{ mt: 2, color: "#fff" }}>
          <ArrowBackIcon />
        </IconButton>
      </Box>
    );
  }

  // Формируем строку с информацией по выбранным фильтрам
  const filterInfo = Object.entries(filters)
    .filter(([key, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join(", ");

  // Формируем данные для отображения только с выбранными столбцами
  const dataForDisplay = filteredData.map((row) => {
    const newRow = {};
    selectedColumns.forEach((col) => {
      newRow[col] = row[col];
    });
    return newRow;
  });

  return (
    <Slide direction="left" in={show} mountOnEnter unmountOnExit onExited={handleExited}>
      <Box sx={{ p: 2, backgroundColor: "#121212", minHeight: "100vh", color: "#fff" }}>
        {/* Кнопка "назад" */}
        <IconButton onClick={handleBack} sx={{ mb: 2, color: "#fff" }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Выбранные столбцы: {selectedColumns.join(" и ")}
        </Typography>
        {filterInfo && (
          <Typography variant="body1" sx={{ mb: 2 }}>
            Применённые фильтры: {filterInfo}
          </Typography>
        )}
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: "calc(100vh - 150px)",
            overflow: "auto",
            "&::-webkit-scrollbar": { width: "8px", height: "8px" },
            "&::-webkit-scrollbar-track": { background: "#2c2c2c", borderRadius: "8px" },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "#10A37F", borderRadius: "8px" },
            "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#0D8F70" },
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {selectedColumns.map((col) => (
                  <TableCell
                    key={col}
                    sx={{ bgcolor: "#10A37F", color: "#fff", fontWeight: "bold" }}
                  >
                    {col.replace("_", " ")}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {dataForDisplay.map((row, index) => (
                <TableRow key={index}>
                  {selectedColumns.map((col) => (
                    <TableCell key={col} sx={{ whiteSpace: "nowrap", color: "#fff" }}>
                      {row[col]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Slide>
  );
};

export default SelectedColumnsPage;
