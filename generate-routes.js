const express = require('express');
const axios = require('axios');
const fs = require('fs');

// ТОЧНЫЕ КООРДИНАТЫ АВТОВОКЗАЛОВ
const terminals = {
  central: [55.035500, 82.898431],       // Новосибирск, ЖД Вокзал (центральный автовокзал)
  gusinobrodskiy: [55.041566, 83.026464] // Новосибирск, Гусинобродское шоссе
};

const yurtyRoutePoints = [
  { order: 0,     lat: 55.035500, lon: 82.898431 }, // Новосибирский автовокзал-Главный
  { order: 10,    lat: 55.041556, lon: 83.026420 }, // exit
  { order: 20,    lat: 55.040342, lon: 83.024913 }, // turn
  { order: 30,    lat: 55.039865, lon: 83.025057 }, // turn
  { order: 40,    lat: 55.030000, lon: 83.050000 }, // entry — corrected to M51 highway entry toward Yurty (was likely a typo)
  { order: 1000,  lat: 55.040269, lon: 83.399594 }, // Плотниково
  { order: 2000,  lat: 54.988022, lon: 83.845790 }, // Усть-Каменка
  { order: 999999, lat: 54.858003, lon: 84.811953 }  // Юрты
].sort((a, b) => a.order - b.order)
  .map(p => [p.lat, p.lon]);

// ВСЕ МАРШРУТЫ ПО СФО
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
  { coords: [terminals.central, [55.044908, 74.576976]], name: 'Новосибирск → Калачинск', terminal: 'central' },
  {
    waypoints: yurtyRoutePoints,
    name: 'Новосибирск → Юрты',
    terminal: 'gusinobrodskiy'
  }
];

const OSRM_URL = 'http://127.0.0.1:5000/route/v1/driving/';
const app = express();
app.use(express.json()); // Для парсинга JSON в POST

// Эндпоинт: Динамическая генерация одного маршрута
app.post('/generate-route', async (req, res) => {
  try {
    const { waypoints, name, saveToDisk = false } = req.body;
    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return res.status(400).json({ error: 'Нужны минимум 2 waypoints: [[lat1, lon1], [lat2, lon2]]' });
    }

    const waypointsStr = waypoints.map(([lat, lon]) => `${lon},${lat}`).join(';');
    const url = `${OSRM_URL}${waypointsStr}?overview=full&geometries=geojson&steps=true`;

    const { data } = await axios.get(url, { timeout: 10000 });

    if (data.code !== 'Ok') {
      return res.status(400).json({ error: `OSRM error: ${data.code}` });
    }

    const route = data.routes[0];
    if (!route?.geometry?.coordinates?.length) {
      return res.status(400).json({ error: 'Пустая геометрия' });
    }

    const result = {
      name: name || 'Unnamed Route',
      fullGeometry: route.geometry.coordinates,
      legs: route.legs?.map((leg, idx) => ({
        segment: idx + 1,
        distance: leg.distance,
        duration: leg.duration
      })) || [],
      totalDistance: route.distance,
      totalDuration: route.duration,
      waypoints: data.waypoints
    };

    // Опционально: Сохранить на диск
    if (saveToDisk) {
      const outputDir = '/app/output'; // Adjusted to /app for container consistency
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      const filename = `${name || 'route'}.json`.replace(/[^a-z0-9]/gi, '_');
      fs.writeFileSync(`${outputDir}/${filename}`, JSON.stringify(result, null, 2), 'utf8');
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Эндпоинт: Батч-генерация всех маршрутов (как оригинальный generateAll, но с возвратом JSON)
app.post('/generate-all', async (req, res) => {
  const { saveToDisk = true } = req.body;
  const results = [];
  let processed = 0;
  let errors = 0;

  console.log(`Начинаем генерацию ${routesData.length} маршрутов...`);

  for (let i = 0; i < routesData.length; i++) {
    const routeConfig = routesData[i];

    // Поддержка старого формата (coords) и нового (waypoints)
    let points;
    if (routeConfig.waypoints) {
      points = routeConfig.waypoints; // [[lat, lon], [lat, lon], ...]
    } else if (routeConfig.coords) {
      points = routeConfig.coords; // для обратной совместимости
    } else {
      console.warn(` Маршрут ${i + 1} не содержит coords или waypoints`);
      errors++;
      continue;
    }

    // Проверка: минимум 2 точки
    if (points.length < 2) {
      console.warn(` Маршрут ${i + 1} имеет менее 2 точек`);
      errors++;
      continue;
    }

    // Формируем waypoints для OSRM: lon,lat;lon,lat;...
    const waypointsStr = points.map(([lat, lon]) => `${lon},${lat}`).join(';');
    const url = `${OSRM_URL}${waypointsStr}?overview=full&geometries=geojson&steps=true`;

    try {
      const { data } = await axios.get(url, { timeout: 10000 });
      
      if (data.code !== 'Ok') {
        console.warn(`  Маршрут ${i + 1}/${routesData.length} (${routeConfig.name}) — OSRM error: ${data.code}`);
        errors++;
        continue;
      }

      const route = data.routes[0];
      
      if (!route?.geometry?.coordinates?.length) {
        console.warn(`  Маршрут ${i + 1}/${routesData.length} (${routeConfig.name}) — пустая геометрия`);
        errors++;
        continue;
      }

      results.push({
        routeId: i + 1,
        name: routeConfig.name,
        terminal: routeConfig.terminal,
        fullGeometry: route.geometry.coordinates,
        legs: route.legs?.map((leg, idx) => ({
          segment: idx + 1,
          distance: leg.distance,
          duration: leg.duration,
          // Можно добавить from/to остановки, если нужно
        })) || [],
        totalDistance: route.distance,
        totalDuration: route.duration,
        waypoints: data.waypoints // все привязанные точки
      });

      console.log(` Маршрут ${i + 1}/${routesData.length}: ${routeConfig.name} — ${(route.distance / 1000).toFixed(1)} км`);
      processed++;

    } catch (error) {
      console.error(` Ошибка маршрута ${i + 1} (${routeConfig.name}):`, error.message);
      errors++;
    }

    // Пауза между запросами
    await new Promise(r => setTimeout(r, 150));
  }

  // Опционально: Сохранить на диск
  if (saveToDisk) {
    const outputDir = '/app/output'; // Adjusted for container
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputPath = `${outputDir}/routes.json`;
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');

    console.log(`\nСохранено ${results.length} маршрутов в ${outputPath}`);

    // Сохраняем также сводку
    const summary = results.map(r => ({
      name: r.name,
      distance_km: (r.totalDistance / 1000).toFixed(1),
      duration_min: Math.round(r.totalDuration / 60),
      terminal: r.terminal
    }));

    fs.writeFileSync(`${outputDir}/routes_summary.json`, JSON.stringify(summary, null, 2));
    console.log(` Сводка сохранена в ${outputDir}/routes_summary.json`);
  }

  // Возвращаем в ответе
  const summary = results.map(r => ({
    name: r.name,
    distance_km: (r.totalDistance / 1000).toFixed(1),
    duration_min: Math.round(r.totalDuration / 60),
    terminal: r.terminal
  }));

  res.json({
    results,
    summary,
    stats: {
      processed,
      errors,
      total: routesData.length
    }
  });
});

// Health-check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API-сервер запущен на порту ${PORT}. OSRM доступен на 127.0.0.1:5000.`);
});