// weatherApi.js
const axios = require('axios');

const apiKey = 'd8714bc4e7b44e9ebf0203621250204'; // Your WeatherAPI key

async function fetchWeather(city) {
  try {
    const apiUrl = `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`;
    const response = await axios.get(apiUrl);
    const data = response.data;

    return {
      city: data.location.name,
      temperature: data.current.temp_c + "°C",
      description: data.current.condition.text
    };
  } catch (error) {
    console.error('Weather fetch error:', error.message);
    return null;
  }
}

module.exports = fetchWeather;
