import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const TableDisplay = ({ data, onSortAsc, onSortDesc, onColumnSelect, selectedColumns }) => {
  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: "center", color: "#fff" }}>
        Нет данных для отображения
      </Box>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: "12px",
        boxShadow: 3,
        maxHeight: "calc(100vh - 300px)",
        overflow: "auto",
        "&::-webkit-scrollbar": { width: "8px", height: "8px" },
        "&::-webkit-scrollbar-track": { background: "#2c2c2c", borderRadius: "8px" },
        "&::-webkit-scrollbar-thumb": { backgroundColor: "#10A37F", borderRadius: "8px" },
        "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#0D8F70" },
      }}
    >
      <Table sx={{ minWidth: 600, bgcolor: "#1E1E1E" }} stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column}
                sx={{
                  color: "#fff",
                  fontWeight: "bold",
                  bgcolor: "#10A37F",
                  whiteSpace: "nowrap",
                  p: 1,
                  cursor: "pointer",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  {/* При клике по названию столбца вызываем onColumnSelect */}
                  <span
                    onClick={() => onColumnSelect && onColumnSelect(column)}
                    style={{
                      color: selectedColumns.includes(column) ? "#FFD700" : "#fff", // выделяем выбранный столбец (например, золотым цветом)
                      userSelect: "none",
                    }}
                  >
                    {column.replace("_", " ")}
                  </span>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Сортировка по возрастанию">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSortAsc(column);
                        }}
                        sx={{ color: "#fff" }}
                      >
                        <ArrowUpwardIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Сортировка по убыванию">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSortDesc(column);
                        }}
                        sx={{ color: "#fff" }}
                      >
                        <ArrowDownwardIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column) => (
                <TableCell key={column} sx={{ color: "#fff", whiteSpace: "nowrap" }}>
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
