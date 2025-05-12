export async function displayWeather(app, $f7, weatherDiv) {
    if (app.WEATHER_DATA === null || app.WEATHER_DATA == undefined) {
        console.log('No weather data available. Fetching new data...');
        app.WEATHER_DATA = await queryWeatherAPI(app, $f7, app.USER_LOCATION[1], app.USER_LOCATION[0]);
    }

    console.log(app.WEATHER_DATA);

    const icon = getIconFromWeatherCode(app.WEATHER_DATA.current.weather_code, app.WEATHER_DATA.current.is_day) || { icon: '01d', description: 'Unknown' };
    console.log('Weather icon:', icon);
    weatherDiv.innerHTML = `
        <img id="weather-icon" src="https://openweathermap.org/img/wn/${icon.icon}@2x.png" alt="Weather Icon">
        <span class="ml-2" id="weather-text">${app.WEATHER_DATA.current.temperature_2m}°C</span>
    `;
    //<span id="weather-text-2">${icon.description}</span>
}

async function queryWeatherAPI(app, $f7, lat, lon) {
    const url = `${app.BASE_WEATHER_API_URL}forecast?latitude=${lat}&longitude=${lon}${app.WEATHER_PARAMETERS}`;
   const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fretch suggestions from Mapbox.');
    }
    return await response.json();
}

function getIconFromWeatherCode(weatherCode, isDay) {
    const weatherCodes = {
        0: { icon: isDay ? '01d' : '01n', description: 'Clear sky' },
        1: { icon: isDay ? '02d' : '02n', description: 'Few clouds' },
        2: { icon: isDay ? '03d' : '03n', description: 'Scattered clouds' },
        3: { icon: isDay ? '04d' : '04n', description: 'Broken clouds' },
        4: { icon: isDay ? '09d' : '09n', description: 'Shower rain' },
        5: { icon: isDay ? '10d' : '10n', description: 'Rain' },
        6: { icon: isDay ? '11d' : '11n', description: 'Thunderstorm' },
        7: { icon: isDay ? '13d' : '13n', description: 'Snow' },
        8: { icon: isDay ? '50d' : '50n', description: 'Mist' },
    };
    return weatherCodes[weatherCode] || null;
}