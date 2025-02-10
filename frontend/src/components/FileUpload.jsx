import React, { useState } from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import axios from "axios";
import TableDisplay from "./TableDisplay";

const FileUpload = ({ setTableData, tableData = [], setColumns, setOriginalData }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Выберите файл перед загрузкой.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post("http://127.0.0.1:8000/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setLoading(false);
      setMessage("✅ Файл загружен успешно!");

      // Логируем полученные данные
      console.log("Ответ от сервера:", response.data);

      const receivedData = response.data.full_data || [];
      const previewData = response.data.df_head || [];
      const columnNames = response.data.columns || Object.keys(previewData[0] || {});

      console.log("full_data:", receivedData);
      console.log("df_head:", previewData);
      console.log("columns:", columnNames);

      // Устанавливаем данные, но проверяем, являются ли функции определенными
      if (typeof setTableData === "function") {
        setTableData(previewData);
        console.log("setTableData вызван с:", previewData);
      }
      if (typeof setOriginalData === "function") {
        setOriginalData(receivedData);
        console.log("setOriginalData вызван с:", receivedData);
      }
      if (typeof setColumns === "function") {
        setColumns(columnNames);
        console.log("setColumns вызван с:", columnNames);
      }
      
    } catch (error) {
      setLoading(false);
      setMessage("❌ Ошибка загрузки файла. Подробности в консоли.");
      console.error("Ошибка загрузки:", error);
    }
  };

  return (
    <Box sx={{ textAlign: "center", p: 4, borderRadius: "12px", bgcolor: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(10px)", boxShadow: 3 }}>
      <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} id="upload-file" />
      <label htmlFor="upload-file">
        <Button variant="contained" component="span" sx={{ borderRadius: "20px", bgcolor: "#10A37F" }}>
          📂 Выбрать файл
        </Button>
      </label>
      <br />
      <br />
      {file && <Typography variant="body1">📁 {file.name}</Typography>}
      <br />
      <Button variant="contained" onClick={handleUpload} sx={{ borderRadius: "20px" }} disabled={loading}>
        🚀 Загрузить
      </Button>
      <br />
      <br />
      {loading && <CircularProgress />}
      {message && <Typography variant="body1">{message}</Typography>}

      {tableData.length > 0 && <TableDisplay data={tableData} />}
    </Box>
  );
};

export default FileUpload;
