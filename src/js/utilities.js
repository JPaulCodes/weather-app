const weatherApi = (() => {
  const apiKey = '45ad5a2ec30a3a75a85bd6b599d588fb';

  async function getCityCoordinates(cityName) {
    const response = await fetch(
      `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${apiKey}`,
    );
    const data = await response.json();

    return data;
  }

  async function getWeatherData({ lat, lon }, units) {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=${units}&exclude=minutely&appid=${apiKey}`,
    );
    const data = await response.json();

    return data;
  }

  return {
    getCityCoordinates,
    getWeatherData,
  };
})();

function createElementFromHtml(htmlString) {
  const template = document.createElement('template');
  template.innerHTML = htmlString.trim();

  return template.content.firstElementChild;
}

export { weatherApi, createElementFromHtml };
