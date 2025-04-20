import Device from './plugins/device.js';
import { SessionToken, LngLatBounds } from '@mapbox/search-js-core';

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

    // Show loading screen

    //! swap with f7 loading screen
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.style.position = 'fixed';
    loadingScreen.style.top = '0';
    loadingScreen.style.left = '0';
    loadingScreen.style.width = '100vw';
    loadingScreen.style.height = '100vh';
    loadingScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    loadingScreen.style.color = 'white';
    loadingScreen.style.display = 'flex';
    loadingScreen.style.justifyContent = 'center';
    loadingScreen.style.alignItems = 'center';
    loadingScreen.style.zIndex = '1000';
    loadingScreen.innerHTML = '<h1>Loading...</h1>';
    document.body.appendChild(loadingScreen);

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
        config.DESKTOP_DEVICE = config.DEVICE.isDesktop();

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
        // Remove loading screen
        document.body.removeChild(loadingScreen);
    }

    return config;
};

initializeConfig().then(() => {
    window.config = config;
});

export default initializeConfig;