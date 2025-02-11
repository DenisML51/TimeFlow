import React, { createContext, useState } from 'react';

export const HistoryContext = createContext();

export const HistoryProvider = ({ children }) => {
  const [history, setHistory] = useState([]);
  const addHistoryItem = (item) => {
    setHistory((prev) => [...prev, item]);
  };
  const resetHistory = () => setHistory([]);
  return (
    <HistoryContext.Provider value={{ history, addHistoryItem, resetHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};
