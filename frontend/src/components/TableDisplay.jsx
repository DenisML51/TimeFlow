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
  Typography,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useTheme, alpha } from "@mui/material/styles";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { DashboardContext } from "../context/DashboardContext";

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.15 },
};

const scaleTap = { scale: 0.98 };

const TableDisplay = ({
  data,
  sortColumn,     // колонка, по которой идет сортировка
  sortDirection,  // направление сортировки ("asc" или "desc")
  onSortAsc,
  onSortDesc,
  onColumnSelect,
  selectedColumns,
}) => {
  const theme = useTheme();
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
      <Box sx={{ position: "relative" }}>
        <TableContainer
          component={Paper}
          sx={{
            bgcolor: "rgba(255,255,255,0.03)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.12)",
            backdropFilter: "blur(24px)",
            background: `linear-gradient(to bottom right, 
              rgba(255,255,255,0.05) 0%, 
              rgba(255,255,255,0.01) 100%)`,
            boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
            maxHeight: "calc(100vh - 320px)",
            overflow: "auto",
            "&::-webkit-scrollbar": { width: "10px", height: "10px" },
            "&::-webkit-scrollbar-track": {
              background: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: alpha(theme.palette.primary.main, 0.4),
              borderRadius: "8px",
              border: "2px solid rgba(255,255,255,0.1)",
            },
          }}
        >
          <Table stickyHeader size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
                {columns.map((column) => {
                  const isSelected = selectedColumns.includes(column);
                  const isSorted = sortColumn === column;
                  return (
                    <TableCell
                      key={column}
                      component={motion.td}
                      {...fadeIn}
                      sx={{
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                        color: theme.palette.getContrastText(
                          theme.palette.primary.dark
                        ),
                        fontWeight: 600,
                        background: `linear-gradient(to bottom, 
                          ${alpha(theme.palette.primary.dark, 0.9)}, 
                          ${alpha(theme.palette.primary.main, 0.9)})`,
                        backdropFilter: "blur(12px)",
                        borderRight: "1px solid rgba(255,255,255,0.08)",
                        borderBottom: "2px solid rgba(255,255,255,0.12)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          background: alpha(theme.palette.primary.main, 0.8),
                        },
                        "&:last-child": { borderRight: 0 },
                      }}
                      onClick={() => onColumnSelect?.(column)}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 1,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <AnimatePresence initial={false}>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <CheckCircleOutlineIcon
                                  sx={{
                                    color: theme.palette.success.main,
                                    flexShrink: 0,
                                  }}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{
                              textTransform: "capitalize",
                              letterSpacing: "0.5px",
                              flex: 1,
                              minWidth: 0,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {column.replaceAll("_", " ")}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            flexShrink: 0,
                          }}
                        >
                          <Tooltip title="Сортировка по возрастанию">
                            <IconButton
                              component={motion.button}
                              whileTap={scaleTap}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSortAsc(column);
                              }}
                              sx={{
                                color:
                                  isSorted && sortDirection === "asc"
                                    ? theme.palette.success.main
                                    : "inherit",
                              }}
                            >
                              <ArrowUpwardIcon fontSize="inherit" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Сортировка по убыванию">
                            <IconButton
                              component={motion.button}
                              whileTap={scaleTap}
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSortDesc(column);
                              }}
                              sx={{
                                color:
                                  isSorted && sortDirection === "desc"
                                    ? theme.palette.error.main
                                    : "inherit",
                              }}
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
                  component={motion.tr}
                  {...fadeIn}
                  sx={{
                    "&:nth-of-type(even)": {
                      bgcolor: "rgba(255,255,255,0.02)",
                    },
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.04)",
                    },
                  }}
                >
                  {columns.map((column) => {
                    const isSelected = selectedColumns.includes(column);
                    return (
                      <TableCell
                        key={column}
                        component={motion.td}
                        {...fadeIn}
                        sx={{
                          color: isSelected
                            ? theme.palette.primary.light
                            : "text.primary",
                          fontWeight: isSelected ? 600 : 400,
                          whiteSpace: "nowrap",
                          transition: "all 0.2s ease",
                          position: "relative",
                          "&:after": {
                            content: '""',
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            height: "60%",
                            width: "2px",
                            bgcolor: theme.palette.primary.main,
                            opacity: isSelected ? 1 : 0,
                            transition: "opacity 0.2s ease",
                          },
                        }}
                      >
                        <Typography variant="body2" noWrap>
                          {row[column]}
                        </Typography>
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
              color: theme.palette.primary.main,
              borderColor: theme.palette.primary.main,
              "&:hover": {
                color: "#fff",
                borderColor: theme.palette.primary.dark,
                backgroundColor: "rgba(16,163,127,0.2)",
              },
            }}
          >
            Скачать CSV
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default TableDisplay;
