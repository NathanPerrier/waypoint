import Device from './utils/device.js';
import { SessionToken, LngLatBounds } from '@mapbox/search-js-core';
import { isWithinSpecifiedBounds } from './utils/dom.js';
import { queryWeatherAPI } from './utils/weather.js';

const defaultUserLocation = [153.013306, -27.497503]; // great court

const initializeConfig = (app) => {

    app.initializationPromise = new Promise(async (resolve, reject) => {

        app.DEBUG = false;
        app.FEEDBACK = true;

        app.BASE_URL = 'https://uqunion.info/';
        app.FEEDBACK_URL = 'https://www.surveymonkey.com/r/H6SGDY8';

        app.BASE_WEATHER_API_URL = 'https://api.open-meteo.com/v1/';
        app.WEATHER_PARAMETERS = `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,wind_speed_10m&wind_speed_unit=ms`;

        app.PRIMARY_COLOR = "#782cf6";
        app.SECONDARY_COLOR = "#b694f2";
        app.COUNTRY = 'au';
        app.LANGUAGE = 'en';
        app.SESSION_TIMEOUT_HOURS = 12;
        app.NAVIGATION_DISTANCE_BUFFER = 2.5; //5m
        app.AR_SUGGESTION_RADIUS = 50; //500m
        app.ALTITUDE_SMOOTHING_FACTOR = 0.1 //0-1 
        app.LOOK_AHEAD_FACTOR = 0.125; //0-1
        app.RELATIVE_CAMERA_ALTITUDE = 20; //20m
        app.NOW = new Date().getTime();
        app.DEPARTURE_TIME = app.NOW ;
        app.TRANSPORTATION_MODE = "walking";
        app.DRIVING_ICON = "fa-solid fa-car";
        app.BIKING_ICON = "fa-solid fa-bicycle";
        app.WALKING_ICON = "fa-solid fa-person-walking";
        app.TRANSPORTATION_MODE_ICON = app.WALKING_ICON;
        app.SEARCH_TYPES = ['address', 'street', 'poi', 'place'];  //! TEST
        app.SEARCH_SUGGEST_TYPES = ['poi', 'place', 'category'];
        app.AR_SUGGESTIONS = [];
        app.PLACED_AR_SUGGESTIONS = {};
        app.START_LOCATION = null; 
        app.DESTINATION_LOCATION = null;
        app.DESTINATION_LOCATION_COORDINATES = null;
        app.DESTINATION_LOCATION_DATA = null;
        app.NAVIGATION_ROUTE_COORDINATES = null;
        app.NAVIGATION_ROUTE_STEPS = null;
        app.NAVIGATION_ROUTE_DATA = null;
        app.USER_LOCATION = null;
        app.WEATHER_DATA = null;

        //st lucia campus
        app.MAP_LOCATION_BOUNDS = new LngLatBounds([152.998221, -27.505890], [153.019359, -27.490149]); 
        app.MAPBOXGL_LOCATION_BOUNDS = new mapboxgl.LngLatBounds([152.998221, -27.505890], [153.019359, -27.490149]); 
        app.MAP_LOCATION_BOUNDS_LNGLATLIKE = [[152.998221, -27.505890], [153.019359, -27.490149]]; 

        // Herston Campus
        app.MAP_LOCATION_BOUNDS_HERSTON = new LngLatBounds([153.021008, -27.452443], [153.033357, -27.443910]); 
        app.MAPBOXGL_LOCATION_BOUNDS_HERSTON = new mapboxgl.LngLatBounds([153.021008, -27.452443], [153.033357, -27.443910]); 
        app.MAP_LOCATION_BOUNDS_LNGLATLIKE_HERSTON = [[153.021008, -27.452443], [153.033357, -27.443910]]; 

        // Gatton Campus
        app.MAP_LOCATION_BOUNDS_GATTON = new LngLatBounds([152.322731, -27.571017], [152.365451, -27.529145]); 
        app.MAPBOXGL_LOCATION_BOUNDS_GATTON = new mapboxgl.LngLatBounds([152.322731, -27.571017], [152.365451, -27.529145]); 
        app.MAP_LOCATION_BOUNDS_LNGLATLIKE_GATTON = [[152.322731, -27.571017], [152.365451, -27.529145]]; 

        app.MAP_LOCATION_CENTER = defaultUserLocation;
        app.MAP_COUNTRY_RESTRICTIONS = 'au';
        app.MAP_LIGHT_STYLE = 'mapbox://styles/mapbox/light-v11';
        app.MAP_3D_STYLE = 'mapbox://styles/mapbox/standard';
        app.MAP_SESSION_TOKEN = null; 
        app.MIN_SEARCH_LENGTH = 3; 

        //! fix --> import.meta.env.VITE_MAPBOX_ACCESS_TOKEN does work in prod
        app.MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? import.meta.env.VITE_MAPBOX_ACCESS_TOKEN : 'pk.eyJ1IjoibmF0aGFuLXBlcnJpZXIyMyIsImEiOiJjbWEzYWk4Zm0wc293MmpvazltbnVxNWZqIn0.CZY6oAZgkYGHvxlGmwcdQw'; // Set your Mapbox access token here
        
        app.DEVICE = null;
        app.WEBCAM_ENABLED = false;
        app.DESKTOP_DEVICE = false;
        app.LOCAR_CAMERA = null;
        app.RENDERER = null;
        app.LOCAR_CONTAINER = null;
        app.LOCAR_SCENE = null;
        app.LOCAR = null;
        app.DEVICE_ORIENTATION_CONTROLS = null;
        app.CAM = null;
        app.AR = true; 

        var setupTime = sessionStorage.getItem('setupTime');
        if (setupTime == null) {
            sessionStorage.setItem('setupTime', app.NOW)
        } else {
            if(app.NOW-setupTime > app.SESSION_TIMEOUT_HOURS*60*60*1000) {
                sessionStorage.clear()
                sessionStorage.setItem('setupTime', app.NOW);
            }
        }

        if (sessionStorage.getItem('mapbox_session_token')) {
            app.MAP_SESSION_TOKEN = sessionStorage.getItem('mapbox_session_token')
        } else {
            app.MAP_SESSION_TOKEN = new SessionToken(); // Fallback to a new session token
            sessionStorage.setItem('mapbox_session_token', app.MAP_SESSION_TOKEN);
        }

        try {
            // Parallelize geolocation and device detection
            const [userLocation, device] = await Promise.all([
                new Promise((resolve) => { // Removed reject as we always resolve with a location
                    navigator.geolocation.getCurrentPosition(
                        (position) => resolve([position.coords.longitude, position.coords.latitude]),
                        (error) => {
                            console.error("Failed to get user location:", error);
                            resolve(app.MAP_LOCATION_CENTER); // Default to center defined on app
                        }
                    );
                }),
                (async () => {
                    try {
                        const deviceInstance = new Device();
                        const webcamEnabled = await deviceInstance.detectWebcam();
                        return { deviceInstance, webcamEnabled };
                    } catch (error) {
                        console.error("Device initialization failed:", error);
                        // Provide a default mock device object if detection fails
                        return {
                            deviceInstance: {
                                detectWebcam: () => false,
                                isDesktop: () => true, // Assume desktop if detection fails
                                isTablet: () => false,
                            },
                            webcamEnabled: false,
                        };
                    }
                })(),
            ]);

            // Set values on the app instance
            app.USER_LOCATION = userLocation;
            app.START_LOCATION = { lng: userLocation[0], lat: userLocation[1] };
            app.DEVICE = device.deviceInstance;
            app.WEBCAM_ENABLED = device.webcamEnabled;
            app.DESKTOP_DEVICE = app.DEVICE.device.desktop;
            app.MOBILE_DEVICE = app.DEVICE.device.ios || app.DEVICE.device.android || app.DEVICE.device.iphone || app.DEVICE.device.androidChrome || app.DEVICE.device.cordova || app.DEVICE.device.ipad; 

            if (!app.MOBILE_DEVICE || !app.WEBCAM_ENABLED) {
                app.AR = false; 
            }

            if (isWithinSpecifiedBounds(app.USER_LOCATION, app.MAPBOXGL_LOCATION_BOUNDS_GATTON)) {
                console.log("User location is in Gatton Campus");
                app.MAP_LOCATION_BOUNDS = app.MAP_LOCATION_BOUNDS_GATTON;
                app.MAPBOXGL_LOCATION_BOUNDS = app.MAPBOXGL_LOCATION_BOUNDS_GATTON;
                app.MAP_LOCATION_BOUNDS_LNGLATLIKE = app.MAP_LOCATION_BOUNDS_LNGLATLIKE_GATTON;
            }

            if (isWithinSpecifiedBounds(app.USER_LOCATION, app.MAPBOXGL_LOCATION_BOUNDS_HERSTON)) {
                console.log("User location is in Herston Campus");
                app.MAP_LOCATION_BOUNDS = app.MAP_LOCATION_BOUNDS_HERSTON;
                app.MAPBOXGL_LOCATION_BOUNDS = app.MAPBOXGL_LOCATION_BOUNDS_HERSTON;
                app.MAP_LOCATION_BOUNDS_LNGLATLIKE = app.MAP_LOCATION_BOUNDS_LNGLATLIKE_HERSTON;
            }

            await queryWeatherAPI(app, app.USER_LOCATION[1], app.USER_LOCATION[0], app.BASE_WEATHER_API_URL, app.WEATHER_PARAMETERS);

            resolve();

        } catch (error) {
            console.error("Error initializing app config:", error);
            app.initializationError = true;
            reject(error);
        }

        if (app.DEBUG) {
            console.warn("APP DEBUG MODE ENABLED. TEST VALUES SET.");
            app.MAP_LOCATION_BOUNDS = null;
            app.MAPBOXGL_LOCATION_BOUNDS = null;
            app.MAP_LOCATION_BOUNDS_LNGLATLIKE = null; 

        }
    });

    return app.initializationPromise;
};

export { initializeConfig };

const app = window.app;

