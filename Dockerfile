FROM ghcr.io/project-osrm/osrm-backend:v6.0.0 AS builder
RUN apt-get update && apt-get install -y nodejs npm wget curl

WORKDIR /data
RUN wget -O russia-latest.osm.pbf https://download.geofabrik.de/russia-latest.osm.pbf
COPY car.lua /opt/car.lua
RUN osrm-extract -p /opt/car.lua russia-latest.osm.pbf && 
    osrm-partition russia-latest.osrm && 
    osrm-customize russia-latest.osrm

FROM node:18-slim AS runtime
COPY --from=builder /opt/osrm-backend /opt/osrm-backend
COPY --from=builder /usr/lib /usr/lib  # Дополнительно скопируйте системные libs, если нужно (для совместимости)
COPY --from=builder /data /data
RUN npm install -g axios
CMD ["sh", "-c", "osrm-routed --algorithm MLD /data/russia-latest.osrm & sleep 10 && node generate-routes.js && fg %1"]