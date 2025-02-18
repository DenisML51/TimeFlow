// axios.js
import axios from "axios";

const instance = axios.create({
  baseURL: "http://localhost:8000", // адрес вашего бэкенда
  withCredentials: true,            // обязательно для отправки cookies
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401) {
      if (originalRequest._retry) {
        // Если уже была попытка обновления, просто отклоняем
        return Promise.reject(error);
      }
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return instance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const { data } = await instance.post("/auth/refresh");
        // Если refresh успешен, установите новый access token в заголовки, если требуется
        processQueue(null, data.access_token);
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Если refresh не удалось, больше не пытаться
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
