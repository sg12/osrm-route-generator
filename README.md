# OSRM Route Generator

Docker-проект для разовой генерации геометрии маршрутов по OSM-данным (для России).

## Сборка и запуск
1. Клонируйте: `git clone https://github.com/sg12/osrm-route-generator.git`
2. Соберите: `docker build -t osrm-generator .`
3. Запустите (с volume для данных): 