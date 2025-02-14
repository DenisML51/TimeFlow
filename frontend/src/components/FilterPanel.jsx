import React from "react";
import { Box, Typography, TextField, Button, Divider } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import FilterListIcon from "@mui/icons-material/FilterList";
import RotateLeftIcon from "@mui/icons-material/RotateLeft";
import GlobalStyles from "@mui/material/GlobalStyles";

const FilterPanel = ({ originalData, columns, filters, updateFilters }) => {
  // Отбираем столбцы, где встречаются строковые значения
  const categoricalColumns = columns.filter((col) =>
    originalData.some((row) => typeof row[col] === "string")
  );

  const handleFilterChange = (column, value) => {
    const newFilters = { ...filters, [column]: value.trim() === "" ? null : value };
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
        gap: 3,
      }}
    >
      {/* Глобальные стили для скроллбара выпадающего меню */}
      <GlobalStyles
        styles={{
          ".MuiAutocomplete-listbox": {
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "#1E1E1E",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#10A37F",
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "#0D8F70",
            },
          },
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", color: "#10A37F" }}>
        <FilterListIcon sx={{ mr: 1.5, fontSize: 28 }} />
        <Typography variant="h6">Фильтрация данных</Typography>
      </Box>

      {categoricalColumns.map((column) => {
        const options = [...new Set(originalData.map((row) => row[column]))];
        return (
          <Autocomplete
            key={column}
            freeSolo
            disablePortal
            options={options}
            value={filters[column] || ""}
            onChange={(event, newValue) => {
              handleFilterChange(column, newValue || "");
            }}
            onInputChange={(event, newInputValue) => {
              handleFilterChange(column, newInputValue);
            }}
            PopperProps={{
              sx: {
                "& .MuiPaper-root": {
                  bgcolor: "#1E1E1E",
                  color: "#fff",
                  mt: 1,
                  borderRadius: "8px",
                  "& .MuiAutocomplete-listbox": {
                    maxHeight: 200,
                    bgcolor: "#1E1E1E",
                    overflowY: "auto",
                    fontSize: "0.9rem",
                    "& .MuiAutocomplete-option": {
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      px: 2,
                    },
                  },
                },
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={column}
                variant="outlined"
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "8px",
                    bgcolor: "rgba(255,255,255,0.05)",
                    "& fieldset": { borderColor: "rgba(255,255,255,0.1)" },
                    "&:hover fieldset": { borderColor: "rgba(16,163,127,0.5)" },
                    "&.Mui-focused fieldset": { borderColor: "#10A37F" },
                  },
                  input: { color: "#fff" },
                  label: { color: "rgba(255,255,255,0.7)" },
                }}
              />
            )}
          />
        );
      })}

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
          "&:hover": { bgcolor: "rgba(16,163,127,0.9)" },
        }}
      >
        Сбросить фильтры
      </Button>
    </Box>
  );
};

export default FilterPanel;
