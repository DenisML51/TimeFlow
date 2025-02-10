import React from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

const TableDisplay = ({ data }) => {
  if (!data || data.length === 0) {
    return <Box sx={{ textAlign: "center", color: "#fff" }}>Нет данных для отображения</Box>;
  }

  const columns = Object.keys(data[0]); // Получаем заголовки колонок

  return (
    <TableContainer component={Paper} sx={{ borderRadius: "12px", overflow: "hidden", boxShadow: 3 }}>
      <Table sx={{ minWidth: 600, bgcolor: "#1E1E1E" }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column} sx={{ color: "#fff", fontWeight: "bold", bgcolor: "#10A37F" }}>
                {column.replace("_", " ")}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <TableCell key={column} sx={{ color: "#fff" }}>
                  {row[column]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableDisplay;
