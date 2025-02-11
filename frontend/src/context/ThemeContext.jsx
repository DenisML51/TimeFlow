import React, { createContext, useMemo, useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

export const ColorModeContext = createContext({ toggleColorMode: () => {} });

export const CustomThemeProvider = ({ children }) => {
  const [mode, setMode] = useState('dark'); // по умолчанию темная тема

  const colorMode = useMemo(() => ({
    toggleColorMode: () => {
      setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
    },
  }), []);

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: "#10A37F" },
      background: mode === 'dark'
        ? { default: "#121212", paper: "#1e1e1e" }
        : { default: "#fff", paper: "#f5f5f5" },
    },
  }), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <div style={{
          transition: 'background-color 0.5s ease',
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
        }}>
          {children}
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
