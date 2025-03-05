// AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import axios from "../components/axios"; // Импортируем наш настроенный экземпляр axios

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const fetchUser = async () => {
    try {
      const response = await axios.get("http://localhost:8000/auth/me");
      console.log('Попытка auth/me/')
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setAuthLoaded(true);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await axios.post("http://localhost:8000/auth/logout");
    } catch (error) {
      console.error("Ошибка выхода:", error);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, authLoaded, fetchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
