# Многостадийная сборка: сначала preprocessing, потом runtime
FROM ghcr.io/project-osrm/osrm-backend:v6.0.0 AS builder

# Установите зависимости для Node.js
RUN apk update && apk add --no-cache nodejs npm wget curl

# Скачайте OSM-данные для Сибири
WORKDIR /data
RUN wget -O siberian-fed-district-latest.osm.pbf https://download.geofabrik.de/russia/siberian-fed-district-latest.osm.pbf

# Скопируйте профиль car.lua
COPY car.lua /opt/car.lua

# Preprocessing
RUN osrm-extract -p /opt/car.lua siberian-fed-district-latest.osm.pbf && \
    osrm-partition siberian-fed-district-latest.osrm && \
    osrm-customize siberian-fed-district-latest.osrm

# Создайте tar-архив
RUN tar czf /data.tar.gz /data

# Runtime stage
FROM node:18-alpine AS runtime

# OSRM бинарник
COPY --from=builder /usr/local/bin/osrm-routed /usr/bin/osrm-routed

# Данные
COPY --from=builder /data.tar.gz /tmp/data.tar.gz
RUN tar xzf /tmp/data.tar.gz -C / && rm /tmp/data.tar.gz

# Boost libs (как раньше)
COPY --from=builder /usr/lib/libboost* /usr/lib/
COPY --from=builder /usr/lib/libbz2* /usr/lib/
COPY --from=builder /usr/lib/liblzma* /usr/lib/
COPY --from=builder /usr/lib/libzstd* /usr/lib/

# Скрипт API
COPY app.js /app/app.js  # Переименуйте generate-routes.js в app.js
WORKDIR /app

# Установите зависимости (axios + express)
RUN npm init -y && npm install axios express

# PATH
ENV PATH="/usr/bin:$PATH"

# Запуск: OSRM в фоне + Node.js API на 3000
CMD ["sh", "-c", "/usr/bin/osrm-routed --algorithm MLD /data/siberian-fed-district-latest.osrm & sleep 10 && node app.js && wait"]