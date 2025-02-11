import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true
});

export const register = (userData) => API.post("/auth/register", userData);
export const login = (userData) => API.post("/auth/login", userData);
export const logout = () => API.post("/auth/logout");
export const uploadFile = (fileData) => API.post("/api/upload", fileData, {
  headers: { "Content-Type": "multipart/form-data" }
});
