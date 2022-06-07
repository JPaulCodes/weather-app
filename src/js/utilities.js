export const weatherApi = (() => {
  const API_KEY = '45ad5a2ec30a3a75a85bd6b599d588fb';

  // Gets latitude and longitude
  async function getCityCoordinates(cityName) {
    const response = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`,
    );
    const data = await response.json();

    return data;
  }

  // Retrieves weather data based on latitude / longitude
  async function getWeatherData({ lat, lon }, units) {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=${units}&exclude=minutely&appid=${API_KEY}`,
    );
    const data = await response.json();

    return data;
  }

  return {
    getCityCoordinates,
    getWeatherData,
  };
})();

// Wind descriptions taken from the Beaufort scale
export function getWindDescription(windSpeed, units) {
  let windDescription = '';
  let ms = 0;

  if (units === 'imperial') ms = windSpeed / 2.2369;
  else ms = windSpeed;

  if (ms < 0.5) {
    windDescription = 'Calm';
  } else if (ms < 1.6) {
    windDescription = 'Light Air';
  } else if (ms < 3.4) {
    windDescription = 'Light Breeze';
  } else if (ms < 5.6) {
    windDescription = 'Gentle Breeze';
  } else if (ms < 8) {
    windDescription = 'Moderate Breeze';
  } else if (ms < 10.8) {
    windDescription = 'Fresh Breeze';
  } else if (ms < 13.9) {
    windDescription = 'Strong Breeze';
  } else if (ms < 17.2) {
    windDescription = 'High Wind';
  } else if (ms < 20.8) {
    windDescription = 'Gale';
  } else if (ms < 24.5) {
    windDescription = 'Strong Gale';
  } else if (ms < 28.5) {
    windDescription = 'Storm';
  } else if (ms < 32.7) {
    windDescription = 'Violent Storm';
  } else if (ms >= 32.7) {
    windDescription = 'Hurricane';
  }

  return windDescription;
}

export function createElementFromHtml(htmlString) {
  const template = document.createElement('template');
  template.innerHTML = htmlString.trim();

  return template.content.firstElementChild;
}
