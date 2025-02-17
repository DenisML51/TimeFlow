import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';

export const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [originalData, setOriginalData] = useState([]);
  const [filters, setFilters] = useState({});
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [tablePage, setTablePage] = useState(0);
  const [tableRowsPerPage, setTableRowsPerPage] = useState(25);

  // Состояния для второй страницы (SelectedColumnsPage и ForecastPage)
  const [secondPageState, setSecondPageState] = useState({
    localSortColumn: null,
    localSortDirection: null,
    chartType: "line",
    smoothingWindow: 1,
    decompositionWindow: 2,
    outlierThreshold: 2,
    transformation: "none",
    processingSteps: {
      imputation: false,
      outliers: false,
      smoothing: false,
      transformation: false,
      decomposition: false,
      normalization: false,
    },
    viewMode: "combined",
    preprocessingOpen: false,
  });
  const [preprocessingSettings, setPreprocessingSettings] = useState({
    imputationFrequency: "D",
    outlierThreshold: 2,
    smoothingWindow: 1,
    decompositionWindow: 2,
    transformation: "none",
  });
  const [forecastResults, setForecastResults] = useState([]);

  // Новое состояние для страницы ForecastPage
  const [forecastPageState, setForecastPageState] = useState({
    horizon: 10,
    historySize: 5,
    freq: "D",
    confidenceLevel: 95,
    prophetActive: false,
    prophetParams: { seasonality_mode: "additive" },
    xgboostActive: false,
    xgboostParams: { max_depth: 6, learning_rate: 0.1, n_estimators: 100, subsample: 1, colsample_bytree: 1 },
    sarimaActive: false,
    sarimaParams: { p: 1, d: 1, q: 1, P: 1, D: 1, Q: 1, s: 12 },
    commonTab: 0,
    modelTab: 0,
    modelSubTabs: {},
    modelsOpen: false,
    csvSelectedCols: [],
    fileType: "csv",
  });

  // Флаги для отслеживания изменений и активности сессии
  const [isDirty, setIsDirty] = useState(false);
  // Если sessionLocked === true, то эта сессия загружена из истории и не обновляется автоматически
  const [sessionLocked, setSessionLocked] = useState(false);

  const resetDashboardState = () => {
    setOriginalData([]);
    setFilters({});
    setSortColumn(null);
    setSortDirection(null);
    setFilteredData([]);
    setTableData([]);
    setColumns([]);
    setSelectedColumns([]);
    setUploadedFile(null);
    setUploadedFileName("");
    setTablePage(0);
    setTableRowsPerPage(25);
    setSecondPageState({
      localSortColumn: null,
      localSortDirection: null,
      chartType: "line",
      smoothingWindow: 1,
      decompositionWindow: 2,
      outlierThreshold: 2,
      transformation: "none",
      processingSteps: {
        imputation: false,
        outliers: false,
        smoothing: false,
        transformation: false,
        decomposition: false,
        normalization: false,
      },
      viewMode: "combined",
      preprocessingOpen: false,
    });
    setPreprocessingSettings({
      imputationFrequency: "D",
      outlierThreshold: 2,
      smoothingWindow: 1,
      decompositionWindow: 2,
      transformation: "none",
    });
    setForecastResults([]);
    setForecastPageState({
      horizon: 10,
      historySize: 5,
      freq: "D",
      confidenceLevel: 95,
      prophetActive: false,
      prophetParams: { seasonality_mode: "additive" },
      xgboostActive: false,
      xgboostParams: { max_depth: 6, learning_rate: 0.1, n_estimators: 100, subsample: 1, colsample_bytree: 1 },
      sarimaActive: false,
      sarimaParams: { p: 1, d: 1, q: 1, P: 1, D: 1, Q: 1, s: 12 },
      commonTab: 0,
      modelTab: 0,
      modelSubTabs: {},
      modelsOpen: false,
      csvSelectedCols: [],
      fileType: "csv",
    });
    setCurrentSessionId(null);
    setIsDirty(false);
    setSessionLocked(false);
  };

  // При изменении ключевых состояний автоматически помечаем сессию как изменённую
  useEffect(() => {
    setIsDirty(true);
  }, [filters, selectedColumns, secondPageState, tablePage, tableRowsPerPage, forecastPageState]);

  // Debounced функция для сохранения сессии
  const saveSessionState = useCallback(
    debounce((sessionState) => {
      if (currentSessionId && !sessionLocked) {
        axios
          .put(
            `http://localhost:8000/session/${currentSessionId}`,
            { state: sessionState },
            { withCredentials: true }
          )
          .then(() => {
            console.log("Session updated:", sessionState);
            setIsDirty(false);
          })
          .catch((err) => console.error("Error updating session:", err));
      }
    }, 1000),
    [currentSessionId, sessionLocked, setIsDirty]
  );

  // Автоматическое сохранение состояния сессии при изменениях
  useEffect(() => {
    const sessionState = {
      originalData,
      columns,
      filters,
      selectedColumns,
      uploadedFileName,
      sortColumn,
      sortDirection,
      preprocessingSettings,
      forecastResults,
      secondPageState,
      tablePage,
      tableRowsPerPage,
      forecastPageState, // включаем настройки прогнозирования
    };
    if (currentSessionId && !sessionLocked && isDirty) {
      console.log("Auto-saving session state:", sessionState);
      saveSessionState(sessionState);
    }
  }, [
    originalData,
    columns,
    filters,
    selectedColumns,
    uploadedFileName,
    sortColumn,
    sortDirection,
    preprocessingSettings,
    forecastResults,
    secondPageState,
    tablePage,
    tableRowsPerPage,
    forecastPageState,
    currentSessionId,
    sessionLocked,
    isDirty,
    saveSessionState,
  ]);

  return (
    <DashboardContext.Provider
      value={{
        originalData,
        setOriginalData,
        filters,
        setFilters,
        sortColumn,
        setSortColumn,
        sortDirection,
        setSortDirection,
        filteredData,
        setFilteredData,
        tableData,
        setTableData,
        columns,
        setColumns,
        selectedColumns,
        setSelectedColumns,
        uploadedFile,
        setUploadedFile,
        uploadedFileName,
        setUploadedFileName,
        currentSessionId,
        setCurrentSessionId,
        tablePage,
        setTablePage,
        tableRowsPerPage,
        setTableRowsPerPage,
        resetDashboardState,
        secondPageState,
        setSecondPageState,
        preprocessingSettings,
        setPreprocessingSettings,
        forecastResults,
        setForecastResults,
        forecastPageState,         // Новое состояние для ForecastPage
        setForecastPageState,      // Функция для его обновления
        isDirty,
        setIsDirty,
        sessionLocked,
        setSessionLocked,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
