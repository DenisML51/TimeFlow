import React, { useContext, useMemo, useState, useEffect } from "react";
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
  useTheme,
  alpha,
  TextField,
  IconButton,
  Slide,
} from "@mui/material";
import { motion } from "framer-motion";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SettingsIcon from "@mui/icons-material/Settings";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
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
import axios from "axios";
import { DashboardContext } from "../context/DashboardContext";
import CategoricalDataBlock from "../components/CategoricalDataBlock";
import { Canvas } from "@react-three/fiber";
import { ParticleBackground } from "../components/home/ParticleBackground";
import GlassPaper from "../components/GlassPaper";
import TestResultCard from "../components/TestResultCard";

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

// Компонент NumberInput с кнопками уменьшения и увеличения
const NumberInput = ({ value, onChange, min, max, step = 1, sx, ...props }) => {
  const theme = useTheme();

  const handleIncrement = () => {
    let newValue = Number(value) + step;
    if (max !== undefined && newValue > max) newValue = max;
    onChange(newValue);
  };

  const handleDecrement = () => {
    let newValue = Number(value) - step;
    if (min !== undefined && newValue < min) newValue = min;
    onChange(newValue);
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", ...sx }}>
      <IconButton onClick={handleDecrement} size="small" sx={{ color: theme.palette.primary.main }}>
        <RemoveIcon fontSize="small" />
      </IconButton>
      <TextField
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        type="number"
        size="small"
        variant="outlined"
        inputProps={{
          style: { textAlign: "center", MozAppearance: "textfield" },
        }}
        sx={{
          width: "80px",
          mx: 1,
          "& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button": {
            WebkitAppearance: "none",
            margin: 0,
          },
          "& input[type=number]": {
            MozAppearance: "textfield",
          },
        }}
        {...props}
      />
      <IconButton onClick={handleIncrement} size="small" sx={{ color: theme.palette.primary.main }}>
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

// Компонент статистической карточки
const StatCard = ({ title, value, tooltip }) => {
  const theme = useTheme();
  return (
    <MuiTooltip title={tooltip}>
      <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
        <Box
          sx={{
            p: 3,
            borderRadius: "16px",
            position: "relative",
            overflow: "hidden",
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: "-50%",
              left: "-50%",
              width: "200%",
              height: "200%",
              background:
                "radial-gradient(circle, transparent 40%, rgba(255,255,255,0.1) 100%)",
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              position: "relative",
              zIndex: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography
              component="h7"
              sx={{
                fontSize: "0.875rem",
                color: theme.palette.primary.light,
                mb: 1,
                fontWeight: 500,
              }}
            >
              {title}
            </Typography>
            <Typography
              component="h7"
              sx={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: theme.palette.common.white,
              }}
            >
              {value}
            </Typography>
          </Box>
        </Box>
      </motion.div>
    </MuiTooltip>
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
    setIsDirty,
    saveSessionNow, // получаем функцию сохранения из контекста
  } = useContext(DashboardContext);
  const [timeSeriesTests, setTimeSeriesTests] = useState(null);
  const [imputedData, setImputedData] = useState(null);

  const [, setShow] = useState(true);

  // При размонтировании страницы сохраняем состояние
  useEffect(() => {
    return () => {
      // При уходе со страницы вызываем сохранение сессии
      saveSessionNow();
    };
  }, [saveSessionNow]);

  const handleBack = () => {
    setShow(false);
    // Перед навигацией можно вызвать сохранение, если требуется:
    saveSessionNow();
    setTimeout(() => navigate(-1), 300);
  };

  // Формирование данных для выбранных столбцов
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

  // Ручное выполнение заполнения пропусков на бэкенде
  const handleImputation = () => {
    if (secondPageState.processingSteps.imputation) {
      const payload = {
        data: sortedData,
        date_column: selectedColumns[0],
        value_column: selectedColumns[1],
        imputationMethod: secondPageState.imputationMethod || "linear",
        imputationFrequency: secondPageState.imputationFrequency || "D",
        imputationConstant: secondPageState.imputationConstant || 0,
      };
      axios
        .post("http://localhost:8000/api/imputation", payload, { withCredentials: true })
        .then((response) => {
          setImputedData(response.data);
          setSecondPageState((prev) => ({ ...prev, imputedData: response.data }));
          setIsDirty(true);
        })
        .catch((error) => {
          console.error("Ошибка заполнения пропусков:", error);
        });
    } else {
      setImputedData(sortedData);
    }
  };

  // Используем данные после импутации (если есть) иначе sortedData
  const processedData = secondPageState.processingSteps.imputation && imputedData ? imputedData : sortedData;

  // Остальные этапы обработки выполняются с processedData
  const finalDataResult = useMemo(() => {
    let data = [...processedData];
    let seasonalValues = null;
    let trendValues = null;

    // 2. Фильтрация выбросов (без изменений)
    if (secondPageState.processingSteps.outliers) {
      const outlierMethod = secondPageState.outlierMethod || "std";
      const targetValues = data.map((row) => Number(row[selectedColumns[1]]));
      if (outlierMethod === "std") {
        const mean = targetValues.reduce((a, b) => a + b, 0) / targetValues.length;
        const std = Math.sqrt(
          targetValues.reduce((acc, val) => acc + (val - mean) ** 2, 0) / targetValues.length
        );
        data = data.filter(
          (row) =>
            Math.abs(Number(row[selectedColumns[1]]) - mean) <= secondPageState.outlierThreshold * std
        );
      } else if (outlierMethod === "mad") {
        const sortedVals = [...targetValues].sort((a, b) => a - b);
        const median = sortedVals[Math.floor(targetValues.length / 2)];
        const deviations = targetValues.map((val) => Math.abs(val - median));
        const sortedDev = [...deviations].sort((a, b) => a - b);
        const mad = sortedDev[Math.floor(deviations.length / 2)];
        data = data.filter(
          (row) =>
            Math.abs(Number(row[selectedColumns[1]]) - median) <= secondPageState.outlierThreshold * mad
        );
      }
    }

    // 3. Сглаживание (без изменений)
    if (secondPageState.processingSteps.smoothing && secondPageState.smoothingWindow > 1) {
      const smoothingMethod = secondPageState.smoothingMethod || "movingAverage";
      if (smoothingMethod === "movingAverage") {
        let smoothed = [];
        for (let i = 0; i < data.length; i++) {
          const windowData = data.slice(
            Math.max(0, i - secondPageState.smoothingWindow + 1),
            i + 1
          );
          const avg = windowData.reduce((sum, row) => sum + Number(row[selectedColumns[1]]), 0) / windowData.length;
          smoothed.push({ ...data[i], [selectedColumns[1]]: avg });
        }
        data = smoothed;
      } else if (smoothingMethod === "exponential") {
        let smoothed = [];
        const alpha = 2 / (secondPageState.smoothingWindow + 1);
        let prevSmoothed = Number(data[0][selectedColumns[1]]);
        smoothed.push({ ...data[0], [selectedColumns[1]]: prevSmoothed });
        for (let i = 1; i < data.length; i++) {
          const currentVal = Number(data[i][selectedColumns[1]]);
          const expSmoothed = alpha * currentVal + (1 - alpha) * prevSmoothed;
          smoothed.push({ ...data[i], [selectedColumns[1]]: expSmoothed });
          prevSmoothed = expSmoothed;
        }
        data = smoothed;
      }
    }

    // 4. Преобразование (без изменений)
    if (secondPageState.processingSteps.transformation && secondPageState.transformation !== "none") {
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
      } else if (secondPageState.transformation === "sqrt") {
        data = data.map((row) => ({
          ...row,
          [selectedColumns[1]]: Math.sqrt(Number(row[selectedColumns[1]])),
        }));
      } else if (secondPageState.transformation === "boxcox") {
        const lambda = secondPageState.boxcoxLambda || 0.5;
        data = data.map((row) => {
          const val = Number(row[selectedColumns[1]]);
          if (val <= 0) return { ...row, [selectedColumns[1]]: val };
          return {
            ...row,
            [selectedColumns[1]]: lambda !== 0 ? (Math.pow(val, lambda) - 1) / lambda : Math.log(val),
          };
        });
      } else if (secondPageState.transformation === "stationary") {
        const lambda = secondPageState.boxcoxLambda || 0.5;
        const boxcoxData = data.map((row) => {
          const val = Number(row[selectedColumns[1]]);
          if (val <= 0) return NaN;
          return lambda !== 0 ? (Math.pow(val, lambda) - 1) / lambda : Math.log(val);
        });
        data = data.slice(1).map((row, i) => ({
          ...row,
          [selectedColumns[1]]: boxcoxData[i + 1] - boxcoxData[i],
        }));
      }
    }

    // 5. Декомпозиция (без изменений)
    if (secondPageState.processingSteps.decomposition && secondPageState.decompositionWindow > 1) {
      let trend = [];
      for (let i = 0; i < data.length; i++) {
        const windowData = data.slice(
          Math.max(0, i - secondPageState.decompositionWindow + 1),
          i + 1
        );
        const avg = windowData.reduce((sum, row) => sum + Number(row[selectedColumns[1]]), 0) / windowData.length;
        trend.push(avg);
      }
      seasonalValues = data.map((row, i) => Number(row[selectedColumns[1]]) - trend[i]);
      trendValues = trend;
      if (!secondPageState.decompositionKeepBoth) {
        data = data.map((row, i) => ({ ...row, [selectedColumns[1]]: trend[i] }));
      } else {
        data = data.map((row, i) => ({ ...row, trend: trend[i], seasonal: seasonalValues[i] }));
      }
    }

    // 6. Нормализация (без изменений)
    if (secondPageState.processingSteps.normalization) {
      const values = data.map((row) => Number(row[selectedColumns[1]]));
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      data = data.map((row) => ({
        ...row,
        [selectedColumns[1]]: (Number(row[selectedColumns[1]]) - minVal) / (maxVal - minVal),
      }));
    }
    return { data, seasonalValues, trendValues };
  }, [processedData, secondPageState, selectedColumns]);

  const finalData = finalDataResult.data;
  const labels = finalData.map((row) => row[selectedColumns[0]]);
  const trendVals = finalData.map((row) =>
    secondPageState.processingSteps.decomposition && !secondPageState.decompositionKeepBoth
      ? Number(row[selectedColumns[1]])
      : Number(row[selectedColumns[1]])
  );

  // Формирование данных для графика
  let chartData;
  if (
    secondPageState.processingSteps.decomposition &&
    (finalDataResult.seasonalValues || finalDataResult.trendValues)
  ) {
    if (secondPageState.decompositionKeepBoth) {
      if (secondPageState.viewMode === "combined") {
        chartData = {
          labels,
          datasets: [
            {
              label: "Оригинальные данные",
              data: finalData.map((row) => Number(row[selectedColumns[1]])),
              fill: false,
              backgroundColor: alpha(theme.palette.grey[500], 0.6),
              borderColor: theme.palette.grey[500],
              borderWidth: 2,
            },
            {
              label: "Тренд",
              data: finalData.map((row) => row.trend),
              fill: false,
              backgroundColor: alpha(theme.palette.primary.main, 0.6),
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
            },
            {
              label: "Сезонность",
              data: finalData.map((row) => row.seasonal),
              fill: false,
              backgroundColor: alpha(theme.palette.error.main, 0.6),
              borderColor: theme.palette.error.main,
              borderWidth: 2,
            },
          ],
        };
      } else if (secondPageState.viewMode === "original") {
        chartData = {
          labels,
          datasets: [
            {
              label: "Оригинальные данные",
              data: finalData.map((row) => Number(row[selectedColumns[1]])),
              fill: false,
              backgroundColor: alpha(theme.palette.grey[500], 0.6),
              borderColor: theme.palette.grey[500],
              borderWidth: 2,
            },
          ],
        };
      } else if (secondPageState.viewMode === "trend") {
        chartData = {
          labels,
          datasets: [
            {
              label: "Тренд",
              data: finalData.map((row) => row.trend),
              fill: false,
              backgroundColor: alpha(theme.palette.primary.main, 0.6),
              borderColor: theme.palette.primary.main,
              borderWidth: 2,
            },
          ],
        };
      } else if (secondPageState.viewMode === "seasonal") {
        chartData = {
          labels,
          datasets: [
            {
              label: "Сезонность",
              data: finalData.map((row) => row.seasonal),
              fill: false,
              backgroundColor: alpha(theme.palette.error.main, 0.6),
              borderColor: theme.palette.error.main,
              borderWidth: 2,
            },
          ],
        };
      }
    } else {
      chartData = {
        labels,
        datasets: [
          {
            label: "Тренд",
            data: trendVals,
            fill: false,
            backgroundColor: alpha(theme.palette.primary.main, 0.6),
            borderColor: theme.palette.primary.main,
            borderWidth: 2,
          },
          {
            label: "Сезонность",
            data: finalDataResult.seasonalValues,
            fill: false,
            backgroundColor: alpha(theme.palette.error.main, 0.6),
            borderColor: theme.palette.error.main,
            borderWidth: 2,
          },
        ],
      };
    }
  } else {
    chartData = {
      labels,
      datasets: [
        {
          label: selectedColumns[1],
          data: trendVals,
          fill: false,
          backgroundColor: alpha(theme.palette.primary.main, 0.6),
          borderColor: theme.palette.primary.main,
          borderWidth: 2,
        },
      ],
    };
  }

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
    const median = count % 2 === 0
      ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2
      : sorted[Math.floor(count / 2)];
    const variance = numericData.reduce((acc, val) => acc + (val - mean) ** 2, 0) / count;
    const std = Math.sqrt(variance);
    return { count, mean, median, std, min, max };
  };

  const stats = computeStats(trendVals);
  const statsArray = stats
    ? [
        { title: "Количество", value: stats.count, tooltip: "Всего наблюдений" },
        { title: "Среднее", value: stats.mean.toFixed(3), tooltip: "Среднее значение" },
        { title: "Медиана", value: stats.median.toFixed(3), tooltip: "Медианное значение" },
        { title: "Ст.откл.", value: stats.std.toFixed(3), tooltip: "Стандартное отклонение" },
        { title: "Мин", value: stats.min.toFixed(3), tooltip: "Минимальное значение" },
        { title: "Макс", value: stats.max.toFixed(3), tooltip: "Максимальное значение" },
      ]
    : [];

  // Функция для запуска тестов временного ряда через бэкенд
  const handleRunTimeSeriesTests = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/timeseries_tests",
        { values: finalData.map((row) => Number(row[selectedColumns[1]])) },
        { withCredentials: true }
      );
      setTimeSeriesTests(response.data);
    } catch (error) {
      console.error("Ошибка вычисления тестов:", error);
    }
  };

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

      <Box sx={{ position: "relative", minHeight: "100vh" }}>
        {/* Header Section */}
        <Box sx={{ display: "flex", justifyContent: "space-between", m: 2, pt: 2 }}>
          <Button
            variant="contained"
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
            sx={{
              background: alpha(theme.palette.primary.main, 0.15),
              color: theme.palette.primary.main,
              borderRadius: "12px",
              px: 3,
              "&:hover": { background: alpha(theme.palette.primary.main, 0.3) },
            }}
          >
            Назад
          </Button>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.secondary} 100%)`,
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
              background: alpha(theme.palette.primary.main, 0.15),
              color: theme.palette.primary.main,
              borderRadius: "12px",
              px: 3,
              "&:hover": { background: alpha(theme.palette.primary.main, 0.3) },
            }}
          >
            Прогноз
          </Button>
        </Box>
        <Box sx={{ pt: 2 }}>
          <CategoricalDataBlock filteredData={filteredData} selectedColumns={selectedColumns} filters={filters} />
        </Box>

        {/* Основной контент и боковая панель предобработки */}
        <Box sx={{ position: "relative", mt: 2, p: 2 }}>
          <Box
            sx={{
              transition: "margin-left 0.3s",
              marginLeft: secondPageState.preprocessingOpen ? "320px" : 0,
            }}
          >
            <GlassPaper>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
                <Button
                  variant="contained"
                  onClick={() =>
                    setSecondPageState((prev) => {
                      const newState = { ...prev, preprocessingOpen: !prev.preprocessingOpen };
                      setIsDirty(true);
                      return newState;
                    })
                  }
                  startIcon={<SettingsIcon />}
                  sx={{
                    background: alpha(theme.palette.primary.main, 0.15),
                    color: theme.palette.primary.main,
                    borderRadius: "12px",
                  }}
                >
                  {secondPageState.preprocessingOpen ? "Скрыть настройки" : "Показать настройки"}
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
                    background: alpha(theme.palette.common.white, 0.05),
                    borderRadius: "12px",
                  }}
                >
                  <ToggleButton
                    value="line"
                    sx={{
                      color: secondPageState.chartType === "line" ? theme.palette.primary.main : theme.palette.common.white,
                    }}
                  >
                    Линия
                  </ToggleButton>
                  <ToggleButton
                    value="bar"
                    sx={{
                      color: secondPageState.chartType === "bar" ? theme.palette.primary.main : theme.palette.common.white,
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
                        legend: { labels: { color: theme.palette.common.white } },
                        title: { display: false },
                      },
                      scales: {
                        x: { grid: { color: alpha(theme.palette.common.white, 0.05) }, ticks: { color: theme.palette.common.white } },
                        y: { grid: { color: alpha(theme.palette.common.white, 0.05) }, ticks: { color: theme.palette.common.white } },
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
                        legend: { labels: { color: theme.palette.common.white } },
                        title: { display: false },
                      },
                      scales: {
                        x: { grid: { color: alpha(theme.palette.common.white, 0.05) }, ticks: { color: theme.palette.common.white } },
                        y: { grid: { color: alpha(theme.palette.common.white, 0.05) }, ticks: { color: theme.palette.common.white } },
                      },
                    }}
                  />
                )}
              </Box>

              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ color: theme.palette.common.white, textAlign: "center", mb: 2 }}>
                  Описательные статистики
                </Typography>
                <Grid container spacing={3} justifyContent="center">
                  {statsArray.map((stat, i) => (
                    <Grid item xs={12} sm={6} md={4} key={i}>
                      <StatCard {...stat} />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              {/* Блок статистических тестов */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ color: theme.palette.common.white, textAlign: "center", mb: 2 }}>
                  Тесты временного ряда
                </Typography>
                <Button variant="outlined" onClick={handleRunTimeSeriesTests}>
                  Вычислить тесты
                </Button>
                {timeSeriesTests && (
                  <Box sx={{ mt: 2 }}>
                    <TestResultCard
                      testName="ADF"
                      statistic={timeSeriesTests.ADF.statistic}
                      pValue={timeSeriesTests.ADF.pvalue}
                      description="Тест ADF проверяет наличие единичного корня и стационарность ряда."
                    />
                    <TestResultCard
                      testName="KPSS"
                      statistic={timeSeriesTests.KPSS.statistic}
                      pValue={timeSeriesTests.KPSS.pvalue}
                      description="KPSS тест проверяет гипотезу о стационарности ряда."
                    />
                    {timeSeriesTests["Ljung-Box"] && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ color: theme.palette.common.white, mb: 1 }}>
                          Ljung-Box:
                        </Typography>
                        {timeSeriesTests["Ljung-Box"].map((item, idx) => (
                          <TestResultCard
                            key={idx}
                            testName={`Лаг ${item.lag}`}
                            statistic={item.lb_stat}
                            pValue={item.lb_pvalue}
                            description="Ljung-Box тест проверяет автокорреляцию остатков ряда."
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ color: theme.palette.common.white, textAlign: "center", mb: 2 }}>
                  Данные
                </Typography>
                <Box
                  sx={{
                    maxHeight: 400,
                    overflow: "auto",
                    borderRadius: "12px",
                    border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                    "&::-webkit-scrollbar": { width: "6px" },
                    "&::-webkit-scrollbar-track": { background: alpha(theme.palette.common.white, 0.1), borderRadius: "4px" },
                    "&::-webkit-scrollbar-thumb": { backgroundColor: alpha(theme.palette.primary.main, 0.6), borderRadius: "4px" },
                  }}
                >
                  <Table sx={{ background: alpha(theme.palette.common.white, 0.02) }}>
                    <TableHead>
                      <TableRow>
                        {selectedColumns.map((col) => (
                          <TableCell
                            key={col}
                            sx={{
                              background: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontWeight: 600,
                            }}
                          >
                            <TableSortLabel
                              active={secondPageState.localSortColumn === col}
                              direction={
                                secondPageState.localSortColumn === col ? secondPageState.localSortDirection : "asc"
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
                            "&:nth-of-type(odd)": { background: alpha(theme.palette.common.white, 0.02) },
                          }}
                        >
                          {selectedColumns.map((col) => (
                            <TableCell key={col} sx={{ color: theme.palette.common.white }}>
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
            <Box sx={{ position: "absolute", top: 16, left: 16, width: "300px", height: "97.5%", boxSizing: "border-box" }}>
              <GlassPaper
                sx={{
                  height: "100%",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                {[
                  { key: "imputation", label: "Заполнение пропусков" },
                  { key: "outliers", label: "Обработка выбросов" },
                  { key: "smoothing", label: "Сглаживание" },
                  { key: "transformation", label: "Преобразование" },
                  { key: "decomposition", label: "Декомпозиция" },
                  { key: "normalization", label: "Нормализация" },
                ].map((section) => (
                  <Box
                    key={section.key}
                    sx={{
                      background: alpha(theme.palette.common.white, 0.05),
                      borderRadius: "12px",
                      p: 2,
                      boxShadow: "0px 4px 12px rgba(0,0,0,0.1)",
                      border: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold", color: theme.palette.primary.main }}>
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
                          "& .MuiSwitch-switchBase.Mui-checked": { color: theme.palette.primary.main },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: theme.palette.primary.main },
                        }}
                      />
                    </Box>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {section.key === "imputation" && (
                        <Box sx={{ mt: 1 }}>
                          {/* Строка для задания частоты с кнопкой запуска */}
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <Typography variant="caption" sx={{ color: theme.palette.common.white }}>
                              Частота:
                            </Typography>
                            <TextField
                              value={secondPageState.imputationFrequency || "D"}
                              onChange={(e) =>
                                setSecondPageState((prev) => {
                                  const newState = { ...prev, imputationFrequency: e.target.value };
                                  setIsDirty(true);
                                  return newState;
                                })
                              }
                              size="small"
                              variant="outlined"
                              sx={{ ml: 1, width: "80px" }}
                              InputProps={{
                                sx: { color: theme.palette.common.white },
                              }}
                            />
                            <Button variant="outlined" size="small" onClick={handleImputation} sx={{ ml: 1 }}>
                              Заполнить
                            </Button>
                          </Box>
                          {/* Строка для выбора метода */}
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Typography variant="caption" sx={{ color: theme.palette.common.white }}>
                              Метод:
                            </Typography>
                            <Select
                              value={secondPageState.imputationMethod || "linear"}
                              onChange={(e) =>
                                setSecondPageState((prev) => {
                                  const newState = { ...prev, imputationMethod: e.target.value };
                                  setIsDirty(true);
                                  return newState;
                                })
                              }
                              size="small"
                              disabled={!secondPageState.processingSteps.imputation}
                              sx={{ ml: 1, color: theme.palette.common.white }}
                            >
                              <MenuItem value="linear">Лин. интерполяция</MenuItem>
                              <MenuItem value="forwardFill">Заполнение вперед</MenuItem>
                              <MenuItem value="backwardFill">Заполнение назад</MenuItem>
                              <MenuItem value="constant">Константа</MenuItem>
                            </Select>
                          </Box>
                          {/* Если выбран метод "Константа", выводим поле ввода ниже */}
                          {secondPageState.imputationMethod === "constant" && (
                            <Box sx={{ mt: 1 }}>
                              <NumberInput
                                value={secondPageState.imputationConstant || 0}
                                onChange={(newVal) =>
                                  setSecondPageState((prev) => ({
                                    ...prev,
                                    imputationConstant: newVal,
                                  }))
                                }
                                min={0}
                                step={1}
                              />
                            </Box>
                          )}
                        </Box>
                      )}

                      {section.key === "outliers" && (
                        <>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <Typography variant="caption" sx={{ color: theme.palette.common.white }}>
                              Метод:
                            </Typography>
                            <Select
                              value={secondPageState.outlierMethod || "std"}
                              onChange={(e) =>
                                setSecondPageState((prev) => {
                                  const newState = { ...prev, outlierMethod: e.target.value };
                                  setIsDirty(true);
                                  return newState;
                                })
                              }
                              size="small"
                              disabled={!secondPageState.processingSteps.outliers}
                              sx={{ ml: 1, color: theme.palette.common.white }}
                            >
                              <MenuItem value="std">Станд. отклонение</MenuItem>
                              <MenuItem value="mad">MAD</MenuItem>
                            </Select>
                          </Box>
                          <Typography variant="caption" sx={{ color: theme.palette.common.white }}>
                            Порог (σ/MAD): {secondPageState.outlierThreshold}
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
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <Typography variant="caption" sx={{ color: theme.palette.common.white }}>
                              Метод:
                            </Typography>
                            <Select
                              value={secondPageState.smoothingMethod || "movingAverage"}
                              onChange={(e) =>
                                setSecondPageState((prev) => {
                                  const newState = { ...prev, smoothingMethod: e.target.value };
                                  setIsDirty(true);
                                  return newState;
                                })
                              }
                              size="small"
                              disabled={!secondPageState.processingSteps.smoothing}
                              sx={{ ml: 1, color: theme.palette.common.white }}
                            >
                              <MenuItem value="movingAverage">Скольз. среднее</MenuItem>
                              <MenuItem value="exponential">Эксп. сглаживание</MenuItem>
                            </Select>
                          </Box>
                          <Typography variant="caption" sx={{ color: theme.palette.common.white }}>
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
                        <>
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
                            <FormControlLabel
                              value="sqrt"
                              control={<Radio size="small" />}
                              label="Квадратный корень"
                              disabled={!secondPageState.processingSteps.transformation}
                            />
                            <FormControlLabel
                              value="boxcox"
                              control={<Radio size="small" />}
                              label="Box–Cox"
                              disabled={!secondPageState.processingSteps.transformation}
                            />
                            <FormControlLabel
                              value="stationary"
                              control={<Radio size="small" />}
                              label="Стационарность"
                              disabled={!secondPageState.processingSteps.transformation}
                            />
                          </RadioGroup>
                          {(secondPageState.transformation === "boxcox" ||
                            secondPageState.transformation === "stationary") && (
                            <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                              <Typography variant="caption" sx={{ color: theme.palette.common.white }}>
                                λ:
                              </Typography>
                              <NumberInput
                                value={secondPageState.boxcoxLambda || 0.5}
                                onChange={(newVal) =>
                                  setSecondPageState((prev) => ({
                                    ...prev,
                                    boxcoxLambda: newVal,
                                  }))
                                }
                                min={0}
                                step={0.1}
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          )}
                        </>
                      )}

                      {section.key === "decomposition" && (
                        <>
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                            <Typography variant="caption" sx={{ color: theme.palette.common.white }}>
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
                              sx={{ ml: 1 }}
                            />
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                            <Typography variant="caption" sx={{ color: theme.palette.common.white }}>
                              Сохранять оригинальные данные:
                            </Typography>
                            <Switch
                              checked={secondPageState.decompositionKeepBoth || false}
                              onChange={() =>
                                setSecondPageState((prev) => ({
                                  ...prev,
                                  decompositionKeepBoth: !prev.decompositionKeepBoth,
                                }))
                              }
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                          {secondPageState.decompositionKeepBoth && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ color: theme.palette.common.white }}>
                                Режим отображения:
                              </Typography>
                              <ToggleButtonGroup
                                value={secondPageState.viewMode}
                                exclusive
                                onChange={(e, newVal) =>
                                  newVal &&
                                  setSecondPageState((prev) => ({
                                    ...prev,
                                    viewMode: newVal,
                                  }))
                                }
                                sx={{ ml: 1 }}
                              >
                                <ToggleButton value="combined">Комбин.</ToggleButton>
                                <ToggleButton value="original">Ориг.</ToggleButton>
                                <ToggleButton value="trend">T</ToggleButton>
                                <ToggleButton value="seasonal">S</ToggleButton>
                              </ToggleButtonGroup>
                            </Box>
                          )}
                        </>
                      )}

                      {section.key === "normalization" && (
                        <Typography variant="caption" sx={{ color: theme.palette.common.white }}>
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
