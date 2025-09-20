const axios = require('axios');
const fs = require('fs');

// Пример: 500 маршрутов (каждый — массив [ [lon, lat], ... ] для остановок)
// Замените на ваши реальные данные из БД/файла
const routesData = [];
for (let i = 0; i < 500; i++) {
  // Генерация примера (замените на реальные координаты остановок)
  routesData.push([
    [37.6176, 55.7558], // Москва, точка 1
    [37.6100, 55.7650], // Точка 2
    [37.6200, 55.7800], // Финал
    // Добавьте больше точек для реального маршрута
  ]);
}

const OSRM_URL = 'http://localhost:5000/route/v1/driving/';
const results = [];

async function generateAll() {
  for (let i = 0; i < routesData.length; i++) {
    const waypoints = routesData[i].map(([lon, lat]) => `${lon},${lat}`).join(';');
    const url = `${OSRM_URL}${waypoints}?overview=full&geometries=geojson&steps=true`;

    try {
      const { data } = await axios.get(url, { timeout: 5000 });
      if (data.routes && data.routes[0]) {
        results.push({
          routeId: i,
          geometry: data.routes[0].geometry.coordinates, // [[lon, lat], ...] — для БД
          distance: data.routes[0].distance, // метров
          duration: data.routes[0].duration, // секунд
          legs: data.routes[0].legs // Сегменты между остановками
        });
        console.log(`Маршрут ${i + 1}/500 готов`);
      }
    } catch (error) {
      console.error(`Ошибка для маршрута ${i}:`, error.message);
    }
    await new Promise(r => setTimeout(r, 100)); // Пауза 0.1с
  }
  fs.writeFileSync('/data/routes.json', JSON.stringify(results, null, 2));
  console.log('Все маршруты сохранены в /data/routes.json');
}

generateAll();