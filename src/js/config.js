import Device from './utils/device.js';
import { SessionToken, LngLatBounds } from '@mapbox/search-js-core';
import { isWithinSpecifiedBounds } from './utils/dom.js';


// Default values (can be overridden during initialization)
const defaultUserLocation = [153.013306, -27.497503]; // great court

const initializeConfig = (app) => {
    // Create a promise that resolves when initialization is done
    app.initializationPromise = new Promise(async (resolve, reject) => {
        // Set default values on the app instance first

        app.DEBUG = false;
        app.FEEDBACK = true;

        app.FEEDBACK_URL = 'https://www.surveymonkey.com/r/H6SGDY8';
        app.PRIMARY_COLOR = "#782cf6";
        app.SECONDARY_COLOR = "#b694f2";
        app.COUNTRY = 'au';
        app.LANGUAGE = 'en';
        app.SESSION_TIMEOUT_HOURS = 12;
        app.NAVIGATION_DISTANCE_BUFFER = 5; //5
        app.NOW = new Date().getTime();
        app.DEPARTURE_TIME = app.NOW ;
        app.TRANSPORTATION_MODE = "walking";
        app.DRIVING_ICON = "fa-solid fa-car";
        app.BIKING_ICON = "fa-solid fa-bicycle";
        app.WALKING_ICON = "fa-solid fa-person-walking";
        app.TRANSPORTATION_MODE_ICON = app.WALKING_ICON;
        app.START_LOCATION = null; 
        app.DESTINATION_LOCATION = null;
        app.DESTINATION_LOCATION_COORDINATES = null;
        app.DESTINATION_LOCATION_DATA = null;
        app.NAVIGATION_ROUTE_COORDINATES = null;
        app.NAVIGATION_ROUTE_STEPS = null;
        app.NAVIGATION_ROUTE_DATA = null;
        app.USER_LOCATION = null;

        //st lucia campus
        app.MAP_LOCATION_BOUNDS = new LngLatBounds([152.998221, -27.505890], [153.019359, -27.490149]); // st lucia campus
        app.MAPBOXGL_LOCATION_BOUNDS = new mapboxgl.LngLatBounds([152.998221, -27.505890], [153.019359, -27.490149]); // st lucia campus
        app.MAP_LOCATION_BOUNDS_LNGLATLIKE = [[152.998221, -27.505890], [153.019359, -27.490149]]; // st lucia campus

        // Herston Campus
        app.MAP_LOCATION_BOUNDS_HERSTON = new LngLatBounds([152.992, -27.500], [153.002, -27.490]); // herston campus
        app.MAPBOXGL_LOCATION_BOUNDS_HERSTON = new mapboxgl.LngLatBounds([152.992, -27.500], [153.002, -27.490]); // herston campus
        app.MAP_LOCATION_BOUNDS_LNGLATLIKE_HERSTON = [[152.992, -27.500], [153.002, -27.490]]; // herston campus

        // Gatton Campus
        app.MAP_LOCATION_BOUNDS_GATTON = new LngLatBounds([152.500, -27.500], [152.600, -27.490]); // gatton campus
        app.MAPBOXGL_LOCATION_BOUNDS_GATTON = new mapboxgl.LngLatBounds([152.500, -27.500], [152.600, -27.490]); // gatton campus
        app.MAP_LOCATION_BOUNDS_LNGLATLIKE_GATTON = [[152.500, -27.500], [152.600, -27.490]]; // gatton campus

        app.MAP_LOCATION_CENTER = defaultUserLocation;
        app.MAP_COUNTRY_RESTRICTIONS = 'au';
        app.MAP_LIGHT_STYLE = 'mapbox://styles/mapbox/light-v11';
        app.MAP_3D_STYLE = 'mapbox://styles/mapbox/standard';
        app.MAP_SESSION_TOKEN = null; 
        app.MIN_SEARCH_LENGTH = 3; 

        //fix --> import.meta.env.VITE_MAPBOX_ACCESS_TOKEN does work in prod
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

            // Conditionally load libraries for mobile
            if (!app.MOBILE_DEVICE || !app.WEBCAM_ENABLED) {
                app.AR = false; // Disable AR mode for desktop
            }

            if (isWithinSpecifiedBounds(app.USER_LOCATION, app.MAPBOXGL_LOCATION_BOUNDS_GATTON)) {
                app.MAP_LOCATION_BOUNDS = app.MAP_LOCATION_BOUNDS_GATTON;
                app.MAPBOXGL_LOCATION_BOUNDS = app.MAPBOXGL_LOCATION_BOUNDS_GATTON;
                app.MAP_LOCATION_BOUNDS_LNGLATLIKE = app.MAP_LOCATION_BOUNDS_LNGLATLIKE_GATTON;
            }

            if (isWithinSpecifiedBounds(app.USER_LOCATION, app.MAPBOXGL_LOCATION_BOUNDS_HERSTON)) {
                app.MAP_LOCATION_BOUNDS = app.MAP_LOCATION_BOUNDS_HERSTON;
                app.MAPBOXGL_LOCATION_BOUNDS = app.MAPBOXGL_LOCATION_BOUNDS_HERSTON;
                app.MAP_LOCATION_BOUNDS_LNGLATLIKE = app.MAP_LOCATION_BOUNDS_LNGLATLIKE_HERSTON;
            }

            // Resolve the promise when initialization is successful
            resolve();

        } catch (error) {
            console.error("Error initializing app config:", error);
            // Optionally set flags or default states on app if initialization fails critically
            app.initializationError = true;
            // Reject the promise on critical failure
            reject(error);
        }

        if (app.DEBUG) {
            console.warn("APP DEBUG MODE ENABLED. TEST VALUES SET.");
            app.MAP_LOCATION_BOUNDS = null;
            app.MAPBOXGL_LOCATION_BOUNDS = null;
            app.MAP_LOCATION_BOUNDS_LNGLATLIKE = null; // Set to null for testing

        }
    });

    // Return the promise so app.js can optionally wait if needed elsewhere
    return app.initializationPromise;
};

// Only export the initialization function
export { initializeConfig };

const app = window.app;

