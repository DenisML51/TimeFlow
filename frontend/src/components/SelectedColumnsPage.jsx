import React, { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Paper,
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
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Slide,
  Button,
  Select,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import { Line, Bar } from "react-chartjs-2";
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
import { DashboardContext } from "../context/DashboardContext";
import CategoricalDataBlock from "./CategoricalDataBlock";

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
  const navigate = useNavigate();
  const {
    selectedColumns,
    filteredData,
    filters,
    secondPageState,
    setSecondPageState,
  } = useContext(DashboardContext);

  // Состояние для анимации перехода
  const [show, setShow] = useState(true);
  const handleBack = () => setShow(false);
  const handleExited = () => navigate(-1);

  // Формируем выборку данных для выбранных столбцов (данные, переданные с первой страницы)
  const dataForDisplay = useMemo(() => {
    return filteredData.map((row) => {
      const newRow = {};
      selectedColumns.forEach((col) => {
        newRow[col] = row[col];
      });
      return newRow;
    });
  }, [filteredData, selectedColumns]);

  // Локальная сортировка по выбранным столбцам
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

  // Применяем шаги предобработки к данным, полученным с первой страницы
  const finalDataResult = useMemo(() => {
    let data = [...sortedData];
    let seasonalValues = null;

    // 1. Заполнение пропусков (импутация)
    if (secondPageState.processingSteps.imputation) {
      // Сортируем данные по дате (предполагается, что selectedColumns[0] – дата)
      let sortedByDate = [...data].sort(
        (a, b) =>
          new Date(a[selectedColumns[0]]) - new Date(b[selectedColumns[0]])
      );
      const firstDate = new Date(sortedByDate[0][selectedColumns[0]]);
      const lastDate = new Date(
        sortedByDate[sortedByDate.length - 1][selectedColumns[0]]
      );

      // Используем частоту, введённую пользователем (например, "D", "W-MON", "MS")
      const frequency = secondPageState.imputationFrequency || "D";

      // Функция для вычисления следующей даты по выбранной частоте
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

      // Корректируем начальную дату (для "W-MON" и "MS")
      let currentDate = new Date(firstDate);
      if (frequency === "W-MON") {
        const day = currentDate.getDay();
        if (day !== 1) {
          currentDate.setDate(currentDate.getDate() + (day === 0 ? 1 : 8 - day));
        }
      } else if (frequency === "MS") {
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      }

      // Генерируем полный временной ряд дат от firstDate до lastDate по выбранной частоте
      let completeDates = [];
      while (currentDate <= lastDate) {
        completeDates.push(new Date(currentDate));
        currentDate = getNextDate(currentDate, frequency);
      }

      // Создаём карту существующих дат (формат ISO: YYYY-MM-DD)
      const existingDataMap = {};
      sortedByDate.forEach((row) => {
        const dateStr = new Date(row[selectedColumns[0]])
          .toISOString()
          .split("T")[0];
        existingDataMap[dateStr] = row;
      });

      // Формируем новый массив данных: для каждой даты либо берём существующую запись, либо создаём новую с пропущенным значением
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

      // Линейная интерполяция для заполнения пропусков в таргетном столбце
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
            Number(row[selectedColumns[1]]) -
            Number(data[i][selectedColumns[1]]),
        }));
      }
    }

    // 5. Декомпозиция
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
  const dataValues = finalData.map((row) => Number(row[selectedColumns[1]]));
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
          p: 3,
          backgroundColor: "#121212",
          minHeight: "100vh",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        <Box>
          <IconButton onClick={handleBack} sx={{ position: "absolute", left: 16, top: 16, color: "#fff" }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: "center", pb: 3 }}>
            Предобработка
          </Typography>
          <IconButton onClick={handleGoToForecast} sx={{ position: "absolute", right: 16, top: 16, color: "#fff" }}>
            <ArrowForwardIcon />
          </IconButton>

          {/* Блок категориальных данных вынесен в отдельный компонент */}
          <Box sx={{ bgcolor: "#121212", p: 0.1, pb: 2 }}>
            <CategoricalDataBlock
              filteredData={filteredData}
              selectedColumns={selectedColumns}
              filters={filters}
            />
          </Box>
        </Box>
        <Grid container spacing={2}>
          {secondPageState.preprocessingOpen && (
            <Grid item xs={12} md={3}>
              <Slide direction="right" in={secondPageState.preprocessingOpen} mountOnEnter unmountOnExit>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: "#121212",
                    borderRadius: 3,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                    border: "none",
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, color: "#fff", textAlign: "center" }}>
                    Настройки предобработки
                  </Typography>

                  {/* Заполнение пропусков */}
                  <Box sx={{ mb: 2, pb: 1, borderBottom: "1px solid #333" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ color: "#fff" }}>
                        Заполнение пропусков
                      </Typography>
                      {secondPageState.processingSteps.imputation ? (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              processingSteps: { ...prev.processingSteps, imputation: false },
                            }))
                          }
                          sx={{ color: "#FF6384" }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              processingSteps: { ...prev.processingSteps, imputation: true },
                            }))
                          }
                          sx={{ color: "#10A37F" }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    {secondPageState.processingSteps.imputation &&
                      !["D", "W-MON", "MS"].includes(
                        (() => {
                          const sorted = [...sortedData].sort(
                            (a, b) =>
                              new Date(a[selectedColumns[0]]) - new Date(b[selectedColumns[0]])
                          );
                          if (sorted.length < 2) return "";
                          const date0 = new Date(sorted[0][selectedColumns[0]]);
                          const date1 = new Date(sorted[1][selectedColumns[0]]);
                          if (
                            (date0.getDate() === 1 &&
                              date1.getDate() === 1 &&
                              (date1.getFullYear() - date0.getFullYear()) * 12 +
                                (date1.getMonth() - date0.getMonth()) === 1) ||
                            Math.abs(date1 - date0 - 86400000) < 0.1 * 86400000 ||
                            Math.abs(date1 - date0 - 604800000) < 0.1 * 604800000
                          )
                            return "detected";
                          return "";
                        })()
                      ) && (
                        <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
                          <Typography variant="caption" sx={{ color: "#fff" }}>
                            Частота:
                          </Typography>
                          <Select
                            value={secondPageState.imputationFrequency || "D"}
                            onChange={(e) =>
                              setSecondPageState((prev) => ({
                                ...prev,
                                imputationFrequency: e.target.value,
                              }))
                            }
                            size="small"
                            sx={{
                              ml: 1,
                              color: "#fff",
                              borderColor: "#10A37F",
                              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#10A37F" },
                            }}
                          >
                            <MenuItem value="D">Дневная (D)</MenuItem>
                            <MenuItem value="W-MON">Недельная (W-MON)</MenuItem>
                            <MenuItem value="MS">Начало месяца (MS)</MenuItem>
                          </Select>
                        </Box>
                      )}
                  </Box>

                  {/* Выбросы */}
                  <Box sx={{ mb: 2, pb: 1, borderBottom: "1px solid #333" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ color: "#fff" }}>
                        Выбросы
                      </Typography>
                      {secondPageState.processingSteps.outliers ? (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              processingSteps: { ...prev.processingSteps, outliers: false },
                            }))
                          }
                          sx={{ color: "#FF6384" }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              processingSteps: { ...prev.processingSteps, outliers: true },
                            }))
                          }
                          sx={{ color: "#10A37F" }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: "#fff" }}>
                      Порог (σ): {secondPageState.outlierThreshold}
                    </Typography>
                    <Slider
                      value={secondPageState.outlierThreshold}
                      onChange={(e, newVal) =>
                        setSecondPageState((prev) => ({ ...prev, outlierThreshold: newVal }))
                      }
                      min={1}
                      max={5}
                      step={0.1}
                      valueLabelDisplay="auto"
                      size="small"
                    />
                  </Box>

                  {/* Сглаживание */}
                  <Box sx={{ mb: 2, pb: 1, borderBottom: "1px solid #333" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ color: "#fff" }}>
                        Сглаживание
                      </Typography>
                      {secondPageState.processingSteps.smoothing ? (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              processingSteps: { ...prev.processingSteps, smoothing: false },
                            }))
                          }
                          sx={{ color: "#FF6384" }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              processingSteps: { ...prev.processingSteps, smoothing: true },
                            }))
                          }
                          sx={{ color: "#10A37F" }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: "#fff" }}>
                      Окно: {secondPageState.smoothingWindow}
                    </Typography>
                    <Slider
                      value={secondPageState.smoothingWindow}
                      onChange={(e, newVal) =>
                        setSecondPageState((prev) => ({ ...prev, smoothingWindow: newVal }))
                      }
                      min={1}
                      max={20}
                      step={1}
                      valueLabelDisplay="auto"
                      size="small"
                    />
                  </Box>

                  {/* Преобразование */}
                  <Box sx={{ mb: 2, pb: 1, borderBottom: "1px solid #333" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ color: "#fff" }}>
                        Преобразование
                      </Typography>
                      {secondPageState.processingSteps.transformation ? (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              processingSteps: { ...prev.processingSteps, transformation: false },
                            }))
                          }
                          sx={{ color: "#FF6384" }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              processingSteps: { ...prev.processingSteps, transformation: true },
                            }))
                          }
                          sx={{ color: "#10A37F" }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <RadioGroup
                      value={secondPageState.transformation}
                      onChange={(e) =>
                        setSecondPageState((prev) => ({ ...prev, transformation: e.target.value }))
                      }
                      row
                    >
                      <FormControlLabel value="none" control={<Radio size="small" />} label="Нет" />
                      <FormControlLabel value="log" control={<Radio size="small" />} label="Логарифм" />
                      <FormControlLabel value="difference" control={<Radio size="small" />} label="Разность" />
                    </RadioGroup>
                  </Box>

                  {/* Декомпозиция */}
                  <Box sx={{ mb: 2, pb: 1, borderBottom: "1px solid #333" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ color: "#fff" }}>
                        Декомпозиция
                      </Typography>
                      {secondPageState.processingSteps.decomposition ? (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              processingSteps: { ...prev.processingSteps, decomposition: false },
                            }))
                          }
                          sx={{ color: "#FF6384" }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              processingSteps: { ...prev.processingSteps, decomposition: true },
                            }))
                          }
                          sx={{ color: "#10A37F" }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: "#fff" }}>
                      Окно: {secondPageState.decompositionWindow}
                    </Typography>
                    <Slider
                      value={secondPageState.decompositionWindow}
                      onChange={(e, newVal) =>
                        setSecondPageState((prev) => ({ ...prev, decompositionWindow: newVal }))
                      }
                      min={2}
                      max={30}
                      step={1}
                      valueLabelDisplay="auto"
                      size="small"
                    />
                  </Box>

                  {/* Нормализация */}
                  <Box sx={{ mb: 2, p: 1 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ color: "#fff" }}>
                        Нормализация
                      </Typography>
                      {secondPageState.processingSteps.normalization ? (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              processingSteps: { ...prev.processingSteps, normalization: false },
                            }))
                          }
                          sx={{ color: "#FF6384" }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      ) : (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setSecondPageState((prev) => ({
                              ...prev,
                              processingSteps: { ...prev.processingSteps, normalization: true },
                            }))
                          }
                          sx={{ color: "#10A37F" }}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Typography variant="caption" sx={{ color: "#fff" }}>
                      Масштабирование в диапазоне [0,1]
                    </Typography>
                  </Box>
                </Paper>
              </Slide>
            </Grid>
          )}
          <Grid item xs={12} md={secondPageState.preprocessingOpen ? 9 : 12}>
            <Paper sx={{ p: 2, backgroundColor: "#121212", borderRadius: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <IconButton
                    onClick={() =>
                      setSecondPageState((prev) => ({
                        ...prev,
                        preprocessingOpen: !prev.preprocessingOpen,
                      }))
                    }
                    sx={{
                      borderRadius: "50%",
                      backgroundColor: "#10A37F",
                      color: "#fff",
                      mr: 2,
                      transition: "transform 0.3s",
                      "&:hover": { backgroundColor: "#0D8F70", transform: "scale(1.1)" },
                    }}
                  >
                    {secondPageState.preprocessingOpen ? (
                      <CloseIcon fontSize="small" />
                    ) : (
                      <SettingsIcon fontSize="small" />
                    )}
                  </IconButton>
                  <Typography variant="h6" sx={{ color: "#fff" }}>
                    Результаты предобработки
                  </Typography>
                </Box>
                <ToggleButtonGroup
                  value={secondPageState.chartType}
                  exclusive
                  onChange={(e, newType) => {
                    if (newType !== null)
                      setSecondPageState((prev) => ({ ...prev, chartType: newType }));
                  }}
                  sx={{ backgroundColor: "#1E1E1E", borderRadius: "8px", p: 0.1 }}
                >
                  <ToggleButton value="line" sx={{ color: "#fff", borderColor: "#10A37F" }}>
                    Линейный
                  </ToggleButton>
                  <ToggleButton value="bar" sx={{ color: "#fff", borderColor: "#10A37F" }}>
                    Столбчатый
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "12px",
                    backgroundColor: "rgba(16,163,127,0.1)",
                    boxShadow: 3,
                    width: "100%",
                    height: 400,
                  }}
                >
                  {secondPageState.chartType === "line" && (
                    <Line
                      data={
                        secondPageState.processingSteps.decomposition &&
                        finalDataResult.seasonalValues
                          ? {
                              labels: finalDataResult.data.map(
                                (row) => row[selectedColumns[0]]
                              ),
                              datasets: [
                                {
                                  label: "Тренд",
                                  data: finalDataResult.data.map((row) =>
                                    Number(row[selectedColumns[1]])
                                  ),
                                  fill: false,
                                  backgroundColor: "rgba(16,163,127,0.6)",
                                  borderColor: "#10A37F",
                                  borderWidth: 2,
                                },
                                {
                                  label: "Сезонная компонента",
                                  data: finalDataResult.seasonalValues,
                                  fill: false,
                                  backgroundColor: "rgba(255,99,132,0.6)",
                                  borderColor: "#FF6384",
                                  borderWidth: 2,
                                  borderDash: [5, 5],
                                },
                              ],
                            }
                          : chartData
                      }
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { labels: { color: "#fff" } },
                          title: { display: true, text: "График", color: "#fff" },
                        },
                        scales: {
                          x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                          y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                        },
                      }}
                    />
                  )}
                  {secondPageState.chartType === "bar" && (
                    <Bar
                      data={chartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { labels: { color: "#fff" } },
                          title: { display: true, text: "График", color: "#fff" },
                        },
                        scales: {
                          x: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                          y: { ticks: { color: "#fff" }, grid: { color: "rgba(255,255,255,0.1)" } },
                        },
                      }}
                    />
                  )}
                </Box>
              </Box>
              <Box>
                <Box sx={{ mb: 2, display: "flex", flexDirection: "column", alignItems: "flex" }}>
                  <Typography variant="h6" sx={{ color: "#fff", mb: 2 }}>
                    Описательные статистики
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 2,
                      flexWrap: "wrap",
                      justifyContent: "center",
                      p: 2,
                      borderRadius: "16px",
                      background: "linear-gradient(135deg, rgba(16,163,127,0.2), rgba(16,163,127,0.05))",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    }}
                  >
                    {statsArray.map((stat, idx) => (
                      <Tooltip key={idx} title={stat.tooltip}>
                        <Box
                          sx={{
                            p: 2,
                            textAlign: "center",
                            borderRadius: "12px",
                            backgroundColor: "#1e1e1a",
                            border: "1px solid #10A37F",
                            transition: "transform 0.2s, box-shadow 0.2s",
                            "&:hover": {
                              transform: "scale(1.05)",
                              boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
                            },
                          }}
                        >
                          <Typography variant="h8" sx={{ color: "#10A37F", fontWeight: 600, fontSize: "1rem" }}>
                            {stat.symbol}
                          </Typography>
                          <Typography variant="subtitle2" sx={{ color: "#fff", fontSize: "0.8rem" }}>
                            {stat.value}
                          </Typography>
                        </Box>
                      </Tooltip>
                    ))}
                  </Box>
                </Box>
                <TableContainer
                  component={Paper}
                  sx={{
                    maxHeight: "480px",
                    overflowY: "auto",
                    "&::-webkit-scrollbar": { width: "8px", height: "8px" },
                    "&::-webkit-scrollbar-track": { background: "#2c2c2c", borderRadius: "0px" },
                    "&::-webkit-scrollbar-thumb": { backgroundColor: "#10A37F", borderRadius: "8px" },
                    "&::-webkit-scrollbar-thumb:hover": { backgroundColor: "#0D8F70" },
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
                            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                              {col.replace("_", " ")}
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSecondPageState((prev) => ({
                                    ...prev,
                                    localSortColumn: col,
                                    localSortDirection: "asc",
                                  }));
                                }}
                                sx={{ color: "#fff", p: 0.5 }}
                              >
                                <ArrowUpwardIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSecondPageState((prev) => ({
                                    ...prev,
                                    localSortColumn: col,
                                    localSortDirection: "desc",
                                  }));
                                }}
                                sx={{ color: "#fff", p: 0.5 }}
                              >
                                <ArrowDownwardIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {finalData.slice(0, 10).map((row, index) => (
                        <TableRow key={index} sx={{ "&:hover": { backgroundColor: "rgba(255,255,255,0.03)" } }}>
                          {selectedColumns.map((col) => (
                            <TableCell key={col} sx={{ whiteSpace: "nowrap", color: "#fff", fontWeight: "normal" }}>
                              {row[col]}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button variant="contained" color="primary" onClick={handleGoToForecast} disabled={finalData.length === 0}>
            Перейти к прогнозу
          </Button>
        </Box>
      </Box>
    </Slide>
  );
};

export default SelectedColumnsPage;
