const axios = require('axios');
const fs = require('fs');

// 10 тестовых маршрутов: каждый — [[lat_start, lon_start], [lat_end, lon_end]]
// Новосибирск: 55.0084, 82.9357
const start = [55.0084, 82.9357];
const routesData = [
  // Новосибирск → Междуреченск: 53.6942, 88.0603
  [start, [53.6942, 88.0603]],
  // Новосибирск → Бийск: 52.5364, 85.2072
  [start, [52.5364, 85.2072]],
  // Новосибирск → Новокузнецк: 53.7596, 87.1216
  [start, [53.7596, 87.1216]],
  // Новосибирск → Томск: 56.4977, 84.9744
  [start, [56.4977, 84.9744]],
  // Новосибирск → Павлодар: 52.2740, 77.0044
  [start, [52.2740, 77.0044]],
  // Новосибирск → Кемерово: 55.3333, 86.0833
  [start, [55.3333, 86.0833]],
  // Новосибирск → Омск: 54.9924, 73.3686
  [start, [54.9924, 73.3686]],
  // Добавьте ещё 3 для 10, если нужно (примеры ниже)
  [start, [55.5000, 80.0000]], // Пример: до Барнаула (55.5, 80.0)
  [start, [54.0000, 85.0000]], // Пример: до Искитима
  [start, [56.0000, 83.0000]]  // Пример: до Севска
];

const OSRM_URL = 'http://127.0.0.1:5000/route/v1/driving/';


const results = [];

async function generateAll() {
  for (let i = 0; i < routesData.length; i++) {
    const [[lat1, lon1], [lat2, lon2]] = routesData[i];
    const waypoints = `${lon1},${lat1};${lon2},${lat2}`; // OSRM: lon,lat
    const url = `${OSRM_URL}${waypoints}?overview=full&geometries=geojson&steps=true`;

    try {
      const { data } = await axios.get(url, { timeout: 10000 });
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        results.push({
          routeId: i,
          name: `Новосибирск → Город ${i + 1}`, // Замените на реальные имена
          fullGeometry: route.geometry.coordinates, // Полная геометрия [[lon, lat], ...]
          legs: route.legs.map((leg, legIndex) => ({
            segment: legIndex,
            geometry: leg.geometry.coordinates, // Подмаршрут (если >2 waypoints)
            distance: leg.distance,
            duration: leg.duration
          })),
          totalDistance: route.distance, // метров
          totalDuration: route.duration // секунд
        });
        console.log(`Маршрут ${i + 1}/10 готов: ${route.distance / 1000} км`);
      }
    } catch (error) {
      console.error(`Ошибка для маршрута ${i}:`, error.message);
    }
    await new Promise(r => setTimeout(r, 200)); // Пауза 0.2с
  }

  fs.writeFileSync('/output/routes.json', JSON.stringify(results, null, 2));

  console.log('Все маршруты сохранены в /output/routes.json');

}

generateAll();