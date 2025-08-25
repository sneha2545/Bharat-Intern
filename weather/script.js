const API_KEY = "3045dd712ffe6e702e3245525ac7fa38";
const BASE_URL = "https://api.openweathermap.org/data/2.5/";

const cityInput = document.getElementById('cityinput');
const searchBtn = document.getElementById('searchBtn');
const toggleUnitBtn = document.getElementById('toggleUnit');
const errorMessage = document.getElementById('error-message');
const loading = document.getElementById('loading');
const cityOutput = document.getElementById('cityoutput');
const weatherIcon = document.getElementById('weather-icon');
const description = document.getElementById('description');
const temp = document.getElementById('temp');
const humidity = document.getElementById('humidity');
const pressure = document.getElementById('pressure');
const wind = document.getElementById('wind');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const forecastCards = document.getElementById('forecast-cards');
const recentSearchesList = document.getElementById('recent-searches-list');
const modeToggle = document.getElementById('mode-toggle');

let isCelsius = true;
let recentSearches = [];

function showLoading(show) {
  loading.style.display = show ? 'block' : 'none';
}
function showError(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = msg ? 'block' : 'none';
}
function clearError() {
  errorMessage.textContent = '';
  errorMessage.style.display = 'none';
}

function saveRecent(city) {
  if (!recentSearches.includes(city)) {
    recentSearches.unshift(city);
    if (recentSearches.length > 5) recentSearches.pop();
  }
  renderRecentSearches();
}
function renderRecentSearches() {
  recentSearchesList.innerHTML = '';
  recentSearches.forEach(item => {
    const span = document.createElement('span');
    span.textContent = item;
    span.className = 'recent-search-item';
    span.onclick = () => {
      cityInput.value = item;
      fetchWeatherByCity(item);
    };
    recentSearchesList.appendChild(span);
  });
}

toggleUnitBtn.addEventListener('click', () => {
  isCelsius = !isCelsius;
  if (cityOutput.textContent) {
    fetchWeatherByCity(cityInput.value);
  }
});

modeToggle && modeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  modeToggle.textContent = document.body.classList.contains('dark') ? '☀️' : '🌙';
});

window.addEventListener('DOMContentLoaded', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos => {
      fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    }, () => {
      fetchWeatherByCity('Delhi');
    });
  } else {
    fetchWeatherByCity('Delhi');
  }
});

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (!city) {
    showError('Please enter a city name.');
    return;
  }
  fetchWeatherByCity(city);
});

function fetchWeatherByCity(city) {
  clearError();
  showLoading(true);
  fetch(`${BASE_URL}weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`)
    .then(res => res.json())
    .then(data => {
      showLoading(false);
      if (data.cod !== 200) {
        showError('City not found. Please check the name.');
        return;
      }
      saveRecent(city);
      renderCurrentWeather(data);
      fetchForecast(data.coord.lat, data.coord.lon);
    })
    .catch(() => { showLoading(false); showError('Network error. Please try again.'); });
}

function fetchWeatherByCoords(lat, lon) {
  clearError();
  showLoading(true);
  fetch(`${BASE_URL}weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
    .then(res => res.json())
    .then(data => {
      showLoading(false);
      if (data.cod !== 200) {
        showError('Location not found.');
        return;
      }
      saveRecent(data.name);
      renderCurrentWeather(data);
      fetchForecast(lat, lon);
    })
    .catch(() => { showLoading(false); showError('Network error. Please try again.'); });
}

function renderCurrentWeather(data) {
  cityOutput.textContent = `${data.name}, ${data.sys.country}`;
  description.textContent = `Condition: ${data.weather[0].description}`;
  temp.textContent = isCelsius ? `Temperature: ${Math.round(data.main.temp)}°C` : `Temperature: ${Math.round(data.main.temp * 9/5 + 32)}°F`;
  humidity.textContent = `Humidity: ${data.main.humidity}%`;
  pressure.textContent = `Pressure: ${data.main.pressure} hPa`;
  wind.textContent = `Wind: ${data.wind.speed} m/s`;
  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  weatherIcon.style.display = 'inline-block';
  sunrise.textContent = `Sunrise: ${formatTime(data.sys.sunrise, data.timezone)}`;
  sunset.textContent = `Sunset: ${formatTime(data.sys.sunset, data.timezone)}`;
}

function formatTime(ts, tzOffset) {
  const date = new Date((ts + tzOffset) * 1000);
  return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function fetchForecast(lat, lon) {
  fetch(`${BASE_URL}forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
    .then(res => res.json())
    .then(data => {
      renderForecast(data);
    });
}

function renderForecast(data) {
  // Group by day
  const days = {};
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    if (!days[day]) days[day] = [];
    days[day].push(item);
  });
  // Only next 5 days
  const dayKeys = Object.keys(days).slice(0, 5);
  forecastCards.innerHTML = '';
  dayKeys.forEach(day => {
    const items = days[day];
    // Get min/max temp and midday icon
    let min = 100, max = -100, icon = '', desc = '';
    items.forEach(i => {
      if (i.main.temp < min) min = i.main.temp;
      if (i.main.temp > max) max = i.main.temp;
    });
    const midday = items[Math.floor(items.length/2)];
    icon = midday.weather[0].icon;
    desc = midday.weather[0].description;
    const card = document.createElement('div');
    card.className = 'forecast-card';
    card.innerHTML = `
      <div>${day}</div>
      <img src="https://openweathermap.org/img/wn/${icon}.png" alt="icon">
      <div>${desc}</div>
      <div>Min: ${Math.round(min)}°C</div>
      <div>Max: ${Math.round(max)}°C</div>
    `;
    forecastCards.appendChild(card);
  });
}