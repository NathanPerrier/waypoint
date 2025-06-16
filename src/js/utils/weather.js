/**
 * dsiplays weather information in the app
 * 
 * @async
 * 
 * @param {Object} app - The application instance containing weather data and user location.
 * @param {Object} $f7 - The Framework7 instance for UI interactions.
 * 
 * @returns {Promise<string>} - A promise that resolves to a string containing the HTML for the weather display.
 * @throws {Error} - If the weather data cannot be fetched or if the weather icon cannot be determined.
 */
export async function displayWeather(app, $f7) {
    // check if weather data is already available, if not, fetch it
    if (app.WEATHER_DATA === null || app.WEATHER_DATA == undefined) {
        app.WEATHER_DATA = await queryWeatherAPI(app, app.USER_LOCATION[1], app.USER_LOCATION[0]);
    }

    // get the current weather icon
    const icon = getIconFromWeatherCode(app.WEATHER_DATA.current.weather_code, app.WEATHER_DATA.current.is_day) || { icon: '01d', description: 'Unknown' };

    // return HTML for displaying the weather icon and temperature
    return `
        <img id="weather-icon" src="https://openweathermap.org/img/wn/${icon.icon}@2x.png" alt="Weather Icon">
        <span class="ml-2" id="weather-text">${app.WEATHER_DATA.current.temperature_2m}°C</span>
    `;
}


/**
 * Queries the weather API for the current weather data based on latitude and longitude.
 * 
 * @async
 * 
 * @param {Object} app - The application instance containing the base URL and parameters for the weather API.
 * @param {number} lat - The latitude of the location to query.
 * @param {number} lon - The longitude of the location to query.
 * @param {string} [url=app.BASE_WEATHER_API_URL] - The base URL of the weather API.
 * @param {string} [params=app.WEATHER_PARAMETERS] - The parameters to append to the API request.
 * 
 * @returns {Promise<void>} - A promise that resolves when the weather data is successfully fetched and stored in the app instance.
 * @throws {Error} - If the fetch request fails or if the response is not ok.
 * 
 */
export async function queryWeatherAPI(app, lat, lon, url=app.BASE_WEATHER_API_URL, params=app.WEATHER_PARAMETERS) {
    // create the URL for the weather API request
    const urlReq = `${url}forecast?latitude=${lat}&longitude=${lon}${params}`;

    // Fetch the weather data from the API
    const response = await fetch(urlReq);

    // Check if the response is ok, if not throw an error
    if (!response.ok) {
        throw new Error('Failed to fretch suggestions from Mapbox.');
    }

    // Parse the response data and store it in the app instance
    app.WEATHER_DATA = await response.json();
}


/**
 * Returns the weather icon and description based on the weather code and whether it is day or night.
 * 
 * @param {number} weatherCode - The weather code representing the current weather condition.
 * @param {boolean} isDay - A boolean indicating whether it is day (true) or night (false).
 * 
 * @return {Object|null} - An object containing the icon and description of the weather condition, or null if the weather code is not recognized.
 * 
 */
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