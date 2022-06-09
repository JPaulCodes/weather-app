import { format, roundToNearestMinutes } from 'date-fns';
import { weatherApi, getWindDescription, createElementFromHtml } from './utilities';

// Handles fetching location specific weather data from OpenWeather
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
    getUnits() {
      return currentUnits;
    },
    getData() {
      return fetchAllData();
    },
  };
})();

// Displays city name, country and local time
const cityTimeDisplay = {
  async init() {
    await this.getData();
    this.cacheDom();
    this.renderCityTimeData();
  },

  async getData() {
    this.data = await weatherForecast.getData();
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

  // Applies an offset to computer time to get UTC time, then converted to a locations local time
  calculateLocalTime(unixTime, timezoneOffset) {
    const utcOffset = new Date().getTimezoneOffset() * 60;
    const time = new Date((unixTime + timezoneOffset + utcOffset) * 1000);
    const formattedTime = format(time, 'EEEE d MMMM yyyy | h:mmaaa');

    return formattedTime;
  },

  async updateDisplay() {
    await this.getData();
    this.renderCityTimeData();
  },
};

// Handles left side of the main central display
const leftWeatherDisplay = {
  async init() {
    await this.getData();
    this.cacheDom();
    this.renderWeatherData();
  },

  async getData() {
    this.data = await weatherForecast.getData();
    this.units = weatherForecast.getUnits();
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
    this.feelsLike.innerText = `Feels Like ${Math.round(weatherData.current.feels_like)}${tempUnits}`;
    this.windNow.innerText = windDescription;
  },

  async updateDisplay() {
    await this.getData();
    this.renderWeatherData();
  },
};

// Handles all other weather data which is shown on the right side of the main display
const rightWeatherDisplay = {
  async init() {
    await this.getData();
    this.cacheDom();
    this.renderWeatherData();
  },

  async getData() {
    this.data = await weatherForecast.getData();
    this.units = weatherForecast.getUnits();
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

  // Applies an offset to computer time to get UTC time, then converted to a locations local time
  getSunriseSunset(unixTime, timezoneOffset) {
    const utcOffset = new Date().getTimezoneOffset() * 60;
    const time = new Date((unixTime + timezoneOffset + utcOffset) * 1000);
    const formattedTime = format(roundToNearestMinutes(time), 'h:mmaaa');

    return formattedTime;
  },

  async updateDisplay() {
    await this.getData();
    this.renderWeatherData();
  },
};

// Controls the bottom display which shows the weekly weather forecast
const dailyWeatherDisplay = {
  async init() {
    await this.getData();
    this.cacheDom();
    this.renderWeatherData();
  },

  async getData() {
    this.data = await weatherForecast.getData();
    this.units = weatherForecast.getUnits();
  },

  cacheDom() {
    this.dailyForecastContainer = document.querySelector('.daily-forecast-container');
  },

  renderWeatherData() {
    const { weatherData } = this.data;
    const dailyData = weatherData.daily.slice(1, -1);

    // Timezone offset needs to be applied to get correct dates and times for a location
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

  async updateDisplay() {
    await this.getData();
    this.dailyForecastContainer.replaceChildren();
    this.renderWeatherData();
  },
};

// Handles the bottom display which shows weather forecast data by hour in 8hr blocks
const hourlyWeatherDisplay = {
  async init() {
    await this.getData();
    this.cacheDom();
    this.renderWeatherData();
  },

  async getData() {
    this.data = await weatherForecast.getData();
    this.units = weatherForecast.getUnits();
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

    // 24hr block of time is split into three 8hr blocks
    this.hourlyContainerOne.append(...elements.slice(0, 8));
    this.hourlyContainerTwo.append(...elements.slice(8, 16));
    this.hourlyContainerThree.append(...elements.slice(16, 24));
  },

  emptyContainers() {
    this.hourlyContainerOne.replaceChildren();
    this.hourlyContainerTwo.replaceChildren();
    this.hourlyContainerThree.replaceChildren();
  },

  async updateDisplay() {
    await this.getData();
    this.emptyContainers();
    this.renderWeatherData();
  },
};

// User controls that allow switching between weekly and hourly weather forecast
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
    this.hourlyForecastButton.classList.remove('active-forecast');
    this.hourlyForecastContainer.classList.remove('active');
    this.hoursDisplayControls.classList.remove('active');
    this.dailyForecastButton.classList.add('active-forecast');
    this.dailyForecastContainer.classList.add('active');
  },

  setHourlyForecastActive() {
    this.dailyForecastButton.classList.remove('active-forecast');
    this.dailyForecastContainer.classList.remove('active');
    this.hourlyForecastButton.classList.add('active-forecast');
    this.hourlyForecastContainer.classList.add('active');
    this.hoursDisplayControls.classList.add('active');
  },
};

// User controls that allow switching between hourly forecast data
const hoursDisplayControls = {
  init() {
    this.index = 0;
    this.cacheDom();
    this.bindEvents();
  },

  cacheDom() {
    this.hourlyForecastContainers = document.querySelectorAll('.hourly-forecast-container > *');
    this.navigationButtons = document.querySelectorAll('.change-displayed-hours');
  },

  bindEvents() {
    this.navigationButtons.forEach((button) => {
      button.addEventListener('click', (e) => {
        this.changeDisplayedHours(e);
      });
    });
  },

  // Uses index of clicked buttons to display the corresponding time block
  changeDisplayedHours(e) {
    this.clearActiveDot();
    this.clearActiveContainer();

    const { action } = e.currentTarget.dataset;

    if (action === 'index') {
      this.index = Number(e.currentTarget.dataset.index);
    } else if (action === 'left' && this.index > 0) {
      this.index -= 1;
    } else if (action === 'right' && this.index < 2) {
      this.index += 1;
    }

    this.navigationButtons[this.index + 1].classList.add('active-container-dot');
    this.hourlyForecastContainers[this.index].classList.add('active');
  },

  clearActiveDot() {
    this.navigationButtons.forEach((button) => {
      button.classList.remove('active-container-dot');
    });
  },

  clearActiveContainer() {
    this.hourlyForecastContainers.forEach((container) => {
      container.classList.remove('active');
    });
  },
};

const searchWeather = {
  init() {
    this.cacheDom();
    this.bindEvents();
  },

  cacheDom() {
    this.searchInput = document.querySelector('.search-input');
    this.searchForm = document.querySelector('.search-form');
  },

  bindEvents() {
    this.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.search();
      this.updateAllDisplays();
    });
  },

  search() {
    const cityName = this.searchInput.value;
    weatherForecast.setCity(cityName);
  },

  updateAllDisplays() {
    cityTimeDisplay.updateDisplay();
    leftWeatherDisplay.updateDisplay();
    rightWeatherDisplay.updateDisplay();
    dailyWeatherDisplay.updateDisplay();
    hourlyWeatherDisplay.updateDisplay();
  },
};

