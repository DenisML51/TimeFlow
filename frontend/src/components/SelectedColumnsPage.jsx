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
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const SelectedColumnsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedColumns, filteredData, filters } = location.state || {
    selectedColumns: [],
    filteredData: [],
    filters: {},
  };

  const [show, setShow] = useState(true);

  const handleBack = () => {
    setShow(false);
  };

  const handleExited = () => {
    navigate(-1);
  };

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
      <Box
        sx={{
          p: 5,
          backgroundColor: "#121212",
        //   minHeight: "100vh",
          color: "#fff",
          overflow: "hidden", // Отключаем прокрутку всей страницы
        }}
      >
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
            maxHeight: "480px", // Высота, примерно равная 10 строкам
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: "8px", height: "8px" },
            "&::-webkit-scrollbar-track": {
              background: "#2c2c2c",
              borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#10A37F",
              borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "#0D8F70",
            },
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
