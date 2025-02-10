import React, { useContext, useEffect } from "react";
import { Box, Grid, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import FileUpload from "../components/FileUpload";
import FilterPanel from "../components/FilterPanel";
import TableDisplay from "../components/TableDisplay";
import { DashboardContext } from "../context/DashboardContext";

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
  } = useContext(DashboardContext);

  // При изменении исходных данных, фильтров или параметров сортировки пересчитываем результирующий набор
  useEffect(() => {
    let data = [...originalData];

    // Применяем фильтры
    Object.entries(filters).forEach(([column, value]) => {
      if (value) {
        data = data.filter((row) => row[column] === value);
      }
    });

    // Применяем сортировку, если задана
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
    setTableData(data.slice(0, 5)); // Выводим только первые 5 строк
  }, [originalData, filters, sortColumn, sortDirection, setFilteredData, setTableData]);

  // Обработчики сортировки – задаём столбец и направление
  const handleSortAsc = (column) => {
    setSortColumn(column);
    setSortDirection("asc");
  };

  const handleSortDesc = (column) => {
    setSortColumn(column);
    setSortDirection("desc");
  };

  // Функция обновления фильтров, передаваемая в FilterPanel
  const updateFilters = (newFilters) => {
    setFilters(newFilters);
  };

  // Функция выбора столбца по клику
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

  // Переход на вторую страницу, если выбраны ровно 2 столбца
  const handleConfirmSelection = () => {
    if (selectedColumns.length === 2) {
      // Передаём в SelectedColumnsPage выбранные столбцы, отфильтрованные данные и текущие фильтры
      navigate("/selected", { state: { selectedColumns, filteredData, filters } });
    }
  };

  return (
    <Grid container spacing={2} justifyContent="center" sx={{ p: 4 }}>
      {originalData.length > 0 && columns.length > 0 && (
        <Grid item xs={12} md={3}>
          <FilterPanel
            originalData={originalData}
            columns={columns}
            filters={filters}
            updateFilters={updateFilters}
          />
        </Grid>
      )}

      <Grid item xs={12} md={9}>
        <FileUpload
          setOriginalData={setOriginalData}
          setColumns={setColumns}
        />
        {tableData.length > 0 && (
          <>
            <Box mt={4}>
              <TableDisplay
                data={tableData}
                onSortAsc={handleSortAsc}
                onSortDesc={handleSortDesc}
                onColumnSelect={handleColumnSelect}
                selectedColumns={selectedColumns}
              />
            </Box>
            {selectedColumns.length > 0 && (
              <Box mt={2} sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <Typography variant="body1">
                  {selectedColumns.length >= 1 && `Первый выбранный: ${selectedColumns[0]}`}
                </Typography>
                {selectedColumns.length === 2 && (
                  <Typography variant="body1">
                    Второй выбранный: {selectedColumns[1]}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  sx={{ mt: 1 }}
                  disabled={selectedColumns.length !== 2}
                  onClick={handleConfirmSelection}
                >
                  Подтвердить
                </Button>
              </Box>
            )}
          </>
        )}
      </Grid>
    </Grid>
  );
};

export default Dashboard;
