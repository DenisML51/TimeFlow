// axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8000", // адрес вашего бэкенда
  withCredentials: true,            // обязательно для отправки cookies
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, data = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(data);
    }
  });
  failedQueue = [];
};

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Если получена ошибка 401 и запрос еще не был повторен
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Если уже идет процесс обновления, ставим запрос в очередь
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return instance(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        // Вызываем эндпоинт обновления токена; новые cookies установятся автоматически
        await instance.post("/auth/refresh");
        processQueue(null);
        // После успешного обновления повторяем исходный запрос
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
