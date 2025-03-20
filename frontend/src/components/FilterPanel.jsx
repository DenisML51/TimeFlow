import React from "react";
import { Box, Typography, TextField, Button, Divider, GlobalStyles } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import FilterListIcon from "@mui/icons-material/FilterList";
import { useTheme, alpha } from "@mui/material/styles";

const FilterPanel = ({ originalData, columns, filters, updateFilters }) => {
  // Отбираем столбцы с категориальными (строковыми) данными
  const categoricalColumns = columns.filter((col) =>
    originalData.some((row) => typeof row[col] === "string")
  );

  const handleFilterChange = (column, value) => {
    // Обновляем фильтр без непосредственного сохранения сессии:
    // изменение состояния фильтров приведёт к установке dirty-флага в контексте,
    // а сохранение произойдёт только при переходе или обновлении страницы.
    const newFilters = { ...filters, [column]: value.trim() === "" ? null : value };
    updateFilters(newFilters);
  };

  const resetFilters = () => {
    updateFilters({});
  };

  const theme = useTheme();

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "16px",
        bgcolor: alpha(theme.palette.common.white, 0.05),
        backdropFilter: "blur(12px)",
        boxShadow: 3,
        border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
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
              backgroundColor: theme.palette.background.default,
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.palette.primary.main,
              borderRadius: "3px",
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: alpha(theme.palette.primary.main, 0.8),
            },
          },
        }}
      />

      <Box sx={{ display: "flex", alignItems: "center", color: theme.palette.primary.main }}>
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
                  bgcolor: theme.palette.background.default,
                  color: theme.palette.common.white,
                  mt: 1,
                  borderRadius: "8px",
                  "& .MuiAutocomplete-listbox": {
                    maxHeight: 200,
                    bgcolor: theme.palette.background.default,
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
                    bgcolor: alpha(theme.palette.common.white, 0.05),
                    "& fieldset": { borderColor: alpha(theme.palette.common.white, 0.1) },
                    "&:hover fieldset": { borderColor: alpha(theme.palette.primary.main, 0.5) },
                    "&.Mui-focused fieldset": { borderColor: theme.palette.primary.main },
                  },
                  input: { color: theme.palette.common.white },
                  label: { color: alpha(theme.palette.common.white, 0.7) },
                }}
              />
            )}
          />
        );
      })}

      <Divider sx={{ borderColor: alpha(theme.palette.common.white, 0.1) }} />

      <Button
        fullWidth
        variant="contained"
        color="success"
        onClick={resetFilters}
        sx={{
          borderRadius: "12px",
          py: 1.5,
          fontSize: "1rem",
          bgcolor: alpha(theme.palette.primary.main, 0.7),
          "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.9) },
        }}
      >
        Сбросить фильтры
      </Button>
    </Box>
  );
};

export default FilterPanel;
