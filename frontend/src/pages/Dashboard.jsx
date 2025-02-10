import React, { useState, useEffect } from "react";
import FileUpload from "../components/FileUpload";
import FilterPanel from "../components/FilterPanel";
import TableDisplay from "../components/TableDisplay";
import { Box, Grid } from "@mui/material";

const Dashboard = () => {
  const [tableData, setTableData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    console.log("Обновлено tableData:", tableData);
    console.log("Обновлено originalData:", originalData);
    console.log("Обновлены columns:", columns);
  }, [tableData, originalData, columns]);

  return (
    <Grid container spacing={2} justifyContent="center" sx={{ p: 4 }}>
      {/* Левая колонка — Фильтрация */}
      {originalData.length > 0 && columns.length > 0 && (
        <Grid item xs={12} md={3}>
          <FilterPanel originalData={originalData} setTableData={setTableData} columns={columns} />
        </Grid>
      )}

      {/* Центральная колонка — Файл и таблица */}
      <Grid item xs={12} md={9}>
        <FileUpload setTableData={setTableData} setOriginalData={setOriginalData} setColumns={setColumns} />
        {tableData.length > 0 && <TableDisplay data={tableData} />}
      </Grid>
    </Grid>
  );
};

export default Dashboard;

