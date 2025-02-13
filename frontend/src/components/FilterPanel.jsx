import React from "react";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Button,
  Divider
} from "@mui/material";
import FilterListIcon from '@mui/icons-material/FilterList';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';

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
        p: 2,
        borderRadius: "16px",
        bgcolor: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(12px)",
        boxShadow: 3,
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: 3
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", color: "#10A37F" }}>
        <FilterListIcon sx={{ mr: 1.5, fontSize: 28 }} />
        <Typography variant="h6" component="div">
          Фильтрация данных
        </Typography>
      </Box>

      {categoricalColumns.map((column) => (
        <FormControl
          fullWidth
          variant="outlined"
          key={column}
          sx={{
            // Отступ снизу под каждый селект
            mb: 1,

            // Настраиваем стили для "outlined"
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              bgcolor: "rgba(255,255,255,0.05)",

              // Цвет рамки по умолчанию
              "& fieldset": {
                borderColor: "rgba(255,255,255,0.1)"
              },
              // Цвет рамки при ховере
              "&:hover fieldset": {
                borderColor: "rgba(16,163,127,0.5)"
              },
              // Цвет рамки, когда селект в фокусе
              "&.Mui-focused fieldset": {
                borderColor: "#10A37F"
              }
            }
          }}
        >
          {/* Передаем label без принудительного transform */}
          <InputLabel
            sx={{
              color: "rgba(255,255,255,0.7)!important"
            }}
          >
            {column}
          </InputLabel>

          <Select
            label={column}
            value={filters[column] || "Все"}
            onChange={(e) => handleFilterChange(column, e.target.value)}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: "#1E1E1E",
                  "& .MuiMenuItem-root": {
                    "&.Mui-selected": {
                      bgcolor: "rgba(16,163,127,0.2)"
                    },
                    "&:hover": {
                      bgcolor: "rgba(16,163,127,0.1)"
                    }
                  }
                }
              }
            }}
          >
            <MenuItem value="Все" sx={{ color: "#10A37F" }}>
              Все
            </MenuItem>
            {[...new Set(originalData.map((row) => row[column]))].map((value) => (
              <MenuItem key={value} value={value} sx={{ color: "rgba(255,255,255,0.8)" }}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      <Button
        fullWidth
        variant="contained"
        color="success"
        onClick={resetFilters}
        startIcon={<RotateLeftIcon />}
        sx={{
          borderRadius: "12px",
          py: 1.5,
          fontSize: "1rem",
          bgcolor: "rgba(16,163,127,0.7)",
          "&:hover": {
            bgcolor: "rgba(16,163,127,0.9)"
          }
        }}
      >
        Сбросить фильтры
      </Button>
    </Box>
  );
};

export default FilterPanel;
