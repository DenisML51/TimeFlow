import React, { createContext, useState, useMemo, useEffect } from "react";
import { darkTheme, lightTheme } from "../theme/theme";

export const ColorModeContext = createContext({
  toggleColorMode: () => {},
  mode: "dark",
  theme: darkTheme,
});

export const ColorModeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    // Инициализация из localStorage, если значение есть
    const savedMode = localStorage.getItem("themeMode");
    return savedMode ? savedMode : "dark";
  });

  const toggleColorMode = () => {
    setMode((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    // Обновляем значение в localStorage при изменении темы
    localStorage.setItem("themeMode", mode);
  }, [mode]);

  const theme = useMemo(() => (mode === "dark" ? darkTheme : lightTheme), [mode]);

  return (
    <ColorModeContext.Provider value={{ toggleColorMode, mode, theme }}>
      {children}
    </ColorModeContext.Provider>
  );
};