// Handles changing the displayed units between metric and imperial
const metricImperialControls = {
  async init() {
    this.cacheDom();
    this.bindEvents();
    this.currentUnits = 'metric';
  },

  cacheDom() {
    this.displayMetricButton = document.querySelector('.display-metric-button');
    this.displayImperialButton = document.querySelector('.display-imperial-button');
  },

  bindEvents() {
    this.displayMetricButton.addEventListener('click', () => {
      if (this.currentUnits === 'imperial') {
        this.currentUnits = 'metric';
        this.updateUnits();
        this.displayMetricButton.classList.add('active-units');
        this.displayImperialButton.classList.remove('active-units');
      }
    });

    this.displayImperialButton.addEventListener('click', () => {
      if (this.currentUnits === 'metric') {
        this.currentUnits = 'imperial';
        this.updateUnits();
        this.displayMetricButton.classList.remove('active-units');
        this.displayImperialButton.classList.add('active-units');
      }
    });
  },

  updateUnits() {
    weatherForecast.setUnits(this.currentUnits);
    cityTimeDisplay.updateDisplay();
    leftWeatherDisplay.updateDisplay();
    rightWeatherDisplay.updateDisplay();
    dailyWeatherDisplay.updateDisplay();
    hourlyWeatherDisplay.updateDisplay();
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
  searchWeather.init();
  metricImperialControls.init();
})();
