# Этап сборки
FROM node:16-alpine AS build
WORKDIR /app
# Копируем файлы зависимостей и устанавливаем их
COPY package.json package-lock.json ./
RUN npm install
# Копируем весь исходный код
COPY . .
# Собираем production-билд
RUN npm run build

# Этап раздачи статики через Nginx
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
