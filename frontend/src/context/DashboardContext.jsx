import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';

export const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  // Основные состояния
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

  // Состояния для второй страницы
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

  // Состояние для ForecastPage
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
    lstmActive: false,
    lstmParams: {
      seq_length: 12,
      lag_periods: 6,
      window_sizes: "3,6,12",
      num_layers: 2,
      hidden_dim: 128,
      dropout: 0.3,
      batch_size: 64,
      epochs: 200,
      learning_rate: 0.001,
      patience: 15,
      delta: 0.001,
      n_splits: 5,
      use_attention: true,
      mc_dropout: true,
      mc_samples: 100
    },
    transformerActive: false,
    transformerParams: {
      seq_length: 24,
      lag_periods: 12,
      window_sizes: "6,12,24",
      d_model: 256,
      nhead: 8,
      num_encoder_layers: 3,
      num_decoder_layers: 1,
      dim_feedforward: 512,
      dropout: 0.2,
      batch_size: 64,
      epochs: 150,
      learning_rate: 0.0005,
      optimizer_type: "AdamW",
      criterion: "MSE",
      patience: 20,
      delta: 0.001,
      n_splits: 3,
      mc_dropout: true,
      mc_samples: 100,
      use_encoder: true,
      use_decoder: false,
      activation: "gelu",
    },
    gruActive: false,
    gruParams: {
      seq_length: 24,
      lag_periods: 12,
      window_sizes: "6,12,24",
      num_layers: 3,
      hidden_dim: 256,
      dropout: 0.4,
      batch_size: 128,
      epochs: 300,
      learning_rate: 0.0005,
      patience: 20,
      delta: 0.001,
      bidirectional: true,
      residual_connections: true,
      use_layer_norm: true,
      mc_dropout: true,
      mc_samples: 200,
      n_splits: 5
    },
    commonTab: 0,
    modelTab: 0,
    modelSubTabs: {},
    modelsOpen: false,
    csvSelectedCols: [],
    fileType: "csv",
  });

  // Флаг "изменённости" сессии
  const [isDirty, setIsDirty] = useState(false);
  const [sessionLocked, setSessionLocked] = useState(false);

  // Функция сброса состояния
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
      lstmActive: false,
      lstmParams: { seq_length: 12, lag_periods: 6, window_sizes: "3,6,12", num_layers: 2, hidden_dim: 128, dropout: 0.3, batch_size: 64, epochs: 200, learning_rate: 0.001, patience: 15, delta: 0.001, n_splits: 5, use_attention: true, mc_dropout: true, mc_samples: 100 },
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

  // Обновление флага isDirty происходит в компонентах, когда выполняются значимые действия
  useEffect(() => {
    setIsDirty(true);
  }, [filters, selectedColumns, secondPageState, tablePage, tableRowsPerPage, forecastPageState, forecastResults]);

  // Мемоизация состояния сессии
  const sessionState = useMemo(() => ({
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
  }), [
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
  ]);

  // Используем useRef для хранения актуального состояния сессии
  const sessionStateRef = useRef(sessionState);
  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  // Функция сохранения сессии (PUT-запрос), которая вызывается только при уходе со страницы или при явном переходе
  const internalSaveSession = useCallback(() => {
    if (currentSessionId && !sessionLocked && isDirty) {
      return axios
        .put(
          `http://localhost:8000/session/${currentSessionId}`,
          { state: sessionStateRef.current },
          { withCredentials: true }
        )
        .then(() => {
          console.log("Session updated:", sessionStateRef.current);
          setIsDirty(false);
        })
        .catch((err) =>
          console.error("Error updating session:", err)
        );
    }
    return Promise.resolve();
  }, [currentSessionId, sessionLocked, isDirty]);

  // Обёртка с debounce, чтобы избежать частых вызовов
  const debouncedSaveSession = useMemo(() => debounce(internalSaveSession, 1000), [internalSaveSession]);

  // Функция для явного сохранения сессии
  const saveSessionNow = useCallback(() => {
    debouncedSaveSession();
  }, [debouncedSaveSession]);

  // Сохранение сессии при уходе со страницы через navigator.sendBeacon
  const saveSessionOnUnload = useCallback(() => {
    if (currentSessionId && isDirty && !sessionLocked) {
      const url = `http://localhost:8000/session/${currentSessionId}`;
      const payload = JSON.stringify({ state: sessionStateRef.current });
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      console.log("Session updated on unload:", sessionStateRef.current);
      setIsDirty(false);
    }
  }, [currentSessionId, isDirty, sessionLocked]);

  // Регистрируем обработчик beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      saveSessionOnUnload();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveSessionOnUnload]);

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
        forecastPageState,
        setForecastPageState,
        isDirty,
        setIsDirty,
        sessionLocked,
        setSessionLocked,
        saveSessionNow,
        saveSessionOnUnload,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
