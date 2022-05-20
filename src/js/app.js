import { format, roundToNearestMinutes } from 'date-fns';
import { weatherApi, getWindDescription, createElementFromHtml } from './utilities';

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

  async updateUnits() {
    this.data = await weatherForecast.getData();
    this.renderCityTimeData();
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

  async updateUnits() {
    this.data = await weatherForecast.getData();
    this.units = weatherForecast.getUnits();
    this.renderWeatherData();
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

  async updateUnits() {
    this.data = await weatherForecast.getData();
    this.units = weatherForecast.getUnits();
    this.renderWeatherData();
  },
};

const dailyWeatherDisplay = {
  async init() {
    this.data = await weatherForecast.getData();
    this.units = weatherForecast.getUnits();
    this.cacheDom();
    this.renderWeatherData();
  },

  cacheDom() {
    this.dailyForecastContainer = document.querySelector('.daily-forecast-container');
  },

  renderWeatherData() {
    const { weatherData } = this.data;
    const dailyData = weatherData.daily.slice(1, -1);
    const utcOffset = new Date().getTimezoneOffset() * 60;
    const timezoneOffset = weatherData.timezone_offset;
    const tempUnits = this.units === 'metric' ? '°C' : '°F';

    dailyData.forEach((day) => {
      const date = new Date((day.dt + timezoneOffset + utcOffset) * 1000);
      const formattedDate = format(date, 'EEEE');
      const element = createElementFromHtml(`
        <div class="daily-weather">
          <div class="day">${formattedDate}</div>
          <div class="highs">${Math.round(day.temp.max)}${tempUnits}</div>
          <div class="lows">${Math.round(day.temp.min)}${tempUnits}</div>
        </div>
      `);

      this.dailyForecastContainer.appendChild(element);
    });
  },

  async updateUnits() {
    this.data = await weatherForecast.getData();
    this.units = weatherForecast.getUnits();
    this.dailyForecastContainer.replaceChildren();
    this.renderWeatherData();
  },
};

const hourlyWeatherDisplay = {
  async init() {
    this.data = await weatherForecast.getData();
    this.units = weatherForecast.getUnits();
    this.cacheDom();
    this.renderWeatherData();
  },

  cacheDom() {
    this.hourlyContainerOne = document.querySelector('.hourly-container-one');
    this.hourlyContainerTwo = document.querySelector('.hourly-container-two');
    this.hourlyContainerThree = document.querySelector('.hourly-container-three');
  },

  renderWeatherData() {
    const { weatherData } = this.data;
    const hourlyData = weatherData.hourly.slice(1, 25);
    const utcOffset = new Date().getTimezoneOffset() * 60;
    const timezoneOffset = weatherData.timezone_offset;
    const tempUnits = this.units === 'metric' ? '°C' : '°F';
    const elements = [];

    hourlyData.forEach((hour) => {
      const time = new Date((hour.dt + timezoneOffset + utcOffset) * 1000);
      const formattedTime = format(time, 'h:mmaaa');
      const element = createElementFromHtml(`
        <div class="hourly-weather">
          <div class="time">${formattedTime}</div>
          <div class="hourly-temperature">${Math.round(hour.temp)}${tempUnits}</div>
          <div class="hourly-weather-icon">Icon</div>
        </div>
      `);

      elements.push(element);
    });

    this.hourlyContainerOne.append(...elements.slice(0, 8));
    this.hourlyContainerTwo.append(...elements.slice(8, 16));
    this.hourlyContainerThree.append(...elements.slice(16, 24));
  },

  async updateUnits() {
    this.data = await weatherForecast.getData();
    this.units = weatherForecast.getUnits();
    this.hourlyContainerOne.replaceChildren();
    this.hourlyContainerTwo.replaceChildren();
    this.hourlyContainerThree.replaceChildren();
    this.renderWeatherData();
  },
};

const dailyHourlyControls = {
  init() {
    this.cacheDom();
    this.bindEvents();
  },

  cacheDom() {
    this.dailyForecastButton = document.querySelector('.daily-forecast-button');
    this.hourlyForecastButton = document.querySelector('.hourly-forecast-button');
    this.hoursDisplayControls = document.querySelector('.hours-display-controls');
    this.dailyForecastContainer = document.querySelector('.daily-forecast-container');
    this.hourlyForecastContainer = document.querySelector('.hourly-forecast-container');
  },

  bindEvents() {
    this.dailyForecastButton.addEventListener('click', () => {
      this.setDailyForecastActive();
    });
    this.hourlyForecastButton.addEventListener('click', () => {
      this.setHourlyForecastActive();
    });
  },

  setDailyForecastActive() {
    this.hourlyForecastContainer.classList.remove('active');
    this.hoursDisplayControls.classList.remove('active');
    this.dailyForecastContainer.classList.add('active');
  },

  setHourlyForecastActive() {
    this.dailyForecastContainer.classList.remove('active');
    this.hourlyForecastContainer.classList.add('active');
    this.hoursDisplayControls.classList.add('active');
  },
};

const hoursDisplayControls = {
  init() {
    this.index = 0;
    this.cacheDom();
    this.bindEvents();
  },

  cacheDom() {
    this.hourlyForecastContainers = document.querySelectorAll('[class^="hourly-container"]');
    this.navigationButtons = document.querySelectorAll('.change-displayed-hours');
  },

  bindEvents() {
    this.navigationButtons.forEach((button) => {
      button.addEventListener('click', (event) => {
        this.changeDisplayedHours(event);
      });
    });
  },

  changeDisplayedHours(event) {
    if (event.target.classList.contains('index')) {
      this.index = Number(event.target.dataset.index);
    } else if (event.target.classList.contains('left') && this.index > 0) {
      this.index -= 1;
    } else if (event.target.classList.contains('right') && this.index < 2) {
      this.index += 1;
    }

    this.hourlyForecastContainers.forEach((container) => container.classList.remove('active'));
    this.hourlyForecastContainers[this.index].classList.add('active');
  },
};

const metricImperialControls = {
  async init() {
    this.cacheDom();
    this.bindEvents();
  },

  cacheDom() {
    this.displayMetricButton = document.querySelector('.display-metric-button');
    this.displayImperialButton = document.querySelector('.display-imperial-button');
  },

  bindEvents() {
    this.displayMetricButton.addEventListener('click', () => {
      if (weatherForecast.getUnits() === 'imperial') {
        weatherForecast.setUnits('metric');
        this.updateAllUnits();
      }
    });
    this.displayImperialButton.addEventListener('click', () => {
      if (weatherForecast.getUnits() === 'metric') {
        weatherForecast.setUnits('imperial');
        this.updateAllUnits();
      }
    });
  },

  updateAllUnits() {
    cityTimeDisplay.updateUnits();
    leftWeatherDisplay.updateUnits();
    rightWeatherDisplay.updateUnits();
    dailyWeatherDisplay.updateUnits();
    hourlyWeatherDisplay.updateUnits();
  },
};

(() => {
  cityTimeDisplay.init();
  leftWeatherDisplay.init();
  rightWeatherDisplay.init();
  dailyWeatherDisplay.init();
  hourlyWeatherDisplay.init();
  dailyHourlyControls.init();
  hoursDisplayControls.init();
  metricImperialControls.init();
})();
