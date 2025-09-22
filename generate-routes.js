const axios = require('axios');
const fs = require('fs');

// 🎯 ТОЧНЫЕ КООРДИНАТЫ АВТОВОКЗАЛОВ (получены через Yandex Geocoder)
const terminals = {
  central: [55.035500, 82.898431],       // Россия, Новосибирск, ЖД Вокзал
  gusinobrodskiy: [55.041566, 83.026464] // тот же адрес — если нужно разделить, уточни адрес центрального
};

// 🗺️ МАРШРУТЫ ПО СФО — с точными координатами автовокзалов
const routesData = [
  // === НОВОСИБИРСКАЯ ОБЛАСТЬ ===
  { coords: [terminals.central, [54.761872, 83.113900]], name: 'Новосибирск → Бердск', terminal: 'central' },
  { coords: [terminals.central, [55.022577, 82.918049]], name: 'Новосибирск → Обь', terminal: 'central' },
  { coords: [terminals.central, [54.645692, 83.308529]], name: 'Новосибирск → Искитим', terminal: 'central' },
  { coords: [terminals.central, [54.230169, 83.376567]], name: 'Новосибирск → Черепаново', terminal: 'central' },
  { coords: [terminals.central, [55.447417, 78.327011]], name: 'Новосибирск → Куйбышев', terminal: 'central' },
  { coords: [terminals.central, [55.187779, 80.282123]], name: 'Новосибирск → Каргат', terminal: 'central' },
  { coords: [terminals.central, [54.703977, 78.667571]], name: 'Новосибирск → Здвинск', terminal: 'central' },
  { coords: [terminals.central, [55.214697, 75.956932]], name: 'Новосибирск → Татарск', terminal: 'central' },
  { coords: [terminals.central, [55.355751, 78.351140]], name: 'Новосибирск → Барабинск', terminal: 'central' },
  { coords: [terminals.central, [55.021390, 82.207751]], name: 'Новосибирск → Коченёво', terminal: 'central' },

  // === КЕМЕРОВСКАЯ ОБЛАСТЬ ===
  { coords: [terminals.gusinobrodskiy, [55.341500, 86.061012]], name: 'Новосибирск → Кемерово', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [53.746622, 87.118814]], name: 'Новосибирск → Новокузнецк', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [54.4128, 86.31216]], name: 'Новосибирск → Белово', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [54.681612, 86.183479]], name: 'Новосибирск → Ленинск-Кузнецкий', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [53.906093, 86.745088]], name: 'Новосибирск → Прокопьевск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [54.008771, 86.644611]], name: 'Новосибирск → Киселевск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [53.692973, 88.057248]], name: 'Новосибирск → Междуреченск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [55.713304, 84.902293]], name: 'Новосибирск → Юрга', terminal: 'gusinobrodskiy' },

  // === АЛТАЙСКИЙ КРАЙ ===
  { coords: [terminals.central, [53.351859, 83.758621]], name: 'Новосибирск → Барнаул', terminal: 'central' },
  { coords: [terminals.gusinobrodskiy, [52.533951, 85.179378]], name: 'Новосибирск → Бийск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.central, [51.515703, 81.203156]], name: 'Новосибирск → Рубцовск', terminal: 'central' },
  { coords: [terminals.central, [52.494706, 82.788566]], name: 'Новосибирск → Алейск', terminal: 'central' },
  { coords: [terminals.central, [52.978515, 78.642904]], name: 'Новосибирск → Славгород', terminal: 'central' },
  { coords: [terminals.gusinobrodskiy, [53.705905, 84.937767]], name: 'Новосибирск → Заринск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.central, [52.922414, 78.564220]], name: 'Новосибирск → Яровое', terminal: 'central' },

  // === РЕСПУБЛИКИ ===
  { coords: [terminals.gusinobrodskiy, [53.720177, 91.458719]], name: 'Новосибирск → Абакан', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [53.095360, 91.419417]], name: 'Новосибирск → Саяногорск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [51.718818, 94.460421]], name: 'Новосибирск → Кызыл', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [51.956006, 85.941410]], name: 'Новосибирск → Горно-Алтайск', terminal: 'gusinobrodskiy' },

  // === ИРКУТСКАЯ ОБЛАСТЬ & ЗАБАЙКАЛЬЕ ===
  { coords: [terminals.gusinobrodskiy, [52.289769, 104.304798]], name: 'Новосибирск → Иркутск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [57.943928, 102.733986]], name: 'Новосибирск → Усть-Илимск', terminal: 'gusinobrodskiy' },
  { coords: [terminals.gusinobrodskiy, [52.028366, 113.495057]], name: 'Новосибирск → Чита', terminal: 'gusinobrodskiy' },

  // === ТОМСКАЯ ОБЛАСТЬ ===
  { coords: [terminals.central, [56.461272, 84.991289]], name: 'Новосибирск → Томск', terminal: 'central' },
  { coords: [terminals.central, [58.312911, 82.896085]], name: 'Новосибирск → Колпашево', terminal: 'central' },

  // === ОМСКАЯ ОБЛАСТЬ ===
  { coords: [terminals.central, [54.998618, 73.281255]], name: 'Новосибирск → Омск', terminal: 'central' },
  { coords: [terminals.central, [56.891642, 74.376966]], name: 'Новосибирск → Тара', terminal: 'central' },
  { coords: [terminals.central, [55.044908, 74.576976]], name: 'Новосибирск → Калачинск', terminal: 'central' }
];

const OSRM_URL = 'http://127.0.0.1:5000/route/v1/driving/';
const results = [];

async function generateAll() {
  console.log(`🚀 Начинаем генерацию ${routesData.length} маршрутов...`);

  for (let i = 0; i < routesData.length; i++) {
    const [[lat1, lon1], [lat2, lon2]] = routesData[i].coords;
    const waypoints = `${lon1},${lat1};${lon2},${lat2}`;
    const url = `${OSRM_URL}${waypoints}?overview=full&geometries=geojson&steps=true&options=strict`;  // Фикс: &options=strict для хардкода точек

    try {
      const { data } = await axios.get(url, { timeout: 10000 });
      if (data.code !== 'Ok') {
        console.warn(`⚠️  Маршрут ${i + 1}/${routesData.length} (${routesData[i].name}) — OSRM error: ${data.code}`);
        continue;
      }

      const route = data.routes[0];
      if (!route?.geometry?.coordinates?.length) {
        console.warn(`⚠️  Маршрут ${i + 1}/${routesData.length} (${routesData[i].name}) — пустая геометрия`);
        continue;
      }

      results.push({
        routeId: i + 1,
        name: routesData[i].name,
        terminal: routesData[i].terminal,
        fullGeometry: route.geometry.coordinates, // [[lon, lat], ...]
        legs: route.legs?.map((leg, idx) => ({
          segment: idx + 1,
          geometry: leg.geometry?.coordinates || [],
          distance: leg.distance,
          duration: leg.duration
        })) || [],
        totalDistance: route.distance,
        totalDuration: route.duration
      });

      console.log(`✅ Маршрут ${i + 1}/${routesData.length}: ${routesData[i].name} — ${(route.distance / 1000).toFixed(1)} км`);

    } catch (error) {
      console.error(`❌ Ошибка маршрута ${i + 1} (${routesData[i].name}):`, error.message);
    }

    // Пауза между запросами
    await new Promise(r => setTimeout(r, 150));
  }

  // Создаём папку, если не существует
  const outputDir = './output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = `${outputDir}/routes.json`;
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n💾 Сохранено ${results.length} маршрутов в ${outputPath}`);
}

// ▶️ Запуск генерации
generateAll();