import React, { useState, useEffect } from "react";
import { Box, Typography, FormControl, InputLabel, MenuItem, Select, Button } from "@mui/material";

const FilterPanel = ({ originalData, setTableData, columns }) => {
  const [filters, setFilters] = useState({});

  useEffect(() => {
    console.log("Фильтры обновлены:", filters);
    applyFilters();
  }, [filters]);

  // Фильтруем только категориальные (текстовые) столбцы
  const categoricalColumns = columns.filter((col) =>
    originalData.some((row) => typeof row[col] === "string")
  );

  // Функция для обработки изменений фильтра
  const handleFilterChange = (column, value) => {
    setFilters((prev) => ({
      ...prev,
      [column]: value === "Все" ? null : value,
    }));
  };

  // Функция применения фильтров
  const applyFilters = () => {
    let filteredData = [...originalData];

    Object.entries(filters).forEach(([column, value]) => {
      if (value) {
        filteredData = filteredData.filter((row) => row[column] === value);
      }
    });

    setTableData(filteredData.slice(0, 5)); // Показываем только 5 строк
  };

  // Функция сброса фильтров
  const resetFilters = () => {
    setFilters({});
    setTableData(originalData.slice(0, 5)); // Возвращаем исходные данные
  };

  return (
    <Box sx={{ p: 3, borderRadius: "12px", bgcolor: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(10px)", boxShadow: 3 }}>
      <Typography variant="h6" gutterBottom>
        🔍 Фильтр
      </Typography>

      {categoricalColumns.map((column) => (
        <FormControl fullWidth key={column} sx={{ mb: 2 }}>
          <InputLabel>{column}</InputLabel>
          <Select
            value={filters[column] || "Все"}
            onChange={(e) => handleFilterChange(column, e.target.value)}
          >
            <MenuItem value="Все">Все</MenuItem>
            {[...new Set(originalData.map((row) => row[column]))].map((value) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}

      <Button fullWidth variant="contained" color="success" onClick={resetFilters}>
        ♻️ Сбросить фильтры
      </Button>
    </Box>
  );
};

export default FilterPanel;
