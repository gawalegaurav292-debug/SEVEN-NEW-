
import coreRagEngine from './core-rag-engine.js';

// Mock Weather & Calendar APIs for demo (Simulating external integrations)
async function fetchWeather(city) {
  // In prod: await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}`)
  return { temp: 65, condition: 'Clear' };
}

async function fetchCalendar(userId) {
  // In prod: Google Calendar API
  // Mock: 50% chance of meeting
  const hasMeeting = Math.random() > 0.5;
  return { events: hasMeeting ? ['Client Meeting at 10am'] : [] };
}

export async function generateMorningOutfit(userId, userPrefs = {}) {
  // Defaults if user not found/set
  const city = userPrefs.city || 'New York';
  const preferences = userPrefs;

  // 1. Context Gathering
  const weather = await fetchWeather(city);
  const calendar = await fetchCalendar(userId);

  // 2. Logic Layer
  const isCold = weather.temp < 60;
  const isRaining = weather.condition.toLowerCase().includes('rain');
  const isFormal = calendar.events.some(e => e.toLowerCase().includes('meeting'));

  const layer = isCold ? 'jacket' : 'shirt';
  const occasion = isFormal ? 'business casual' : 'casual';
  
  // 3. RAG Execution
  const outfitItems = await coreRagEngine.generate({
    gender: preferences.gender || 'men',
    product_type: layer,
    occasion,
    size: preferences.size,
    max_price: preferences.budget || 500
  });

  return {
    context: {
      weather: `${weather.temp}°F ${weather.condition}`,
      agenda: isFormal ? "Work Mode" : "Free Day",
      suggestion: `It's ${isCold ? 'chilly' : 'mild'}. ${isFormal ? 'Dress sharp.' : 'Stay comfy.'}`
    },
    items: outfitItems.slice(0, 3) // Return top 3 items
  };
}
