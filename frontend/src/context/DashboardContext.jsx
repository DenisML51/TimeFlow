import React, { createContext, useState } from 'react';

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
    setCurrentSessionId(null);
    setIsDirty(false);
    setSessionLocked(false);
  };

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
