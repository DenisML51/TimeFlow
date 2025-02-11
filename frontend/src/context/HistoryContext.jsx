import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const HistoryContext = createContext();

export const HistoryProvider = ({ children }) => {
  const [history, setHistory] = useState([]);

  // Функция для загрузки истории из бэкенда
  const fetchHistory = async () => {
    try {
      const response = await axios.get("http://localhost:8000/auth/history", { withCredentials: true });
      setHistory(response.data);
    } catch (error) {
      console.error("Ошибка загрузки истории:", error);
    }
  };

  // Функция для добавления нового элемента в локальное состояние (например, сразу после выполнения действия)
  const addHistoryItem = (item) => {
    setHistory((prev) => [...prev, item]);
  };

  const resetHistory = () => setHistory([]);

  // При монтировании загружаем историю
  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <HistoryContext.Provider value={{ history, fetchHistory, addHistoryItem, resetHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};
