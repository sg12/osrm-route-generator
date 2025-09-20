# Многостадийная сборка: сначала preprocessing, потом runtime
FROM ghcr.io/project-osrm/osrm-backend:v6.0.0 AS builder

# Установите зависимости для Node.js (для батч-скрипта) — используем apk для Alpine
RUN apk update && apk add --no-cache nodejs npm wget curl

# Скачайте OSM-данные для России (обновите URL при необходимости)
WORKDIR /data
RUN wget -O russia-latest.osm.pbf https://download.geofabrik.de/russia-latest.osm.pbf

# Скопируйте профиль car.lua
COPY car.lua /opt/car.lua

# Preprocessing: extract, partition, customize (для MLD-алгоритма) — в одну строку
RUN osrm-extract -p /opt/car.lua russia-latest.osm.pbf && osrm-partition russia-latest.osrm && osrm-customize russia-latest.osrm

# Runtime stage
FROM node:18-slim AS runtime

# Установите OSRM бинарники из builder
COPY --from=builder /opt/osrm-backend /opt/osrm-backend
COPY --from=builder /data /data

# Скопируйте скрипт батч-генерации
COPY generate-routes.js /app/generate-routes.js
WORKDIR /app

# Установите axios для скрипта (npm в node:18-slim работает с apt, но здесь только npm)
RUN npm install -g axios

# Запуск: сначала сервер в фоне, потом скрипт, затем вернуть сервер (опционально)
CMD ["sh", "-c", "osrm-routed --algorithm MLD /data/russia-latest.osrm & sleep 10 && node generate-routes.js && fg %1"]