import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Chip,
  IconButton,
  Slide,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { Line, Bar, Pie } from "react-chartjs-2";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend
);

const SelectedColumnsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedColumns, filteredData, filters } = location.state || {
    selectedColumns: [],
    filteredData: [],
    filters: {},
  };

  const [show, setShow] = useState(true);
  const [localSortColumn, setLocalSortColumn] = useState(null);
  const [localSortDirection, setLocalSortDirection] = useState(null);
  const [chartType, setChartType] = useState("line");

  const handleBack = () => {
    setShow(false);
  };

  const handleExited = () => {
    navigate(-1);
  };

  // Данные для таблицы – только выбранные столбцы
  const dataForDisplay = filteredData.map((row) => {
    const newRow = {};
    selectedColumns.forEach((col) => {
      newRow[col] = row[col];
    });
    return newRow;
  });

  // Локальная сортировка данных для таблицы
  const sortedData = useMemo(() => {
    if (!localSortColumn || !localSortDirection) return dataForDisplay;
    const sorted = [...dataForDisplay].sort((a, b) => {
      const valA = a[localSortColumn];
      const valB = b[localSortColumn];
      if (!isNaN(valA) && !isNaN(valB)) {
        return localSortDirection === "asc"
          ? Number(valA) - Number(valB)
          : Number(valB) - Number(valA);
      }
      return localSortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
    return sorted;
  }, [dataForDisplay, localSortColumn, localSortDirection]);

  // Другие категориальные столбцы (не выбранные)
  const allCategoricalColumns = filteredData.length
    ? Object.keys(filteredData[0]).filter(
        (col) => typeof filteredData[0][col] === "string"
      )
    : [];
  const otherCategoricalColumns = allCategoricalColumns.filter(
    (col) => !selectedColumns.includes(col)
  );
  const getDistinctValues = (col) => {
    const values = [...new Set(filteredData.map((row) => row[col]))];
    return values.slice(0, 5);
  };

  // Подготовка данных для графика: первый выбранный столбец – категории, второй – числовые значения
  const labels = sortedData.map((row) => row[selectedColumns[0]]);
  const dataValues = sortedData.map((row) => Number(row[selectedColumns[1]]));
  const chartData = {
    labels,
    datasets: [
      {
        label: selectedColumns[1],
        data: dataValues,
        fill: false,
        backgroundColor: "rgba(16, 163, 127, 0.6)",
        borderColor: "#10A37F",
        borderWidth: 2,
      },
    ],
  };
  const pieChartData = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: labels.map((_, index) =>
          `hsl(${(index * 360) / labels.length}, 70%, 50%)`
        ),
        hoverBackgroundColor: labels.map((_, index) =>
          `hsl(${(index * 360) / labels.length}, 70%, 40%)`
        ),
      },
    ],
  };

  // Функция вычисления описательных статистик для числовых данных (второй выбранный столбец)
  const computeStats = (data) => {
    if (!data || data.length === 0) return null;
    const numericData = data.filter((x) => !isNaN(x));
    if (numericData.length === 0) return null;
    const count = numericData.length;
    const sum = numericData.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const sorted = [...numericData].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median =
      count % 2 === 0
        ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
        : sorted[Math.floor(count / 2)];
    const variance =
      numericData.reduce((acc, val) => acc + (val - mean) ** 2, 0) / count;
    const std = Math.sqrt(variance);
    return { count, mean, median, std, min, max };
  };

  const stats = computeStats(dataValues);

  // Создаем массив описательных статистик для отображения
  const statsArray = stats
    ? [
        { symbol: "N", tooltip: "Количество", value: stats.count },
        { symbol: "μ", tooltip: "Математическое ожидание", value: stats.mean.toFixed(2) },
        { symbol: "Med", tooltip: "Медиана", value: stats.median.toFixed(2) },
        { symbol: "σ", tooltip: "Стандартное отклонение", value: stats.std.toFixed(2) },
        { symbol: "min", tooltip: "Минимум", value: stats.min },
        { symbol: "max", tooltip: "Максимум", value: stats.max },
      ]
    : [];

  return (
    <Slide direction="left" in={show} mountOnEnter unmountOnExit onExited={handleExited}>
      <Box
        sx={{
          p: 2,
          backgroundColor: "#121212",
          minHeight: "100vh",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        <IconButton onClick={handleBack} sx={{ mb: 2, color: "#fff" }}>
          <ArrowBackIcon />
        </IconButton>

        {/* Блок с другими категориальными данными – сверху */}
        {otherCategoricalColumns.length > 0 && (
          <Box
            sx={{
              mb: 2,
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {otherCategoricalColumns.map((col) => (
              <Box
                key={col}
                sx={{
                  p: 1,
                  border: "1px solid",
                  borderColor: filters[col] ? "#FFD700" : "#10A37F",
                  borderRadius: "8px",
                  minWidth: "150px",
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 1,
                    textAlign: "center",
                    color: filters[col] ? "#FFD700" : "#10A37F",
                  }}
                >
                  {col.replace("_", " ")}
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                    justifyContent: "center",
                  }}
                >
                  {getDistinctValues(col).map((value, idx) => (
                    <Chip
                      key={idx}
                      label={value}
                      sx={{
                        backgroundColor:
                          filters[col] && filters[col] === value ? "#FFD700" : "#10A37F",
                        color: "#fff",
                        fontWeight: "bold",
                        transition: "transform 0.2s, background-color 0.2s",
                        "&:hover": {
                          backgroundColor: "#0D8F70",
                          transform: "scale(1.05)",
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Блок выбора типа графика */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={(e, newType) => {
              if (newType !== null) setChartType(newType);
            }}
            sx={{
              backgroundColor: "#1E1E1E",
              borderRadius: "8px",
              p: 1,
            }}
          >
            <ToggleButton value="line" sx={{ color: "#fff", borderColor: "#10A37F" }}>
              Линейный
            </ToggleButton>
            <ToggleButton value="bar" sx={{ color: "#fff", borderColor: "#10A37F" }}>
              Столбчатый
            </ToggleButton>
            <ToggleButton value="pie" sx={{ color: "#fff", borderColor: "#10A37F" }}>
              Круговой
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* График */}
        <Box
          sx={{
            mb: 2,
            p: 2,
            border: "1px solid #10A37F",
            borderRadius: "12px",
            backgroundColor: "rgba(16, 163, 127, 0.1)",
            boxShadow: 3,
          }}
        >
          {chartType === "line" && (
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { labels: { color: "#fff" } },
                  title: { display: true, text: "Линейный график", color: "#fff" },
                },
                scales: {
                  x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                  y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                },
              }}
            />
          )}
          {chartType === "bar" && (
            <Bar
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { labels: { color: "#fff" } },
                  title: { display: true, text: "Столбчатый график", color: "#fff" },
                },
                scales: {
                  x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                  y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                },
              }}
            />
          )}
          {chartType === "pie" && (
            <Pie
              data={pieChartData}
              options={{
                responsive: true,
                plugins: {
                  legend: { labels: { color: "#fff" } },
                  title: { display: true, text: "Круговой график", color: "#fff" },
                },
              }}
            />
          )}
        </Box>

        {/* Блок описательных статистик */}
        {stats && (
          <Box
            sx={{
              mb: 2,
              display: "flex",
              gap: 2,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {statsArray.map((stat, idx) => (
              <Tooltip key={idx} title={stat.tooltip}>
                <Box
                  sx={{
                    p: 1,
                    border: "1px solid #10A37F",
                    borderRadius: "8px",
                    minWidth: "120px",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="h6" sx={{ color: "#10A37F" }}>
                    {stat.symbol}: {stat.value}
                  </Typography>
                </Box>
              </Tooltip>
            ))}
          </Box>
        )}

        {/* Таблица с выбранной подвыборкой и локальной сортировкой */}
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: "480px",
            overflowY: "auto",
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
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {selectedColumns.map((col) => (
                  <TableCell
                    key={col}
                    sx={{
                      bgcolor: "#10A37F",
                      color: "#fff",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                      p: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      {col.replace("_", " ")}
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalSortColumn(col);
                          setLocalSortDirection("asc");
                        }}
                        sx={{ color: "#fff", p: 0.5 }}
                      >
                        <ArrowUpwardIcon fontSize="inherit" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocalSortColumn(col);
                          setLocalSortDirection("desc");
                        }}
                        sx={{ color: "#fff", p: 0.5 }}
                      >
                        <ArrowDownwardIcon fontSize="inherit" />
                      </IconButton>
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row, index) => (
                <TableRow key={index}>
                  {selectedColumns.map((col) => (
                    <TableCell key={col} sx={{ whiteSpace: "nowrap", color: "#fff" }}>
                      {row[col]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Slide>
  );
};

export default SelectedColumnsPage;
