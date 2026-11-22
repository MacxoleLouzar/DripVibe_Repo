const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { city, date, time } = req.query;
    if (!city) return res.status(400).json({ message: 'City is required' });

    const geoRes = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
      params: { name: city, count: 1, language: 'en', format: 'json' },
    });

    const results = geoRes.data.results;
    if (!results || results.length === 0)
      return res.status(404).json({ message: `City "${city}" not found` });

    const { latitude, longitude, name, country, timezone } = results[0];

    const targetDate = date || null;
    const targetHour = time ? parseInt(time.split(':')[0], 10) : null;
    const isForecast = !!(targetDate && targetHour !== null);

    let weatherData;

    if (isForecast) {
      const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude,
          longitude,
          hourly: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m',
          wind_speed_unit: 'ms',
          timezone: timezone || 'auto',
          start_date: targetDate,
          end_date: targetDate,
        },
      });

      const hourly = weatherRes.data.hourly;
      const idx = hourly.time.findIndex(t => new Date(t).getHours() === targetHour);
      const i = idx >= 0 ? idx : 0;

      weatherData = {
        temp: hourly.temperature_2m[i],
        feels_like: hourly.apparent_temperature[i],
        weather_code: hourly.weather_code[i],
        wind: hourly.wind_speed_10m[i],
        humidity: hourly.relative_humidity_2m[i],
      };
    } else {
      const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude,
          longitude,
          current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m',
          wind_speed_unit: 'ms',
        },
      });

      const current = weatherRes.data.current;
      weatherData = {
        temp: current.temperature_2m,
        feels_like: current.apparent_temperature,
        weather_code: current.weather_code,
        wind: current.wind_speed_10m,
        humidity: current.relative_humidity_2m,
      };
    }

    const description = getWeatherDescription(weatherData.weather_code);
    const icon = getWeatherIcon(weatherData.weather_code);

    res.json({
      city: `${name}, ${country}`,
      temp: weatherData.temp,
      feels_like: weatherData.feels_like,
      description,
      icon,
      humidity: weatherData.humidity,
      wind: weatherData.wind,
      date: targetDate || new Date().toISOString().split('T')[0],
      time: time || new Date().toTimeString().slice(0, 5),
      isForecast,
    });
  } catch (err) {
    res.status(500).json({ message: 'Weather fetch failed', error: err.message });
  }
});

function getWeatherDescription(code) {
  const map = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Foggy', 48: 'Icy fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
    61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow',
    80: 'Slight showers', 81: 'Showers', 82: 'Heavy showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm',
  };
  return map[code] ?? 'Unknown';
}

function getWeatherIcon(code) {
  if (code === 0 || code === 1) return '☀️';
  if (code === 2 || code === 3) return '⛅';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 55) return '🌦️';
  if (code >= 61 && code <= 65) return '🌧️';
  if (code >= 71 && code <= 75) return '❄️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 95) return '⛈️';
  return '🌡️';
}

module.exports = router;
