import React, { useContext } from "react";
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
  TablePagination,
  Button,
} from "@mui/material";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { DashboardContext } from "../context/DashboardContext";

const TableDisplay = ({
  data,
  onSortAsc,
  onSortDesc,
  onColumnSelect,
  selectedColumns,
}) => {
  // Используем состояние пагинации из контекста
  const { tablePage, setTablePage, tableRowsPerPage, setTableRowsPerPage } =
    useContext(DashboardContext);

  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: "center", color: "#fff", mt: 2 }}>
        Нет данных для отображения
      </Box>
    );
  }

  const columns = Object.keys(data[0]);
  const paginatedData = data.slice(
    tablePage * tableRowsPerPage,
    tablePage * tableRowsPerPage + tableRowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setTablePage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setTableRowsPerPage(parseInt(event.target.value, 10));
    setTablePage(0);
  };

  const handleExportCSV = () => {
    const header = columns.join(",");
    const csvRows = paginatedData.map((row) =>
      columns.map((col) => row[col]).join(",")
    );
    const csvString = [header, ...csvRows].join("\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "data_page.csv");
    link.click();
  };

  return (
    <Box>
      <TableContainer
        component={Paper}
        sx={{
          bgcolor: "#1E1E1E",
          borderRadius: "12px",
          boxShadow: 3,
          maxHeight: "calc(100vh - 380px)",
          overflow: "auto",
          "&::-webkit-scrollbar": { width: "8px", height: "8px" },
          "&::-webkit-scrollbar-track": {
            background: "#2c2c2c",
            borderRadius: "8px",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#10A37F",
            borderRadius: "8px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#0D8F70",
          },
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => {
                const isSelected = selectedColumns.includes(column);
                return (
                  <TableCell
                    key={column}
                    sx={{
                      color: "#fff",
                      fontWeight: "bold",
                      background: "#10A37F",
                      whiteSpace: "nowrap",
                      p: 1,
                      cursor: "pointer",
                      transition: "background-color 0.3s",
                      borderBottom: isSelected ? "3px solid #0D8F70" : "none",
                    }}
                    onClick={() => onColumnSelect && onColumnSelect(column)}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: "100%",
                      }}
                    >
                      <span style={{ userSelect: "none" }}>
                        {column.replaceAll("_", " ")}
                      </span>
                      {isSelected && (
                        <CheckCircleOutlineIcon
                          sx={{ color: "#fff", fontSize: "1.2rem" }}
                        />
                      )}
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
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow
                key={rowIndex}
                sx={{
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.03)",
                  },
                }}
              >
                {columns.map((column) => {
                  const isSelected = selectedColumns.includes(column);
                  return (
                    <TableCell
                      key={column}
                      sx={{
                        color: "#fff",
                        whiteSpace: "nowrap",
                        transition: "border-left 0.3s",
                        borderLeft: isSelected ? "3px solid #10A37F" : "none",
                        fontWeight: isSelected ? "bold" : "normal",
                      }}
                    >
                      {row[column]}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box
        sx={{
          mt: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TablePagination
          component="div"
          count={data.length}
          page={tablePage}
          onPageChange={handleChangePage}
          rowsPerPage={tableRowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Строк на странице"
          sx={{
            color: "#fff",
            "& .MuiSelect-icon": { color: "#fff" },
            "& .MuiTablePagination-displayedRows": { color: "#fff" },
          }}
        />

        <Button
          variant="outlined"
          onClick={handleExportCSV}
          startIcon={<CloudDownloadIcon />}
          sx={{
            color: "#10A37F",
            borderColor: "#10A37F",
            "&:hover": {
              color: "#fff",
              borderColor: "#0D8F70",
              backgroundColor: "rgba(16,163,127,0.2)",
            },
          }}
        >
          Скачать CSV
        </Button>
      </Box>
    </Box>
  );
};

export default TableDisplay;
