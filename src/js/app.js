import { format } from 'date-fns';
import { weatherApi, getWindDescription } from './utilities';

const weatherForecast = (() => {
  let currentCity = 'london';
  let currentUnits = 'metric';

  async function fetchAllData() {
    const [city] = await weatherApi.getCityCoordinates(currentCity);
    const weatherData = await weatherApi.getWeatherData(city, currentUnits);

    return { city, weatherData };
  }

  return {
    setCity(city) {
      currentCity = city;
    },
    setUnits(units) {
      currentUnits = units;
    },
    getData() {
      return fetchAllData();
    },
    getUnits() {
      return currentUnits;
    },
  };
})();

const cityTimeDisplay = {
  async init() {
    this.data = await weatherForecast.getData();
    this.cacheDom();
    this.renderCityTimeData();
  },

  cacheDom() {
    this.cityName = document.querySelector('.city-name');
    this.localTime = document.querySelector('.local-time');
  },

  renderCityTimeData() {
    const { city, weatherData } = this.data;
    const { dt } = weatherData.current;
    const timezoneOffset = weatherData.timezone_offset;
    const localTime = this.calculateLocalTime(dt, timezoneOffset);

    this.cityName.innerText = `${city.name}, ${city.country}`;
    this.localTime.innerText = localTime;
  },

  calculateLocalTime(unixTime, timezoneOffset) {
    const utcOffset = new Date().getTimezoneOffset() * 60;
    const time = new Date((unixTime + timezoneOffset + utcOffset) * 1000);
    const formattedTime = format(time, 'EEEE d MMMM yyyy | h:mmaaa');

    return formattedTime;
  },
};

const leftWeatherDisplay = {
  async init() {
    this.data = await weatherForecast.getData();
    this.units = weatherForecast.getUnits();
    this.cacheDom();
    this.renderWeatherData();
  },

  cacheDom() {
    this.temperatureNow = document.querySelector('.temperature-now');
    this.weatherNow = document.querySelector('.weather-now');
    this.feelsLike = document.querySelector('.feels-like');
    this.windNow = document.querySelector('.wind-now');
  },

  renderWeatherData() {
    const { weatherData } = this.data;
    const tempUnits = this.units === 'metric' ? '°C' : '°F';
    const windSpeed = weatherData.current.wind_speed;
    const windDescription = getWindDescription(windSpeed, this.units);

    this.temperatureNow.innerText = `${Math.round(weatherData.current.temp)}${tempUnits}`;
    this.weatherNow.innerText = weatherData.current.weather[0].description;
    this.feelsLike.innerText = `Feels Like ${Math.round(
      weatherData.current.feels_like,
    )}${tempUnits}`;
    this.windNow.innerText = windDescription;
  },
};

(() => {
  cityTimeDisplay.init();
  leftWeatherDisplay.init();
})();
