import Device from './plugins/device.js';
import { SessionToken, LngLatBounds } from '@mapbox/search-js-core';
import PopupComponent from 'framework7/components/popup';

// if essential vars like user_location, map_session_token, device, renderer, locar, cam --> throw alert

const config = {
    COUNTRY: 'au',
    LANGUAGE: 'en',
    TRANSPORTATION_MODE: "walking",
    USER_LOCATION: null,

    // Mapbox config
    MAP_LOCATION_BOUNDS: new LngLatBounds([152.998221, -27.505890], [153.019359, -27.490149]), // st lucia campus
    MAP_LOCATION_CENTER: [153.013306, -27.497503], // great court
    MAP_COUNTRY_RESTRICTIONS: 'au',
    MAP_STYLE: '',
    MAP_STYLE_3D: '',
    MAP_SESSION_TOKEN: new SessionToken(),
    MAPBOX_ACCESS_TOKEN: 'pk.eyJ1IjoibmF0aGFuLXBlcnJpZXIyMyIsImEiOiJjbG8ybW9pYnowOTRiMnZsZWZ6NHFhb2diIn0.NDD8iEfYO1t9kg6q_vkVzQ',

    // Device and THREE.js placeholders
    DEVICE: null,
    WEBCAM_ENABLED: false,
    DESKTOP_DEVICE: false,
    LOCAR_CAMERA: null,
    RENDERER: null,
    LOCAR_CONTAINER: null,
    LOCAR_SCENE: null,
    LOCAR: null,
    DEVICE_ORIENTATION_CONTROLS: null,
    CAM: null,
};

let initialized = false;

const initializeConfig = async () => {
    if (initialized) return config;

    // Show Framework7 preloader
    if (window.app && window.app.preloader) {
        window.app.preloader.show();
    }

    try {
        // Parallelize geolocation and device detection
        const [userLocation, device] = await Promise.all([
            new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve([position.coords.longitude, position.coords.latitude]),
                    (error) => {
                        console.error("Failed to get user location:", error);
                        resolve(config.MAP_LOCATION_CENTER); // Default to center
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
                    return {
                        deviceInstance: {
                            detectWebcam: () => false,
                            isDesktop: () => true,
                        },
                        webcamEnabled: false,
                    };
                }
            })(),
        ]);

        config.USER_LOCATION = userLocation;
        config.DEVICE = device.deviceInstance;
        config.WEBCAM_ENABLED = device.webcamEnabled;
        config.DESKTOP_DEVICE = device.deviceInstance.isDesktop() || device.deviceInstance.isTablet();

        console.log("User Location:", config.USER_LOCATION);
        console.log("Device Info:", config.DEVICE);
        console.log("Webcam Enabled:", config.WEBCAM_ENABLED);
        console.log("Is Desktop Device:", config.DESKTOP_DEVICE);
        console.log("Is Mobile Device:", !config.DESKTOP_DEVICE);

        // Conditionally load libraries for mobile
        if (!config.DESKTOP_DEVICE) {
            const [THREE, LocAR] = await Promise.all([
                import('three'),
                import('locar'),
            ]);

            // Initialize THREE.js components
            config.RENDERER = new THREE.WebGLRenderer();
            config.LOCAR_SCENE = new THREE.Scene();
            config.LOCAR_CAMERA = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.001, 1000);

            config.RENDERER.setSize(window.innerWidth, window.innerHeight);

            // Attach RENDERER to DOM
            const locarElement = document.getElementById("locarjs");
            if (locarElement) {
                config.LOCAR_CONTAINER = locarElement.appendChild(config.RENDERER.domElement);
            } else {
                console.error('Element with ID "locarjs" not found.');
            }

            // Initialize LOCAR
            config.LOCAR = new LocAR.LocationBased(config.LOCAR_SCENE, config.LOCAR_CAMERA);
            config.DEVICE_ORIENTATION_CONTROLS = new LocAR.DeviceOrientationControls(config.LOCAR_CAMERA);
            config.CAM = new LocAR.WebcamRenderer(config.RENDERER);
        }

        initialized = true;
    } catch (error) {
        console.error("Error initializing config:", error);
    } finally {
        // Hide Framework7 preloader
        if (window.app && window.app.preloader) {
            window.app.preloader.hide();
        }
    }

    return config;
};

function configErrors(config) {
    for (configVar in config) {
        if (configVar == null) {
            //throw error
            console.error(configVar)
        }
    }
}

// Initialize config and expose globally
initializeConfig().then(() => {
    configErrors(config);
});

export default {initializeConfig, config};
