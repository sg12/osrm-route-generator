const axios = require('axios');
const fs = require('fs');

// 🎯 КООРДИНАТЫ ВОКЗАЛА НОВОСИБИРСКА (дорога рядом с вокзалом)
const vokzal = [55.041566, 83.026464]; // [lat, lon]

// 🗺️ ТЕСТОВЫЙ МАРШРУТ - только Новосибирск → Белово
const routesData = [
  { 
    coords: [vokzal, [54.4128, 86.31216]], // Белово
    name: 'Новосибирск (Вокзал) → Белово'
  }
];

const OSRM_URL = 'http://127.0.0.1:5000/route/v1/driving/';
const results = [];

async function generateAll() {
  console.log(`🚀 Начинаем генерацию тестового маршрута...`);

  for (let i = 0; i < routesData.length; i++) {
    const [[lat1, lon1], [lat2, lon2]] = routesData[i].coords;
    const waypoints = `${lon1},${lat1};${lon2},${lat2}`;
    
    // Тестируем с разными параметрами
    const url = `${OSRM_URL}${waypoints}?overview=full&geometries=geojson&steps=true`;

    console.log(`\n📍 Исходные координаты:`);
    console.log(`   Старт (Вокзал): ${lat1}, ${lon1}`);
    console.log(`   Финиш (Белово): ${lat2}, ${lon2}`);
    console.log(`\n📍 URL запроса: ${url}`);

    try {
      const { data } = await axios.get(url, { timeout: 10000 });
      
      if (data.code !== 'Ok') {
        console.warn(`⚠️  OSRM error: ${data.code}`);
        continue;
      }

      const route = data.routes[0];
      
      // Получаем фактические точки маршрута
      const startPoint = route.geometry.coordinates[0];
      const endPoint = route.geometry.coordinates[route.geometry.coordinates.length - 1];
      
      console.log(`\n📊 РЕЗУЛЬТАТ:`);
      console.log(`   ✓ Расстояние: ${(route.distance / 1000).toFixed(1)} км`);
      console.log(`   ✓ Время: ${Math.round(route.duration / 60)} мин`);
      
      console.log(`\n🔍 АНАЛИЗ СМЕЩЕНИЯ:`);
      console.log(`   Заданная начальная точка: [${lat1}, ${lon1}]`);
      console.log(`   Фактическая начальная:    [${startPoint[1].toFixed(6)}, ${startPoint[0].toFixed(6)}]`);
      
      // Считаем примерное смещение в метрах (грубая формула)
      const startOffset = Math.sqrt(
        Math.pow((lat1 - startPoint[1]) * 111000, 2) + 
        Math.pow((lon1 - startPoint[0]) * 111000 * Math.cos(lat1 * Math.PI / 180), 2)
      );
      console.log(`   Смещение старта: ~${Math.round(startOffset)} метров`);
      
      console.log(`\n   Заданная конечная точка:  [${lat2}, ${lon2}]`);
      console.log(`   Фактическая конечная:      [${endPoint[1].toFixed(6)}, ${endPoint[0].toFixed(6)}]`);
      
      const endOffset = Math.sqrt(
        Math.pow((lat2 - endPoint[1]) * 111000, 2) + 
        Math.pow((lon2 - endPoint[0]) * 111000 * Math.cos(lat2 * Math.PI / 180), 2)
      );
      console.log(`   Смещение финиша: ~${Math.round(endOffset)} метров`);

      // Информация от OSRM о waypoints
      if (data.waypoints) {
        console.log(`\n📌 OSRM Waypoints:`);
        data.waypoints.forEach((wp, idx) => {
          console.log(`   ${idx === 0 ? 'Старт' : 'Финиш'}: [${wp.location[1].toFixed(6)}, ${wp.location[0].toFixed(6)}]`);
          console.log(`           Имя: ${wp.name || 'не указано'}`);
          console.log(`           Смещение от запроса: ${wp.distance?.toFixed(1) || 0} м`);
        });
      }

      results.push({
        routeId: i + 1,
        name: routesData[i].name,
        fullGeometry: route.geometry.coordinates,
        totalDistance: route.distance,
        totalDuration: route.duration,
        analysis: {
          start_offset_meters: Math.round(startOffset),
          end_offset_meters: Math.round(endOffset),
          waypoints_info: data.waypoints
        }
      });

    } catch (error) {
      console.error(`❌ Ошибка:`, error.message);
    }
  }

  // Сохраняем результат
  const outputDir = './output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = `${outputDir}/test_belovo.json`;
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n💾 Сохранено в ${outputPath}`);
}

// ▶️ Запуск
generateAll();