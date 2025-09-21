const axios = require('axios');
const fs = require('fs');

// 10 тестовых маршрутов: каждый — [[lat_start, lon_start], [lat_end, lon_end]]
// Новосибирск: 55.0084, 82.9357
const start = [55.0084, 82.9357];
const routesData = [
  [start, [53.6942, 88.0603]], // Междуреченск
  [start, [52.5364, 85.2072]], // Бийск
  [start, [53.7596, 87.1216]], // Новокузнецк
  [start, [56.4977, 84.9744]], // Томск
  [start, [55.3333, 86.0833]], // Кемерово
  [start, [54.9924, 73.3686]], // Омск
  [start, [53.344, 83.7783]] // Барнаул
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
      console.log(`Ответ для маршрута ${i}: code = ${data.code}`);  // Дебаж: code Ok/NoRoute
      if (data.routes && data.routes[0] && data.routes[0].geometry) {
        const route = data.routes[0];
        results.push({
          routeId: i,
          name: `Новосибирск → Город ${i + 1}`,
          fullGeometry: route.geometry.coordinates,
          legs: route.legs.map((leg, legIndex) => ({
            segment: legIndex,
            geometry: leg.geometry.coordinates,
            distance: leg.distance,
            duration: leg.duration
          })),
          totalDistance: route.distance,
          totalDuration: route.duration
        });
        console.log(`Маршрут ${i + 1}/10 готов: ${route.distance / 1000} км`);
      } else {
        console.log(`Маршрут ${i + 1}/10 не найден (code: ${data.code})`);
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