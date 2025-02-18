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
  Tooltip as MuiTooltip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Select,
  MenuItem,
  Switch,
  TableSortLabel,
} from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SettingsIcon from "@mui/icons-material/Settings";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { DashboardContext } from "../context/DashboardContext";
import CategoricalDataBlock from "../components/CategoricalDataBlock";
import { Canvas } from "@react-three/fiber";
import { ParticleBackground } from "../components/home/ParticleBackground";
import { Slide } from "@mui/material";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const GlassPaper = ({ children, sx }) => (
  <Box
    sx={{
      background: "rgba(255, 255, 255, 0.05)",
      borderRadius: "16px",
      border: "1px solid rgba(255,255,255,0.1)",
      backdropFilter: "blur(12px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      p: 3,
      ...sx,
    }}
  >
    {children}
  </Box>
);

const StatCard = ({ title, value, tooltip }) => (
  <MuiTooltip title={tooltip}>
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Box
        sx={{
          p: 2,
          minWidth: 120,
          borderRadius: "12px",
          background:
            "linear-gradient(145deg, rgba(16,163,127,0.15), rgba(16,163,127,0.05))",
          border: "1px solid rgba(16,163,127,0.3)",
          textAlign: "center",
        }}
      >
        <Typography variant="subtitle2" sx={{ color: "#10A37F", mb: 0.5 }}>
          {title}
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 600, color: "#fff" }}>
          {value}
        </Typography>
      </Box>
    </motion.div>
  </MuiTooltip>
);

