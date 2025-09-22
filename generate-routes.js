const axios = require('axios');
const fs = require('fs');

// Координаты автовокзалов Новосибирска
const terminals = {
  central: [55.0084, 82.9357],        // ул. Станиславского, 6
  gusinobrodskiy: [54.8997, 83.1455]  // Гусинобродское шоссе, 64/1
};

// Полный список маршрутов по СФО с координатами автовокзалов и указанием терминала отправления
const routesData = [
  { coords: [terminals.central, [54.7658, 83.0855]], name: 'Новосибирск - Бердск', terminal: 'central' },
  { coords: [terminals.central, [54.9800, 82.7000]], name: 'Новосибирск - Обь', terminal: 'central' },
  { coords: [terminals.central, [54.6267, 83.2875]], name: 'Новосибирск - Искитим', terminal: 'central' },
  { coords: [terminals.central, [54.2333, 82.9500]], name: 'Новосибирск - Черепаново', terminal: 'central' },
  { coords: [terminals.central, [55.1500, 78.9000]], name: 'Новосибирск - Куйбышев', terminal: 'central' },
  { coords: [terminals.central, [55.6333, 78.2500]], name: 'Новосибирск - Каргат', terminal: 'central' },
  { coords: [terminals.central, [54.5833, 83.7500]], name: 'Новосибирск - Здвинск', terminal: 'central' },
  { coords: [terminals.central, [56.2667, 75.9167]], name: 'Новосибирск - Татарск', terminal: 'central' },
  { coords: [terminals.central, [55.3500, 78.3500]], name: 'Новосибирск - Барабинск', terminal: 'central' },
  { coords: [terminals.central, [55.3833, 82.3667]], name: 'Новосибирск - Коченёво', terminal: 'central' },

  // Кемеровская область
  { coords: [terminals.gusinobrodskiy, [55.3355, 86.0772]], name: 'Новосибирск - Кемерово', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [53.7540, 87.1115]], name: 'Новосибирск - Новокузнецк', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [54.3780, 86.2950]], name: 'Новосибирск - Белово', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [54.6570, 86.1760]], name: 'Новосибирск - Ленинск-Кузнецкий', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [53.9070, 86.7150]], name: 'Новосибирск - Прокопьевск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [53.8833, 86.6500]], name: 'Новосибирск - Киселевск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [53.6808, 88.0573]], name: 'Новосибирск - Междуреченск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [55.7167, 84.9000]], name: 'Новосибирск - Юрга', terminal: 'gusinobrodskiy' },

  // Алтайский край
  { coords: [terminals.central, [53.3578, 83.7595]], name: 'Новосибирск - Барнаул', terminal: 'central' },
  { coords: [terminals.gusinobrodskiy, [52.5422, 85.2077]], name: 'Новосибирск - Бийск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.central, [51.5180, 81.2050]], name: 'Новосибирск - Рубцовск', terminal: 'central' },
  { coords: [terminals.central, [52.4990, 82.7740]], name: 'Новосибирск - Алейск', terminal: 'central' },
  { coords: [terminals.central, [53.4167, 78.6500]], name: 'Новосибирск - Славгород', terminal: 'central' },
  { coords: [terminals.gusinobrodskiy, [53.6960, 84.3260]], name: 'Новосибирск - Заринск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.central, [52.9333, 78.3500]], name: 'Новосибирск - Яровое', terminal: 'central' },

  // Республика Хакасия
  { coords: [terminals.gusinobrodskiy, [53.7183, 91.4357]], name: 'Новосибирск - Абакан', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [53.5833, 91.4167]], name: 'Новосибирск - Саяногорск', terminal: 'gusinobrodskiy' },

  // Республика Тыва
  { coords: [terminals.gusinobrodskiy, [51.7191, 94.4510]], name: 'Новосибирск - Кызыл', terminal: 'gusinobrodskiy' },

  // Республика Алтай
  { coords: [terminals.gusinobrodskiy, [51.9585, 85.9272]], name: 'Новосибирск - Горно-Алтайск', terminal: 'gusinobrodskiy' },

  // Иркутская область
  { coords: [terminals.gusinobrodskiy, [52.2869, 104.3050]], name: 'Новосибирск - Иркутск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [58.0000, 102.6000]], name: 'Новосибирск - Усть-Илимск', terminal: 'gusinobrodskiy' },

  // Забайкальский край
  { coords: [terminals.gusinobrodskiy, [52.0333, 113.5000]], name: 'Новосибирск - Чита', terminal: 'gusinobrodskiy' },

  // Томская область
  { coords: [terminals.central, [56.4923, 84.9810]], name: 'Новосибирск - Томск', terminal: 'central' },
  { coords: [terminals.central, [56.5000, 84.9000]], name: 'Новосибирск - Северск', terminal: 'central' },
  { coords: [terminals.central, [58.3167, 82.8833]], name: 'Новосибирск - Колпашево', terminal: 'central' },

  // Омская область
  { coords: [terminals.central, [54.9949, 73.3761]], name: 'Новосибирск - Омск', terminal: 'central' },
  { coords: [terminals.central, [56.8833, 74.3667]], name: 'Новосибирск - Тара', terminal: 'central' },
  { coords: [terminals.central, [55.5000, 74.5500]], name: 'Новосибирск - Калачинск', terminal: 'central' }
];

const OSRM_URL = 'http://127.0.0.1:5000/route/v1/driving/';
const results = [];

async function generateAll() {
  for (let i = 0; i < routesData.length; i++) {
    const [[lat1, lon1], [lat2, lon2]] = routesData[i].coords;
    const waypoints = `${lon1},${lat1};${lon2},${lat2}`;
    const url = `${OSRM_URL}${waypoints}?overview=full&geometries=geojson&steps=true`;

    try {
      const { data } = await axios.get(url, { timeout: 10000 });
      console.log(`Ответ для маршрута ${i}: code = ${data.code}, routes.length = ${data.routes ? data.routes.length : 0}`);
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        console.log(`Geometry для маршрута ${i}:`, route.geometry ? 'exists' : 'null');
        if (route.geometry && route.geometry.coordinates && route.geometry.coordinates.length > 0) {
          results.push({
            routeId: i,
            name: routesData[i].name,
            terminal: routesData[i].terminal, // добавлено для информации
            fullGeometry: route.geometry.coordinates, // [[lon, lat], ...]
            legs: route.legs ? route.legs.map((leg, legIndex) => ({
              segment: legIndex,
              geometry: leg.geometry ? leg.geometry.coordinates : [],
              distance: leg.distance,
              duration: leg.duration
            })) : [],
            totalDistance: route.distance,
            totalDuration: route.duration
          });
          console.log(`Маршрут ${i + 1}/${routesData.length} готов: ${(route.distance / 1000).toFixed(1)} км`);
        } else {
          console.log(`Маршрут ${i + 1}/${routesData.length} без геометрии`);
        }
      } else {
        console.log(`Маршрут ${i + 1}/${routesData.length} не найден`);
      }
    } catch (error) {
      console.error(`Ошибка для маршрута ${i} (${routesData[i].name}):`, error.message);
    }
    await new Promise(r => setTimeout(r, 200)); // пауза между запросами
  }

  // Создаём папку output, если её нет
  if (!fs.existsSync('/output')) {
    fs.mkdirSync('/output', { recursive: true });
  }

  fs.writeFileSync('/output/routes.json', JSON.stringify(results, null, 2), 'utf8');
  console.log(`✅ Все ${results.length} маршрутов сохранены в /output/routes.json`);
}

generateAll();