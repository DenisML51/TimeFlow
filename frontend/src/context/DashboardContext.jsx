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

  // Новое состояние для сохранения пагинации таблицы
  const [tablePage, setTablePage] = useState(0);
  const [tableRowsPerPage, setTableRowsPerPage] = useState(25);

  // Дополнительное состояние для второй страницы и настроек предобработки
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

  // Функция сброса состояния (вызывается при загрузке нового файла или выходе из аккаунта)
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
        tablePage,
        setTablePage,
        tableRowsPerPage,
        setTableRowsPerPage,
        resetDashboardState,
        secondPageState,
        setSecondPageState,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
