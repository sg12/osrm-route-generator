# Многостадийная сборка: сначала preprocessing, потом runtime
FROM ghcr.io/project-osrm/osrm-backend:master AS builder

# Установите зависимости для Node.js (для батч-скрипта)
RUN apt-get update && apt-get install -y nodejs npm wget curl

# Скачайте OSM-данные для России (обновите URL при необходимости)
WORKDIR /data
RUN wget -O russia-latest.osm.pbf https://download.geofabrik.de/russia-latest.osm.pbf

# Preprocessing: extract, partition, customize (для MLD-алгоритма)
RUN osrm-extract -p /opt/car.lua russia-latest.osm.pbf && \
    osrm-partition russia-latest.osrm && \
    osrm-customize russia-latest.osrm

# Runtime stage
FROM node:18-slim AS runtime

# Установите OSRM бинарники из builder
COPY --from=builder /opt/osrm-backend /opt/osrm-backend
COPY --from=builder /data /data

# Установите axios для скрипта
RUN npm install -g axios

# Скопируйте скрипт батч-генерации
COPY generate-routes.js /app/generate-routes.js
WORKDIR /app

# Запуск: сначала сервер, потом скрипт (или вручную)
CMD ["sh", "-c", "osrm-routed --algorithm MLD /data/russia-latest.osrm & sleep 10 && node generate-routes.js && fg"]