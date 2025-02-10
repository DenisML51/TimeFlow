import React, { useState, useEffect } from "react";
import { Box, Grid } from "@mui/material";
import FileUpload from "../components/FileUpload";
import FilterPanel from "../components/FilterPanel";
import TableDisplay from "../components/TableDisplay";

const Dashboard = () => {
  const [originalData, setOriginalData] = useState([]);
  const [filters, setFilters] = useState({});
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);

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
    setTableData(data.slice(0, 5));
  }, [originalData, filters, sortColumn, sortDirection]);

  // Обработчики сортировки: просто задаём выбранный столбец и направление
  const handleSortAsc = (column) => {
    setSortColumn(column);
    setSortDirection("asc");
  };

  const handleSortDesc = (column) => {
    setSortColumn(column);
    setSortDirection("desc");
  };

  // Функция обновления фильтров, передаётся в FilterPanel
  const updateFilters = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <Grid container spacing={2} justifyContent="center" sx={{ p: 4 }}>
      {/* Фильтры показываем, когда уже есть исходные данные и список столбцов */}
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
        {/* FileUpload обновляет оригинальные данные и список столбцов */}
        <FileUpload
          setOriginalData={(data) => {
            setOriginalData(data);
          }}
          setColumns={setColumns}
        />
        {tableData.length > 0 && (
          <Box mt={4}>
            <TableDisplay
              data={tableData}
              onSortAsc={handleSortAsc}
              onSortDesc={handleSortDesc}
            />
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

export default Dashboard;
