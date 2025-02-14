import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Slider,
  Radio,
  RadioGroup,
  FormControlLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Slide,
  Button,
  Select,
  MenuItem,
  useTheme,
  Paper,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import { DashboardContext } from "../context/DashboardContext";
import CategoricalDataBlock from "./CategoricalDataBlock";
import { FloatingLinesBackground } from "../components/AnimatedBackground";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

const GlassPaper = ({ children, ...props }) => {
  const theme = useTheme();
  return (
    <Paper
      {...props}
      sx={{
        backdropFilter: "blur(16px)",
        backgroundColor: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "24px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        p: 3,
        ...props.sx,
      }}
    >
      {children}
    </Paper>
  );
};

const ProcessingStepControl = ({ label, active, onToggle, children }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        borderRadius: "16px",
        border: `1px solid ${
          active ? theme.palette.primary.main : "rgba(255,255,255,0.1)"
        }`,
        bgcolor: "rgba(16,163,127,0.05)",
        transition: "all 0.3s ease",
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: active ? 2 : 0,
        }}
      >
        <Typography variant="subtitle1" sx={{ color: "#fff" }}>
          {label}
        </Typography>
        <IconButton
          size="small"
          onClick={onToggle}
          sx={{
            color: active ? theme.palette.error.main : theme.palette.primary.main,
            "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
          }}
        >
          {active ? <CloseIcon /> : <AddIcon />}
        </IconButton>
      </Box>
      {active && children}
    </Box>
  );
};

const SelectedColumnsPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    selectedColumns,
    filteredData,
    filters,
    secondPageState,
    setSecondPageState,
  } = useContext(DashboardContext);
  const [show, setShow] = useState(true);

  const handleBack = () => setShow(false);
  const handleExited = () => navigate(-1);

  const dataForDisplay = useMemo(() => {
    return filteredData.map((row) => {
      const newRow = {};
      selectedColumns.forEach((col) => {
        newRow[col] = row[col];
      });
      return newRow;
    });
  }, [filteredData, selectedColumns]);

  const sortedData = useMemo(() => {
    if (!secondPageState.localSortColumn || !secondPageState.localSortDirection)
      return dataForDisplay;
    return [...dataForDisplay].sort((a, b) => {
      const valA = a[secondPageState.localSortColumn];
      const valB = b[secondPageState.localSortColumn];
      if (!isNaN(valA) && !isNaN(valB)) {
        return secondPageState.localSortDirection === "asc"
          ? Number(valA) - Number(valB)
          : Number(valB) - Number(valA);
      }
      return secondPageState.localSortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [
    dataForDisplay,
    secondPageState.localSortColumn,
    secondPageState.localSortDirection,
  ]);

  const finalDataResult = useMemo(() => {
    let data = [...sortedData];
    let seasonalValues = null;

    if (secondPageState.processingSteps.imputation) {
      let sortedByDate = [...data].sort(
        (a, b) =>
          new Date(a[selectedColumns[0]]) - new Date(b[selectedColumns[0]])
      );
      const firstDate = new Date(sortedByDate[0][selectedColumns[0]]);
      const lastDate = new Date(
        sortedByDate[sortedByDate.length - 1][selectedColumns[0]]
      );
      const frequency = secondPageState.imputationFrequency || "D";
      const getNextDate = (currentDate, frequency) => {
        let nextDate = new Date(currentDate);
        if (frequency === "D") {
          nextDate.setDate(nextDate.getDate() + 1);
        } else if (frequency === "W-MON") {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (frequency === "MS") {
          nextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 1);
        }
        return nextDate;
      };
      let currentDate = new Date(firstDate);
      if (frequency === "W-MON") {
        const day = currentDate.getDay();
        if (day !== 1) {
          currentDate.setDate(currentDate.getDate() + (day === 0 ? 1 : 8 - day));
        }
      } else if (frequency === "MS") {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      }
      let completeDates = [];
      while (currentDate <= lastDate) {
        completeDates.push(new Date(currentDate));
        currentDate = getNextDate(currentDate, frequency);
      }
      const existingDataMap = {};
      sortedByDate.forEach((row) => {
        const dateStr = new Date(row[selectedColumns[0]])
          .toISOString()
          .split("T")[0];
        existingDataMap[dateStr] = row;
      });
      let newData = completeDates.map((date) => {
        const dateStr = date.toISOString().split("T")[0];
        if (existingDataMap[dateStr]) {
          return existingDataMap[dateStr];
        } else {
          let newRow = {};
          newRow[selectedColumns[0]] = dateStr;
          newRow[selectedColumns[1]] = null;
          return newRow;
        }
      });
      newData.sort(
        (a, b) =>
          new Date(a[selectedColumns[0]]) - new Date(b[selectedColumns[0]])
      );
      let filledData = [...newData];
      for (let i = 0; i < filledData.length; i++) {
        if (
          filledData[i][selectedColumns[1]] === null ||
          filledData[i][selectedColumns[1]] === ""
        ) {
          let prevIndex = i - 1;
          while (
            prevIndex >= 0 &&
            (filledData[prevIndex][selectedColumns[1]] === null ||
              filledData[prevIndex][selectedColumns[1]] === "")
          ) {
            prevIndex--;
          }
          let nextIndex = i + 1;
          while (
            nextIndex < filledData.length &&
            (filledData[nextIndex][selectedColumns[1]] === null ||
              filledData[nextIndex][selectedColumns[1]] === "")
          ) {
            nextIndex++;
          }
          if (prevIndex >= 0 && nextIndex < filledData.length) {
            const prevValue = Number(filledData[prevIndex][selectedColumns[1]]);
            const nextValue = Number(filledData[nextIndex][selectedColumns[1]]);
            const interpolated =
              prevValue +
              ((nextValue - prevValue) * (i - prevIndex)) / (nextIndex - prevIndex);
            filledData[i][selectedColumns[1]] = interpolated;
          } else if (prevIndex >= 0) {
            filledData[i][selectedColumns[1]] = Number(
              filledData[prevIndex][selectedColumns[1]]
            );
          } else if (nextIndex < filledData.length) {
            filledData[i][selectedColumns[1]] = Number(
              filledData[nextIndex][selectedColumns[1]]
            );
          }
        }
      }
      data = filledData;
    }

    if (secondPageState.processingSteps.outliers) {
      const targetValues = data.map((row) => Number(row[selectedColumns[1]]));
      const mean =
        targetValues.reduce((a, b) => a + b, 0) / targetValues.length;
      const std = Math.sqrt(
        targetValues.reduce((acc, val) => acc + (val - mean) ** 2, 0) /
          targetValues.length
      );
      data = data.filter(
        (row) =>
          Math.abs(Number(row[selectedColumns[1]]) - mean) <=
          secondPageState.outlierThreshold * std
      );
    }

    if (
      secondPageState.processingSteps.smoothing &&
      secondPageState.smoothingWindow > 1
    ) {
      let smoothed = [];
      for (let i = 0; i < data.length; i++) {
        const windowData = data.slice(
          Math.max(0, i - secondPageState.smoothingWindow + 1),
          i + 1
        );
        const avg =
          windowData.reduce(
            (sum, row) => sum + Number(row[selectedColumns[1]]),
            0
          ) / windowData.length;
        smoothed.push({ ...data[i], [selectedColumns[1]]: avg });
      }
      data = smoothed;
    }

    if (
      secondPageState.processingSteps.transformation &&
      secondPageState.transformation !== "none"
    ) {
      if (secondPageState.transformation === "log") {
        data = data.map((row) => ({
          ...row,
          [selectedColumns[1]]: Math.log(Number(row[selectedColumns[1]])),
        }));
      } else if (secondPageState.transformation === "difference") {
        data = data.slice(1).map((row, i) => ({
          ...row,
          [selectedColumns[1]]:
            Number(row[selectedColumns[1]]) -
            Number(data[i][selectedColumns[1]]),
        }));
      }
    }

    if (
      secondPageState.processingSteps.decomposition &&
      secondPageState.decompositionWindow > 1
    ) {
      let trend = [];
      for (let i = 0; i < data.length; i++) {
        const windowData = data.slice(
          Math.max(0, i - secondPageState.decompositionWindow + 1),
          i + 1
        );
        const avg =
          windowData.reduce(
            (sum, row) => sum + Number(row[selectedColumns[1]]),
            0
          ) / windowData.length;
        trend.push(avg);
      }
      seasonalValues = data.map(
        (row, i) => Number(row[selectedColumns[1]]) - trend[i]
      );
      data = data.map((row, i) => ({ ...row, [selectedColumns[1]]: trend[i] }));
    }

    if (secondPageState.processingSteps.normalization) {
      const values = data.map((row) => Number(row[selectedColumns[1]]));
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      data = data.map((row) => ({
        ...row,
        [selectedColumns[1]]:
          (Number(row[selectedColumns[1]]) - minVal) / (maxVal - minVal),
      }));
    }
    return { data, seasonalValues };
  }, [sortedData, secondPageState, selectedColumns]);

  const finalData = finalDataResult.data;
  const labels = finalData.map((row) => row[selectedColumns[0]]);
  const dataValues = finalData.map((row) => Number(row[selectedColumns[1]]));
  const chartData = {
    labels,
    datasets: [
      {
        label: selectedColumns[1],
        data: dataValues,
        fill: false,
        backgroundColor: theme.palette.primary.light,
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
        tension: 0.1,
      },
    ],
  };

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
  const statsArray = stats
    ? [
        { symbol: "N", tooltip: "Количество", value: stats.count },
        { symbol: "μ", tooltip: "Математическое ожидание", value: stats.mean.toFixed(3) },
        { symbol: "Med", tooltip: "Медиана", value: stats.median.toFixed(3) },
        { symbol: "σ", tooltip: "Стандартное отклонение", value: stats.std.toFixed(3) },
        { symbol: "min", tooltip: "Минимум", value: stats.min.toFixed(3) },
        { symbol: "max", tooltip: "Максимум", value: stats.max.toFixed(3) },
      ]
    : [];

  const handleGoToForecast = () => {
    navigate("/forecast", { state: { modifiedData: finalData, selectedColumns } });
  };

  return (
    <Slide direction="left" in={show} mountOnEnter unmountOnExit onExited={handleExited}>
      <Box
        sx={{
          position: "relative",
          p: 4,
          minHeight: "100vh",
          background: theme.palette.background.default,
        }}
      >
        <FloatingLinesBackground />

        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
            <IconButton
              onClick={handleBack}
              sx={{
                color: theme.palette.text.primary,
                "&:hover": { bgcolor: "rgba(255,255,255,0.05)" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, #00ff88 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Предобработка данных
            </Typography>

            <Button
              variant="contained"
              onClick={handleGoToForecast}
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: theme.palette.primary.main,
                "&:hover": { bgcolor: theme.palette.primary.dark },
                borderRadius: "12px",
                px: 4,
                py: 1,
              }}
            >
              Прогнозирование
            </Button>
          </Box>

          <CategoricalDataBlock
            filteredData={filteredData}
            selectedColumns={selectedColumns}
            filters={filters}
          />

          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <AnimatePresence>
                {secondPageState.preprocessingOpen && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <GlassPaper>
                      <Typography variant="h6" sx={{ mb: 3, color: theme.palette.primary.main }}>
                        Этапы обработки
                      </Typography>

                      <ProcessingStepControl
                        label="Заполнение пропусков"
                        active={secondPageState.processingSteps.imputation}
                        onToggle={() =>
                          setSecondPageState((prev) => ({
                            ...prev,
                            processingSteps: {
                              ...prev.processingSteps,
                              imputation: !prev.processingSteps.imputation,
                            },
                          }))
                        }
                      >
                        <Select
                          value={secondPageState.imputationFrequency || "D"}
                          onChange={(e) =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              imputationFrequency: e.target.value,
                            }))
                          }
                          size="small"
                          fullWidth
                          sx={{ mt: 1 }}
                        >
                          <MenuItem value="D">Дневная</MenuItem>
                          <MenuItem value="W-MON">Недельная</MenuItem>
                          <MenuItem value="MS">Месячная</MenuItem>
                        </Select>
                      </ProcessingStepControl>

                      <ProcessingStepControl
                        label="Фильтрация выбросов"
                        active={secondPageState.processingSteps.outliers}
                        onToggle={() =>
                          setSecondPageState((prev) => ({
                            ...prev,
                            processingSteps: {
                              ...prev.processingSteps,
                              outliers: !prev.processingSteps.outliers,
                            },
                          }))
                        }
                      >
                        <Typography variant="caption" sx={{ color: "#fff" }}>
                          Порог: {secondPageState.outlierThreshold}σ
                        </Typography>
                        <Slider
                          value={secondPageState.outlierThreshold}
                          onChange={(e, newVal) =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              outlierThreshold: newVal,
                            }))
                          }
                          min={1}
                          max={5}
                          step={0.1}
                          sx={{ mt: 1 }}
                        />
                      </ProcessingStepControl>

                      <ProcessingStepControl
                        label="Сглаживание"
                        active={secondPageState.processingSteps.smoothing}
                        onToggle={() =>
                          setSecondPageState((prev) => ({
                            ...prev,
                            processingSteps: {
                              ...prev.processingSteps,
                              smoothing: !prev.processingSteps.smoothing,
                            },
                          }))
                        }
                      >
                        <Typography variant="caption" sx={{ color: "#fff" }}>
                          Размер окна: {secondPageState.smoothingWindow}
                        </Typography>
                        <Slider
                          value={secondPageState.smoothingWindow}
                          onChange={(e, newVal) =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              smoothingWindow: newVal,
                            }))
                          }
                          min={1}
                          max={20}
                          step={1}
                          sx={{ mt: 1 }}
                        />
                      </ProcessingStepControl>

                      <ProcessingStepControl
                        label="Декомпозиция"
                        active={secondPageState.processingSteps.decomposition}
                        onToggle={() =>
                          setSecondPageState((prev) => ({
                            ...prev,
                            processingSteps: {
                              ...prev.processingSteps,
                              decomposition: !prev.processingSteps.decomposition,
                            },
                          }))
                        }
                      >
                        <Typography variant="caption" sx={{ color: "#fff" }}>
                          Окно тренда: {secondPageState.decompositionWindow}
                        </Typography>
                        <Slider
                          value={secondPageState.decompositionWindow}
                          onChange={(e, newVal) =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              decompositionWindow: newVal,
                            }))
                          }
                          min={2}
                          max={30}
                          step={1}
                          sx={{ mt: 1 }}
                        />
                      </ProcessingStepControl>

                      <ProcessingStepControl
                        label="Нормализация"
                        active={secondPageState.processingSteps.normalization}
                        onToggle={() =>
                          setSecondPageState((prev) => ({
                            ...prev,
                            processingSteps: {
                              ...prev.processingSteps,
                              normalization: !prev.processingSteps.normalization,
                            },
                          }))
                        }
                      />
                    </GlassPaper>
                  </motion.div>
                )}
              </AnimatePresence>
            </Grid>

            <Grid item xs={12} md={secondPageState.preprocessingOpen ? 9 : 12}>
              <GlassPaper>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
                  <Button
                    onClick={() =>
                      setSecondPageState((prev) => ({
                        ...prev,
                        preprocessingOpen: !prev.preprocessingOpen,
                      }))
                    }
                    startIcon={<SettingsIcon />}
                    sx={{
                      borderRadius: "12px",
                      px: 3,
                      py: 1,
                      bgcolor: "rgba(16,163,127,0.1)",
                      "&:hover": { bgcolor: "rgba(16,163,127,0.2)" },
                    }}
                  >
                    {secondPageState.preprocessingOpen ? "Скрыть настройки" : "Показать настройки"}
                  </Button>

                  <ToggleButtonGroup
                    value={secondPageState.chartType}
                    exclusive
                    onChange={(e, newType) =>
                      setSecondPageState((prev) => ({ ...prev, chartType: newType }))
                    }
                    sx={{
                      bgcolor: "rgba(255,255,255,0.05)",
                      borderRadius: "12px",
                      p: 0.5,
                    }}
                  >
                    <ToggleButton value="line" sx={{ textTransform: "none", px: 3 }}>
                      Линейный
                    </ToggleButton>
                    <ToggleButton value="bar" sx={{ textTransform: "none", px: 3 }}>
                      Столбчатый
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <Box
                  sx={{
                    height: 400,
                    borderRadius: "16px",
                    overflow: "hidden",
                    position: "relative",
                    bgcolor: "rgba(0,0,0,0.3)",
                    mb: 4,
                  }}
                >
                  {secondPageState.chartType === "line" ? (
                    <Line
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { labels: { color: theme.palette.text.primary } },
                          title: { display: false },
                        },
                        scales: {
                          x: {
                            grid: { color: "rgba(255,255,255,0.05)" },
                            ticks: { color: theme.palette.text.secondary },
                          },
                          y: {
                            grid: { color: "rgba(255,255,255,0.05)" },
                            ticks: { color: theme.palette.text.secondary },
                          },
                        },
                      }}
                    />
                  ) : (
                    <Bar
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { labels: { color: theme.palette.text.primary } },
                          title: { display: false },
                        },
                        scales: {
                          x: {
                            grid: { color: "rgba(255,255,255,0.05)" },
                            ticks: { color: theme.palette.text.secondary },
                          },
                          y: {
                            grid: { color: "rgba(255,255,255,0.05)" },
                            ticks: { color: theme.palette.text.secondary },
                          },
                        },
                      }}
                    />
                  )}
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ mb: 2, color: theme.palette.primary.main }}>
                    Описательные статистики
                  </Typography>
                  <Grid container spacing={2}>
                    {statsArray.map((stat, idx) => (
                      <Grid item xs={6} sm={4} md={2} key={idx}>
                        <GlassPaper sx={{ textAlign: "center", p: 2 }}>
                          <Typography variant="subtitle2" sx={{ color: theme.palette.primary.light }}>
                            {stat.symbol}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {stat.value}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {stat.tooltip}
                          </Typography>
                        </GlassPaper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Box
                  sx={{
                    maxHeight: 400,
                    overflow: "auto",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Table
                    sx={{
                      "& .MuiTableCell-root": {
                        borderBottom: "1px solid rgba(255,255,255,0.1)",
                        color: theme.palette.text.primary,
                      },
                    }}
                  >
                    <TableHead sx={{ bgcolor: "rgba(255,255,255,0.05)" }}>
                      <TableRow>
                        {selectedColumns.map((col) => (
                          <TableCell key={col} sx={{ fontWeight: 600 }}>
                            {col}
                            <IconButton
                              size="small"
                              onClick={() =>
                                setSecondPageState((prev) => ({
                                  ...prev,
                                  localSortColumn: col,
                                  localSortDirection: "asc",
                                }))
                              }
                              sx={{ ml: 1, color: theme.palette.primary.main }}
                            >
                              <ArrowUpwardIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                setSecondPageState((prev) => ({
                                  ...prev,
                                  localSortColumn: col,
                                  localSortDirection: "desc",
                                }))
                              }
                              sx={{ color: theme.palette.primary.main }}
                            >
                              <ArrowDownwardIcon />
                            </IconButton>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {finalData.slice(0, 10).map((row, idx) => (
                        <TableRow key={idx}>
                          {selectedColumns.map((col) => (
                            <TableCell key={col}>{row[col]}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </GlassPaper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Slide>
  );
};

export default SelectedColumnsPage;
