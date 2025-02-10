import React, { useState } from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

const FileUpload = ({ setOriginalData, setColumns }) => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
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
      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setLoading(false);
      setMessage("✅ Файл загружен успешно!");

      const receivedData = response.data.full_data || [];
      const previewData = response.data.df_head || [];
      const columnNames = response.data.columns || Object.keys(previewData[0] || {});

      // Обновляем полный набор данных (originalData) – Dashboard самостоятельно разбивает его на filteredData и tableData
      if (typeof setOriginalData === "function") {
        setOriginalData(receivedData);
      }
      if (typeof setColumns === "function") {
        setColumns(columnNames);
      }
    } catch (error) {
      setLoading(false);
      setMessage("❌ Ошибка загрузки файла. Подробности в консоли.");
      console.error("Ошибка загрузки:", error);
    }
  };

  return (
    <Box
      sx={{
        textAlign: "center",
        p: 4,
        borderRadius: "12px",
        bgcolor: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        boxShadow: 3,
      }}
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ display: "none" }}
        id="upload-file"
      />
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
    </Box>
  );
};

export default FileUpload;
