import { format, roundToNearestMinutes } from 'date-fns';
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
    const windSpeed = weatherData.current.wind_speed;
    const windDescription = getWindDescription(windSpeed, this.units);
    const tempUnits = this.units === 'metric' ? '°C' : '°F';

    this.temperatureNow.innerText = `${Math.round(weatherData.current.temp)}${tempUnits}`;
    this.weatherNow.innerText = weatherData.current.weather[0].description;
    this.feelsLike.innerText = `Feels Like ${Math.round(
      weatherData.current.feels_like,
    )}${tempUnits}`;
    this.windNow.innerText = windDescription;
  },
};

const rightWeatherDisplay = {
  async init() {
    this.data = await weatherForecast.getData();
    this.units = weatherForecast.getUnits();
    this.cacheDom();
    this.renderWeatherData();
  },

  cacheDom() {
    this.windSpeed = document.querySelector('.wind-speed');
    this.humidity = document.querySelector('.humidity');
    this.uvIndex = document.querySelector('.uv-index');
    this.chanceOfRain = document.querySelector('.chance-of-rain');
    this.visibility = document.querySelector('.visibility');
    this.cloudiness = document.querySelector('.cloudiness');
    this.sunrise = document.querySelector('.sunrise');
    this.sunset = document.querySelector('.sunset');
    this.pressure = document.querySelector('.pressure');
  },

  renderWeatherData() {
    const { weatherData } = this.data;
    const { sunrise, sunset } = weatherData.current;
    const timezoneOffset = weatherData.timezone_offset;
    const sunriseTime = this.getSunriseSunset(sunrise, timezoneOffset);
    const sunsetTime = this.getSunriseSunset(sunset, timezoneOffset);
    const speedUnits = this.units === 'metric' ? 'm/s' : 'mph';

    this.windSpeed.innerText = `${weatherData.current.wind_speed.toFixed(1)}${speedUnits}`;
    this.humidity.innerText = `${weatherData.current.humidity}%`;
    this.uvIndex.innerText = `${Math.round(weatherData.current.uvi)}`;
    this.chanceOfRain.innerText = `${weatherData.daily[0].pop * 100}%`;
    this.visibility.innerText = `${weatherData.current.visibility}m`;
    this.cloudiness.innerText = `${weatherData.current.clouds}%`;
    this.sunrise.innerText = sunriseTime;
    this.sunset.innerText = sunsetTime;
    this.pressure.innerText = `${weatherData.current.pressure}hPa`;
  },

  getSunriseSunset(unixTime, timezoneOffset) {
    const utcOffset = new Date().getTimezoneOffset() * 60;
    const time = new Date((unixTime + timezoneOffset + utcOffset) * 1000);
    const formattedTime = format(roundToNearestMinutes(time), 'h:mmaaa');

    return formattedTime;
  },
};

(() => {
  cityTimeDisplay.init();
  leftWeatherDisplay.init();
  rightWeatherDisplay.init();
})();
