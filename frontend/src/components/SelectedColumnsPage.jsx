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
  Slider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Button,
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

  // Состояния для панели предобработки
  const [activeAction, setActiveAction] = useState("none");
  const [outlierThreshold, setOutlierThreshold] = useState(2);
  const [smoothingWindow, setSmoothingWindow] = useState(1);
  const [transformation, setTransformation] = useState("none");

  const handleBack = () => setShow(false);
  const handleExited = () => navigate(-1);

  // Исходные данные для выбранных столбцов
  const dataForDisplay = filteredData.map((row) => {
    const newRow = {};
    selectedColumns.forEach((col) => { newRow[col] = row[col]; });
    return newRow;
  });

  const sortedData = useMemo(() => {
    if (!localSortColumn || !localSortDirection) return dataForDisplay;
    return [...dataForDisplay].sort((a, b) => {
      const valA = a[localSortColumn], valB = b[localSortColumn];
      if (!isNaN(valA) && !isNaN(valB)) {
        return localSortDirection === "asc" ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      }
      return localSortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [dataForDisplay, localSortColumn, localSortDirection]);

  // Применение предобработки, влияющей на данные
  const finalDataResult = useMemo(() => {
    let data = [...sortedData];
    // Импутация
    if (activeAction === "imputation") {
      const numericValues = data.map(row => Number(row[selectedColumns[1]])).filter(val => !isNaN(val));
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      data = data.map(row => {
        const value = Number(row[selectedColumns[1]]);
        if (isNaN(value) || row[selectedColumns[1]] === null || row[selectedColumns[1]] === "") {
          return { ...row, [selectedColumns[1]]: mean };
        }
        return row;
      });
    }
    // Фильтрация выбросов
    if (activeAction === "outliers") {
      const targetValues = data.map(row => Number(row[selectedColumns[1]]));
      const mean = targetValues.reduce((a, b) => a + b, 0) / targetValues.length;
      const std = Math.sqrt(targetValues.reduce((acc, val) => acc + (val - mean) ** 2, 0) / targetValues.length);
      data = data.filter(row => Math.abs(Number(row[selectedColumns[1]]) - mean) <= outlierThreshold * std);
    }
    // Сглаживание
    if (activeAction === "smoothing" && smoothingWindow > 1) {
      let smoothed = [];
      for (let i = 0; i < data.length; i++) {
        const windowData = data.slice(Math.max(0, i - smoothingWindow + 1), i + 1);
        const avg = windowData.reduce((sum, row) => sum + Number(row[selectedColumns[1]]), 0) / windowData.length;
        smoothed.push({ ...data[i], [selectedColumns[1]]: avg });
      }
      data = smoothed;
    }
    // Преобразование
    if (activeAction === "transformation" && transformation !== "none") {
      if (transformation === "log") {
        data = data.map(row => ({ ...row, [selectedColumns[1]]: Math.log(Number(row[selectedColumns[1]])) }));
      } else if (transformation === "difference") {
        data = data.slice(1).map((row, i) => ({
          ...row,
          [selectedColumns[1]]: Number(row[selectedColumns[1]]) - Number(data[i][selectedColumns[1]])
        }));
      }
    }
    // Декомпозиция (вычисляем тренд через сглаживание и сезонную компоненту)
    let seasonalValues = null;
    if (activeAction === "decomposition" && smoothingWindow > 1) {
      let trend = [];
      for (let i = 0; i < data.length; i++) {
        const windowData = data.slice(Math.max(0, i - smoothingWindow + 1), i + 1);
        const avg = windowData.reduce((sum, row) => sum + Number(row[selectedColumns[1]]), 0) / windowData.length;
        trend.push(avg);
      }
      seasonalValues = data.map((row, i) => Number(row[selectedColumns[1]]) - trend[i]);
      data = data.map((row, i) => ({ ...row, [selectedColumns[1]]: trend[i] }));
    }
    return { data, seasonalValues };
  }, [sortedData, activeAction, outlierThreshold, smoothingWindow, transformation, selectedColumns]);

  const finalData = finalDataResult.data;

  // Подготовка данных для графика
  const labels = finalData.map(row => row[selectedColumns[0]]);
  const dataValues = finalData.map(row => Number(row[selectedColumns[1]]));
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

  // Описательные статистики
  const computeStats = (data) => {
    if (!data || data.length === 0) return null;
    const numericData = data.filter(x => !isNaN(x));
    if (numericData.length === 0) return null;
    const count = numericData.length;
    const sum = numericData.reduce((a, b) => a + b, 0);
    const mean = sum / count;
    const sorted = [...numericData].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = count % 2 === 0 ? (sorted[count/2 - 1] + sorted[count/2]) / 2 : sorted[Math.floor(count/2)];
    const variance = numericData.reduce((acc, val) => acc + (val - mean) ** 2, 0) / count;
    const std = Math.sqrt(variance);
    return { count, mean, median, std, min, max };
  };

  const stats = computeStats(dataValues);
  const statsArray = stats ? [
    { symbol: "N", tooltip: "Количество", value: stats.count },
    { symbol: "μ", tooltip: "Математическое ожидание", value: stats.mean.toFixed(2) },
    { symbol: "Med", tooltip: "Медиана", value: stats.median.toFixed(2) },
    { symbol: "σ", tooltip: "Стандартное отклонение", value: stats.std.toFixed(2) },
    { symbol: "min", tooltip: "Минимум", value: stats.min },
    { symbol: "max", tooltip: "Максимум", value: stats.max },
  ] : [];

  // Меню действий
  const actions = [
    { value: "none", label: "Без изменений" },
    { value: "outliers", label: "Выбросы" },
    { value: "smoothing", label: "Сглаживание" },
    { value: "transformation", label: "Преобразование" },
    { value: "imputation", label: "Заполнение пропусков" },
    { value: "decomposition", label: "Декомпозиция" },
  ];

  return (
    <Slide direction="left" in={show} mountOnEnter unmountOnExit onExited={handleExited}>
      <Box sx={{ p: 2, backgroundColor: "#121212", minHeight: "100vh", color: "#fff", overflow: "hidden" }}>
        <IconButton onClick={handleBack} sx={{ mb: 2, color: "#fff" }}>
          <ArrowBackIcon />
        </IconButton>

        {/* Блок с другими категориальными данными – сверху */}
        {(() => {
          const allCategoricalColumns = filteredData.length
            ? Object.keys(filteredData[0]).filter((col) => typeof filteredData[0][col] === "string")
            : [];
          const otherCategoricalColumns = allCategoricalColumns.filter(col => !selectedColumns.includes(col));
          return otherCategoricalColumns.length > 0 && (
            <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
              {otherCategoricalColumns.map((col) => (
                <Box key={col} sx={{ p: 1, border: "1px solid", borderColor: filters[col] ? "#FFD700" : "#10A37F", borderRadius: "8px", minWidth: "150px" }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, textAlign: "center", color: filters[col] ? "#FFD700" : "#10A37F" }}>
                    {col.replace("_", " ")}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
                    {[...new Set(filteredData.map(row => row[col]))].slice(0, 5).map((value, idx) => (
                      <Chip key={idx} label={value} sx={{
                        backgroundColor: filters[col] && filters[col] === value ? "#FFD700" : "#10A37F",
                        color: "#fff",
                        fontWeight: "bold",
                        transition: "transform 0.2s, background-color 0.2s",
                        "&:hover": { backgroundColor: "#0D8F70", transform: "scale(1.05)" },
                      }}/>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          );
        })()}

        {/* Двухколоночный блок: слева – панель действий, справа – график */}
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          {/* Левый столбец: панель предобработки */}
          <Box sx={{ width: 300, border: "1px solid #10A37F", borderRadius: "8px", p: 2 }}>
            <Typography variant="h6" sx={{ mb: 1, color: "#10A37F", textAlign: "center" }}>
              Настройки предобработки
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {actions.map(action => (
                <Button
                  key={action.value}
                  variant={activeAction === action.value ? "contained" : "outlined"}
                  onClick={() => setActiveAction(action.value)}
                  sx={{ textTransform: "none", borderColor: "#10A37F", color: "#10A37F" }}
                >
                  {action.label}
                </Button>
              ))}
            </Box>
            {activeAction === "outliers" && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ color: "#10A37F" }}>
                  Порог выбросов (σ): {outlierThreshold}
                </Typography>
                <Slider
                  value={outlierThreshold}
                  onChange={(e, newVal) => setOutlierThreshold(newVal)}
                  min={1}
                  max={5}
                  step={0.1}
                  valueLabelDisplay="auto"
                  color="primary"
                />
              </Box>
            )}
            {activeAction === "smoothing" && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ color: "#10A37F" }}>
                  Окно сглаживания: {smoothingWindow}
                </Typography>
                <Slider
                  value={smoothingWindow}
                  onChange={(e, newVal) => setSmoothingWindow(newVal)}
                  min={1}
                  max={20}
                  step={1}
                  valueLabelDisplay="auto"
                  color="primary"
                />
              </Box>
            )}
            {activeAction === "transformation" && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ color: "#10A37F" }}>
                  Преобразование
                </Typography>
                <RadioGroup value={transformation} onChange={(e) => setTransformation(e.target.value)}>
                  <FormControlLabel value="none" control={<Radio />} label="Нет" />
                  <FormControlLabel value="log" control={<Radio />} label="Логарифм" />
                  <FormControlLabel value="difference" control={<Radio />} label="Разность" />
                </RadioGroup>
              </Box>
            )}
            {activeAction === "imputation" && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ color: "#10A37F" }}>
                  Заполнение пропусков (среднее)
                </Typography>
              </Box>
            )}
            {activeAction === "decomposition" && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" sx={{ color: "#10A37F" }}>
                  Окно декомпозиции: {smoothingWindow}
                </Typography>
                <Slider
                  value={smoothingWindow}
                  onChange={(e, newVal) => setSmoothingWindow(newVal)}
                  min={2}
                  max={30}
                  step={1}
                  valueLabelDisplay="auto"
                  color="primary"
                />
              </Box>
            )}
          </Box>
          {/* Правый столбец: график */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              <ToggleButtonGroup
                value={chartType}
                exclusive
                onChange={(e, newType) => { if (newType !== null) setChartType(newType); }}
                sx={{ backgroundColor: "#1E1E1E", borderRadius: "8px", p: 1 }}
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
                  data={activeAction === "decomposition" && finalDataResult.seasonalValues ? {
                    labels: finalDataResult.data.map(row => row[selectedColumns[0]]),
                    datasets: [
                      {
                        label: "Trend",
                        data: finalDataResult.data.map(row => Number(row[selectedColumns[1]])),
                        fill: false,
                        backgroundColor: "rgba(16, 163, 127, 0.6)",
                        borderColor: "#10A37F",
                        borderWidth: 2,
                      },
                      {
                        label: "Seasonal",
                        data: finalDataResult.seasonalValues,
                        fill: false,
                        backgroundColor: "rgba(255, 99, 132, 0.6)",
                        borderColor: "#FF6384",
                        borderWidth: 2,
                        borderDash: [5, 5],
                      },
                    ],
                  } : chartData}
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
          </Box>
        </Box>

        {/* Блок описательных статистик */}
        {stats && (
          <Box sx={{ mb: 2, display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
            {statsArray.map((stat, idx) => (
              <Tooltip key={idx} title={stat.tooltip}>
                <Box sx={{ p: 1, border: "1px solid #10A37F", borderRadius: "8px", minWidth: "120px", textAlign: "center" }}>
                  <Typography variant="h6" sx={{ color: "#10A37F" }}>
                    {stat.symbol}: {stat.value}
                  </Typography>
                </Box>
              </Tooltip>
            ))}
          </Box>
        )}

        {/* Таблица с выбранной подвыборкой (10 строк) */}
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: "480px",
            overflowY: "auto",
            "&::-webkit-scrollbar": { width: "8px", height: "8px" },
            "&::-webkit-scrollbar-track": { background: "#2c2c2c", borderRadius: "8px" },
            "&::-webkit-scrollbar-thumb": { backgroundColor: "#10A37F", borderRadius: "8px" },
            "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#0D8F70" },
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {selectedColumns.map((col) => (
                  <TableCell key={col} sx={{ bgcolor: "#10A37F", color: "#fff", fontWeight: "bold", whiteSpace: "nowrap", p: 1 }}>
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                      {col.replace("_", " ")}
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setLocalSortColumn(col); setLocalSortDirection("asc"); }}
                        sx={{ color: "#fff", p: 0.5 }}
                      >
                        <ArrowUpwardIcon fontSize="inherit" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); setLocalSortColumn(col); setLocalSortDirection("desc"); }}
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
              {finalData.slice(0, 10).map((row, index) => (
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