const SelectedColumnsPage = () => {
  const navigate = useNavigate();
  const {
    selectedColumns,
    filteredData,
    filters,
    secondPageState,
    setSecondPageState,
    setIsDirty,
  } = useContext(DashboardContext);

  const [show, setShow] = useState(true);

  const handleBack = () => {
    setShow(false);
    setTimeout(() => navigate(-1), 300);
  };

  // Формируем данные для выбранных столбцов
  const dataForDisplay = useMemo(() => {
    return filteredData.map((row) => {
      const newRow = {};
      selectedColumns.forEach((col) => {
        newRow[col] = row[col];
      });
      return newRow;
    });
  }, [filteredData, selectedColumns]);

  // Локальная сортировка
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

  // Последовательная предобработка данных (без изменений)
  const finalDataResult = useMemo(() => {
    let data = [...sortedData];
    let seasonalValues = null;

    // 1. Импутация
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

    // 2. Фильтрация выбросов
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

    // 3. Сглаживание
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

    // 4. Преобразование
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
            Number(row[selectedColumns[1]]) - Number(data[i][selectedColumns[1]]),
        }));
      }
    }

    // 5. Декомпозиция (расчёт тренда и сезонности)
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

    // 6. Нормализация
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
  const trendValues = finalData.map((row) => Number(row[selectedColumns[1]]));

  // Формирование данных для графика
  const chartData =
    secondPageState.processingSteps.decomposition && finalDataResult.seasonalValues
      ? {
          labels,
          datasets: [
            {
              label: "Trend",
              data: trendValues,
              fill: false,
              backgroundColor: "rgba(16,163,127,0.6)",
              borderColor: "#10A37F",
              borderWidth: 2,
            },
            {
              label: "Seasonal",
              data: finalDataResult.seasonalValues,
              fill: false,
              backgroundColor: "rgba(255,99,132,0.6)",
              borderColor: "#FF6384",
              borderWidth: 2,
            },
          ],
        }
      : {
          labels,
          datasets: [
            {
              label: selectedColumns[1],
              data: trendValues,
              fill: false,
              backgroundColor: "rgba(16,163,127,0.6)",
              borderColor: "#10A37F",
              borderWidth: 2,
            },
          ],
        };

  // Описательная статистика
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

  const stats = computeStats(trendValues);
  const statsArray = stats
    ? [
        { title: "Количество", value: stats.count, tooltip: "Всего наблюдений" },
        {
          title: "Среднее",
          value: stats.mean.toFixed(3),
          tooltip: "Среднее значение",
        },
        {
          title: "Медиана",
          value: stats.median.toFixed(3),
          tooltip: "Медианное значение",
        },
        {
          title: "Ст.откл.",
          value: stats.std.toFixed(3),
          tooltip: "Стандартное отклонение",
        },
        { title: "Мин", value: stats.min.toFixed(3), tooltip: "Минимальное значение" },
        { title: "Макс", value: stats.max.toFixed(3), tooltip: "Максимальное значение" },
      ]
    : [];

  // Сортировка по клику на заголовке таблицы
  const handleSort = (col) => {
    setSecondPageState((prev) => {
      let newDirection = "asc";
      if (prev.localSortColumn === col) {
        newDirection = prev.localSortDirection === "asc" ? "desc" : "asc";
      }
      return { ...prev, localSortColumn: col, localSortDirection: newDirection };
    });
    setIsDirty(true);
  };

  const handleGoToForecast = () => {
    navigate("/forecast", { state: { modifiedData: finalData, selectedColumns } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3 }}
      style={{ position: "relative", minHeight: "100vh" }}
    >
      <Canvas camera={{ position: [0, 0, 1] }} style={{ position: "fixed", top: 0, left: 0 }}>
        <ParticleBackground />
      </Canvas>

      {/* Общий контейнер с ограниченной шириной */}
      <Box sx={{ p: 4, position: "relative", zIndex: 1, width: "100%", maxWidth: "1200px", mx: "auto" }}>
        {/* Header Section */}
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
          <Button
            variant="contained"
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            sx={{
              background: "rgba(16,163,127,0.15)",
              color: "#10A37F",
              borderRadius: "12px",
              px: 3,
              "&:hover": { background: "rgba(16,163,127,0.3)" },
            }}
          >
            Назад
          </Button>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: "linear-gradient(45deg, #10A37F 30%, #00ff88 100%)",
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
              background: "rgba(16,163,127,0.15)",
              color: "#10A37F",
              borderRadius: "12px",
              px: 3,
              "&:hover": { background: "rgba(16,163,127,0.3)" },
            }}
          >
            Прогноз
          </Button>
        </Box>

        <CategoricalDataBlock
          filteredData={filteredData}
          selectedColumns={selectedColumns}
          filters={filters}
        />

        {/* Контейнер для основного контента и боковой панели предобработки */}
        <Box sx={{ position: "relative", mt: 2, pr: 3 }}>
          {/* Основной контент – с анимацией marginLeft */}
          <Box
            sx={{
              transition: "margin-left 0.3s",
              marginLeft: secondPageState.preprocessingOpen ? "320px" : 0,
            }}
          >
            <GlassPaper>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 4,
                }}
              >
                <Button
                  variant="contained"
                  onClick={() =>
                    setSecondPageState((prev) => {
                      const newState = {
                        ...prev,
                        preprocessingOpen: !prev.preprocessingOpen,
                      };
                      setIsDirty(true);
                      return newState;
                    })
                  }
                  startIcon={<SettingsIcon />}
                  sx={{
                    background: "rgba(16,163,127,0.15)",
                    color: "#10A37F",
                    borderRadius: "12px",
                  }}
                >
                  {secondPageState.preprocessingOpen
                    ? "Скрыть настройки"
                    : "Показать настройки"}
                </Button>

                <ToggleButtonGroup
                  value={secondPageState.chartType}
                  exclusive
                  onChange={(e, newType) =>
                    newType &&
                    setSecondPageState((prev) => {
                      const newState = { ...prev, chartType: newType };
                      setIsDirty(true);
                      return newState;
                    })
                  }
                  sx={{
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "12px",
                  }}
                >
                  <ToggleButton
                    value="line"
                    sx={{
                      color:
                        secondPageState.chartType === "line" ? "#10A37F" : "#fff",
                    }}
                  >
                    Линия
                  </ToggleButton>
                  <ToggleButton
                    value="bar"
                    sx={{
                      color:
                        secondPageState.chartType === "bar" ? "#10A37F" : "#fff",
                    }}
                  >
                    Столбцы
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              <Box
                sx={{
                  height: 400,
                  borderRadius: "16px",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {secondPageState.chartType === "line" ? (
                  <Line
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { labels: { color: "#fff" } },
                        title: { display: false },
                      },
                      scales: {
                        x: {
                          grid: { color: "rgba(255,255,255,0.05)" },
                          ticks: { color: "#fff" },
                        },
                        y: {
                          grid: { color: "rgba(255,255,255,0.05)" },
                          ticks: { color: "#fff" },
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
                        legend: { labels: { color: "#fff" } },
                        title: { display: false },
                      },
                      scales: {
                        x: {
                          grid: { color: "rgba(255,255,255,0.05)" },
                          ticks: { color: "#fff" },
                        },
                        y: {
                          grid: { color: "rgba(255,255,255,0.05)" },
                          ticks: { color: "#fff" },
                        },
                      },
                    }}
                  />
                )}
              </Box>

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, color: "#fff" }}>
                  Описательная статистика
                </Typography>
                <Grid container spacing={1}>
                  {statsArray.map((stat, i) => (
                    <Grid item key={i}>
                      <StatCard {...stat} />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h7" sx={{ mb: 2, color: "#fff" }}>
                  Пример данных
                </Typography>
                <Box
                  sx={{
                    maxHeight: 400,
                    overflow: "auto",
                    borderRadius: "12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    "&::-webkit-scrollbar": { width: "6px" },
                    "&::-webkit-scrollbar-track": {
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "4px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "rgba(16,163,127,0.6)",
                      borderRadius: "4px",
                    },
                  }}
                >
                  <Table sx={{ background: "rgba(255,255,255,0.02)" }}>
                    <TableHead>
                      <TableRow>
                        {selectedColumns.map((col) => (
                          <TableCell
                            key={col}
                            sx={{
                              background: "rgba(16,163,127,0.1)",
                              color: "#10A37F",
                              fontWeight: 600,
                            }}
                          >
                            <TableSortLabel
                              active={secondPageState.localSortColumn === col}
                              direction={
                                secondPageState.localSortColumn === col
                                  ? secondPageState.localSortDirection
                                  : "asc"
                              }
                              onClick={() => handleSort(col)}
                            >
                              {col}
                            </TableSortLabel>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {finalData.slice(0, 10).map((row, i) => (
                        <TableRow
                          key={i}
                          sx={{
                            "&:nth-of-type(odd)": {
                              background: "rgba(255,255,255,0.02)",
                            },
                          }}
                        >
                          {selectedColumns.map((col) => (
                            <TableCell key={col} sx={{ color: "#fff" }}>
                              {row[col]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            </GlassPaper>
          </Box>
          {/* Боковая панель предобработки */}
          <Slide direction="right" in={secondPageState.preprocessingOpen} mountOnEnter unmountOnExit>
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "300px",
                height: "100%",
                pr: 1,
                boxSizing: "border-box",
              }}
            >
              <GlassPaper sx={{ height: "100%" }}>
                {[
                  { key: "imputation", label: "Заполнение пропусков" },
                  { key: "outliers", label: "Обработка выбросов" },
                  { key: "smoothing", label: "Сглаживание" },
                  { key: "transformation", label: "Преобразование" },
                  { key: "decomposition", label: "Декомпозиция" },
                  { key: "normalization", label: "Нормализация" },
                ].map((section) => (
                  <Box key={section.key} sx={{ mb: 3 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: "#fff" }}>
                        {section.label}
                      </Typography>
                      <Switch
                        checked={secondPageState.processingSteps[section.key]}
                        onChange={() =>
                          setSecondPageState((prev) => {
                            const newState = {
                              ...prev,
                              processingSteps: {
                                ...prev.processingSteps,
                                [section.key]: !prev.processingSteps[section.key],
                              },
                            };
                            setIsDirty(true);
                            return newState;
                          })
                        }
                        size="small"
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": { color: "#10A37F" },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            backgroundColor: "#10A37F",
                          },
                        }}
                      />
                    </Box>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {section.key === "imputation" && (
                        <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                          <Typography variant="caption" sx={{ color: "#fff" }}>
                            Частота:
                          </Typography>
                          <Select
                            value={secondPageState.imputationFrequency || "D"}
                            onChange={(e) =>
                              setSecondPageState((prev) => {
                                const newState = {
                                  ...prev,
                                  imputationFrequency: e.target.value,
                                };
                                setIsDirty(true);
                                return newState;
                              })
                            }
                            size="small"
                            disabled={!secondPageState.processingSteps.imputation}
                            sx={{
                              ml: 1,
                              color: "#fff",
                              borderColor: "#10A37F",
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#10A37F",
                              },
                            }}
                          >
                            <MenuItem value="D">Дневная (D)</MenuItem>
                            <MenuItem value="W-MON">Недельная (W-MON)</MenuItem>
                            <MenuItem value="MS">Начало месяца (MS)</MenuItem>
                          </Select>
                        </Box>
                      )}

                      {section.key === "outliers" && (
                        <>
                          <Typography variant="caption" sx={{ color: "#fff" }}>
                            Порог (σ): {secondPageState.outlierThreshold}
                          </Typography>
                          <Slider
                            value={secondPageState.outlierThreshold}
                            onChange={(e, newVal) =>
                              setSecondPageState((prev) => {
                                const newState = { ...prev, outlierThreshold: newVal };
                                setIsDirty(true);
                                return newState;
                              })
                            }
                            min={1}
                            max={5}
                            step={0.1}
                            valueLabelDisplay="auto"
                            size="small"
                            disabled={!secondPageState.processingSteps.outliers}
                          />
                        </>
                      )}

                      {section.key === "smoothing" && (
                        <>
                          <Typography variant="caption" sx={{ color: "#fff" }}>
                            Окно: {secondPageState.smoothingWindow}
                          </Typography>
                          <Slider
                            value={secondPageState.smoothingWindow}
                            onChange={(e, newVal) =>
                              setSecondPageState((prev) => {
                                const newState = { ...prev, smoothingWindow: newVal };
                                setIsDirty(true);
                                return newState;
                              })
                            }
                            min={1}
                            max={20}
                            step={1}
                            valueLabelDisplay="auto"
                            size="small"
                            disabled={!secondPageState.processingSteps.smoothing}
                          />
                        </>
                      )}

                      {section.key === "transformation" && (
                        <RadioGroup
                          value={secondPageState.transformation}
                          onChange={(e) =>
                            setSecondPageState((prev) => {
                              const newState = { ...prev, transformation: e.target.value };
                              setIsDirty(true);
                              return newState;
                            })
                          }
                          row
                        >
                          <FormControlLabel
                            value="none"
                            control={<Radio size="small" />}
                            label="Нет"
                            disabled={!secondPageState.processingSteps.transformation}
                          />
                          <FormControlLabel
                            value="log"
                            control={<Radio size="small" />}
                            label="Логарифм"
                            disabled={!secondPageState.processingSteps.transformation}
                          />
                          <FormControlLabel
                            value="difference"
                            control={<Radio size="small" />}
                            label="Разность"
                            disabled={!secondPageState.processingSteps.transformation}
                          />
                        </RadioGroup>
                      )}

                      {section.key === "decomposition" && (
                        <>
                          <Typography variant="caption" sx={{ color: "#fff" }}>
                            Окно: {secondPageState.decompositionWindow}
                          </Typography>
                          <Slider
                            value={secondPageState.decompositionWindow}
                            onChange={(e, newVal) =>
                              setSecondPageState((prev) => {
                                const newState = { ...prev, decompositionWindow: newVal };
                                setIsDirty(true);
                                return newState;
                              })
                            }
                            min={2}
                            max={30}
                            step={1}
                            valueLabelDisplay="auto"
                            size="small"
                            disabled={!secondPageState.processingSteps.decomposition}
                          />
                        </>
                      )}

                      {section.key === "normalization" && (
                        <Typography variant="caption" sx={{ color: "#fff" }}>
                          Масштабирование в диапазоне [0,1]
                        </Typography>
                      )}
                    </motion.div>
                  </Box>
                ))}
              </GlassPaper>
            </Box>
          </Slide>
        </Box>
      </Box>
    </motion.div>
  );
};

export default SelectedColumnsPage;
