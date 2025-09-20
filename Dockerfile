# Многостадийная сборка: сначала preprocessing, потом runtime
FROM ghcr.io/project-osrm/osrm-backend:v6.0.0 AS builder

# Установите зависимости для Node.js (для батч-скрипта) — используем apk для Alpine
RUN apk update && apk add --no-cache nodejs npm wget curl

# Скачайте OSM-данные для Сибири (меньше, чтобы уложиться в 8 ГБ RAM)
WORKDIR /data
RUN wget -O siberian-fed-district-latest.osm.pbf https://download.geofabrik.de/russia/siberian-fed-district-latest.osm.pbf

# Скопируйте профиль car.lua
COPY car.lua /opt/car.lua

# Preprocessing: extract, partition, customize (для MLD-алгоритма) — в одну строку
RUN osrm-extract -p /opt/car.lua siberian-fed-district-latest.osm.pbf && osrm-partition siberian-fed-district-latest.osrm && osrm-customize siberian-fed-district-latest.osrm

# Создайте tar-архив для /data (фикс missing generated files)
RUN tar czf /data.tar.gz /data

# Runtime stage (Alpine-based для совместимости libc с OSRM)
FROM node:18-alpine AS runtime

# Установите OSRM бинарник из builder (явно: только routed для сервера)
COPY --from=builder /usr/local/bin/osrm-routed /usr/bin/osrm-routed

# Копируем tar-архив с данными
COPY --from=builder /data.tar.gz /tmp/data.tar.gz

# Извлекаем /data из tar (гарантирует все .osrm-файлы)
RUN tar xzf /tmp/data.tar.gz -C / && rm /tmp/data.tar.gz

# Копируем Boost libs и compression deps для совместимости (фикс libboost_iostreams)
COPY --from=builder /usr/lib/libboost* /usr/lib/
COPY --from=builder /usr/lib/libbz2* /usr/lib/
COPY --from=builder /usr/lib/liblzma* /usr/lib/
COPY --from=builder /usr/lib/libzstd* /usr/lib/

# Скопируйте скрипт батч-генерации
COPY generate-routes.js /app/generate-routes.js
WORKDIR /app

# Установите axios локально (в /app/node_modules)
RUN npm init -y && npm install axios

# Добавьте OSRM в PATH
ENV PATH="/usr/bin:$PATH"

# Запуск: сервер в фоне, скрипт, затем wait (без fg, чтобы не падать)
CMD ["sh", "-c", "/usr/bin/osrm-routed --algorithm MLD /data/siberian-fed-district-latest.osrm & sleep 10 && node generate-routes.js && wait"]