import React, { useState, useContext } from "react";
import {
  Button,
  Typography,
  CircularProgress,
  Paper,
  Box,
  Fade
} from "@mui/material";
import axios from "axios";
import { HistoryContext } from "../context/HistoryContext";
import { DashboardContext } from "../context/DashboardContext";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { addHistoryItem } = useContext(HistoryContext);
  const { setOriginalData, setColumns } = useContext(DashboardContext);

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
      const response = await axios.post("http://localhost:8000/api/upload", formData, {
        withCredentials: true,
      });
      setLoading(false);
      setMessage("✅ Файл загружен успешно!");

      const receivedData = response.data.full_data || [];
      const columnNames = response.data.columns || [];

      setOriginalData(receivedData);
      setColumns(columnNames);

      addHistoryItem(file.name);
    } catch (error) {
      setLoading(false);
      setMessage("❌ Ошибка загрузки файла. Подробности в консоли.");
      console.error("Ошибка загрузки:", error);
    }
  };

  return (
    <Paper
      sx={{
        // Убираем position: 'relative'
        textAlign: "center",
        p: 4,
        borderRadius: "16px",
        bgcolor: "rgba(255,255,255,0.05)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
        mb: 3,
        border: "1px solid rgba(255,255,255,0.1)",
        // Делаем верстку колоночной
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3, // расстояние между элементами
        transition: "transform 0.3s, box-shadow 0.3s",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 12px 40px rgba(16,163,127,0.2)"
        }
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
        <Button
          variant="contained"
          component="span"
          sx={{
            borderRadius: "12px",
            bgcolor: "#10A37F",
            px: 4,
            py: 1.5,
            fontSize: "1.1rem",
            transition: "all 0.3s",
            "&:hover": {
              bgcolor: "#0D8F70",
              transform: "scale(1.05)"
            }
          }}
          startIcon={<CloudUploadIcon sx={{ fontSize: 28 }} />}
        >
          Выбрать файл
        </Button>
      </label>

      {/* Блок с названием файла и его размером (появляется при выборе) */}
      {file && (
        <Fade in={!!file}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(16,163,127,0.1)",
              borderRadius: "12px",
              p: 2,
              border: "1px solid rgba(16,163,127,0.3)"
            }}
          >
            <InsertDriveFileIcon
              sx={{
                mr: 1.5,
                color: "#10A37F",
                fontSize: 32
              }}
            />
            <Typography
              variant="body1"
              sx={{
                fontWeight: 500,
                color: "rgba(255,255,255,0.9)"
              }}
            >
              {file.name}
              <Typography
                component="span"
                variant="caption"
                sx={{
                  ml: 1.5,
                  color: "rgba(255,255,255,0.6)"
                }}
              >
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Typography>
          </Box>
        </Fade>
      )}

      <Button
        variant="contained"
        onClick={handleUpload}
        sx={{
          borderRadius: "12px",
          px: 5,
          py: 1.5,
          fontSize: "1.1rem",
          transition: "all 0.3s",
          "&:disabled": {
            bgcolor: "rgba(16,163,127,0.3)"
          },
          "&:hover:not(:disabled)": {
            bgcolor: "#0D8F70",
            transform: "scale(1.05)"
          }
        }}
        disabled={loading}
      >
        {loading ? (
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <CircularProgress size={24} sx={{ color: "#fff", mr: 2 }} />
            Загрузка...
          </Box>
        ) : (
          "🚀 Загрузить"
        )}
      </Button>

      {message && (
        <Typography
          variant="body1"
          sx={{
            color: message.startsWith("✅") ? "#10A37F" : "#ff4444",
            fontWeight: 500
          }}
        >
          {message}
        </Typography>
      )}
    </Paper>
  );
};

export default FileUpload;
