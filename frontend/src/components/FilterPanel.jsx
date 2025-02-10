import React from "react";
import { Box, Typography, FormControl, InputLabel, MenuItem, Select, Button } from "@mui/material";

const FilterPanel = ({ originalData, columns, filters, updateFilters }) => {
  // Отбираем те столбцы, где встречаются строковые значения
  const categoricalColumns = columns.filter((col) =>
    originalData.some((row) => typeof row[col] === "string")
  );

  const handleFilterChange = (column, value) => {
    const newFilters = { ...filters, [column]: value === "Все" ? null : value };
    updateFilters(newFilters);
  };

  const resetFilters = () => {
    updateFilters({});
  };

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: "12px",
        bgcolor: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        boxShadow: 3,
      }}
    >
      <Typography variant="h6" gutterBottom>
        🔍 Фильтр
      </Typography>

      {categoricalColumns.map((column) => (
        <FormControl fullWidth key={column} sx={{ mb: 2 }}>
          <InputLabel>{column}</InputLabel>
          <Select
            value={filters[column] || "Все"}
            onChange={(e) => handleFilterChange(column, e.target.value)}
            label={column}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 200,
                  overflowY: "auto",
                  "&::-webkit-scrollbar": { width: "8px" },
                  "&::-webkit-scrollbar-track": {
                    background: "#f1f1f1",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "#10A37F",
                    borderRadius: "4px",
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: "#0D8F70",
                  },
                },
              },
            }}
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
