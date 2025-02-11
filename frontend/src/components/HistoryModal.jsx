import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";

const HistoryModal = ({ open, onClose }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (open) {
      axios.get("http://127.0.0.1:8000/auth/history", { withCredentials: true })
        .then(res => setHistory(res.data))
        .catch(err => console.error(err));
    }
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "10%",
          right: 0,
          width: 300,
          bgcolor: "#1e1e1e",
          borderRadius: "12px",
          boxShadow: 24,
          p: 2,
          color: "#fff",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">История действий</Typography>
          <IconButton onClick={onClose} sx={{ color: "#fff" }}>
            <CloseIcon />
          </IconButton>
        </Box>
        {history.length === 0 ? (
          <Typography variant="body1">Нет данных</Typography>
        ) : (
          history.map((item, idx) => (
            <Typography key={idx} variant="body2">
              {item.action} <br />
              {new Date(item.timestamp).toLocaleString()}
            </Typography>
          ))
        )}
      </Box>
    </Modal>
  );
};

export default HistoryModal;
