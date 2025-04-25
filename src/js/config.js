import Device from './utils/device.js';
import { SessionToken, LngLatBounds } from '@mapbox/search-js-core';
import PopupComponent from 'framework7/components/popup';


//! Config initialization logic moved to use f7 app instance

// Default values (can be overridden during initialization)
const defaultUserLocation = [153.013306, -27.497503]; // great court

const initializeConfig = (app) => {
    // Create a promise that resolves when initialization is done
    app.initializationPromise = new Promise(async (resolve, reject) => {
        // Set default values on the app instance first

        app.PRIMARY_COLOR = "#782cf6";
        app.COUNTRY = 'au';
        app.LANGUAGE = 'en';
        app.TRANSPORTATION_MODE = "walking";
        app.START_LOCATION = null; 
        app.DESTINATION_LOCATION = null;
        app.DESTINATION_LOCATION_COORDINATES = null;
        app.DESTINATION_LOCATION_DATA = null;
        app.NAVIGATION_ROUTE = null;
        app.USER_LOCATION = null; 
        app.MAP_LOCATION_BOUNDS = new LngLatBounds([152.998221, -27.505890], [153.019359, -27.490149]); // st lucia campus
        app.MAPBOXGL_LOCATION_BOUNDS = new mapboxgl.LngLatBounds([152.998221, -27.505890], [153.019359, -27.490149]); // st lucia campus
        app.MAP_LOCATION_CENTER = defaultUserLocation;
        app.MAP_COUNTRY_RESTRICTIONS = 'au';
        app.MAP_LIGHT_STYLE = 'mapbox://styles/mapbox/light-v11';
        app.MAP_3D_STYLE = 'mapbox://styles/mapbox/standard';
        app.MAP_SESSION_TOKEN = new SessionToken();
        app.MIN_SEARCH_LENGTH = 3; 
        app.MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoibmF0aGFuLXBlcnJpZXIyMyIsImEiOiJjbG8ybW9pYnowOTRiMnZsZWZ6NHFhb2diIn0.NDD8iEfYO1t9kg6q_vkVzQ';
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

        // Show Framework7 preloader if available
        if (app.preloader) {
            app.preloader.show();
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
            if (app.MOBILE_DEVICE) {
                const [THREE, LocAR] = await Promise.all([
                    import('three'),
                    import('locar'),
                ]);

                // Initialize THREE.js components and assign to app instance
                app.RENDERER = new THREE.WebGLRenderer({ alpha: true }); // Ensure background can be transparent if needed
                app.LOCAR_SCENE = new THREE.Scene();
                app.LOCAR_CAMERA = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.001, 1000); // app.DEVICE.device.pixelRatio

                app.RENDERER.setSize(window.innerWidth, window.innerHeight);
                app.RENDERER.setPixelRatio(app.DEVICE.device.pixelRatio); 

                // Initialize LOCAR and assign to app instance
                app.LOCAR = new LocAR.LocationBased(app.LOCAR_SCENE, app.LOCAR_CAMERA);
                app.DEVICE_ORIENTATION_CONTROLS = new LocAR.DeviceOrientationControls(app.LOCAR_CAMERA);
                app.CAM = new LocAR.WebcamRenderer(app.RENDERER);
                
            } else {
                app.AR = false; // Disable AR mode for desktop
            }

            // Resolve the promise when initialization is successful
            resolve();

        } catch (error) {
            console.error("Error initializing app config:", error);
            // Optionally set flags or default states on app if initialization fails critically
            app.initializationError = true;
            // Reject the promise on critical failure
            reject(error);
        } finally {
            // Hide Framework7 preloader if available
            if (app.preloader) {
                app.preloader.hide();
            }
        }
    });

    // Return the promise so app.js can optionally wait if needed elsewhere
    return app.initializationPromise;
};

// Only export the initialization function
export { initializeConfig };
