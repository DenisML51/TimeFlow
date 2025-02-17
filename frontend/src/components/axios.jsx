// axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8000", // адрес вашего бэкенда
  withCredentials: true,            // обязательно для отправки cookies
});

// Интерсептор для автоматического обновления токенов при получении 401
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Если получена ошибка 401 и запрос ещё не был повторен
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Пытаемся обновить токены
        await instance.post("/auth/refresh");
        // После успешного обновления повторяем исходный запрос
        return instance(originalRequest);
      } catch (refreshError) {
        console.error("Ошибка обновления токена", refreshError);
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
