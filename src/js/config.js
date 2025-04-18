import Device from './device.js';
import { SessionToken, LngLatBounds } from '@mapbox/search-js-core';
import * as THREE from 'three';
import * as LocAR from 'locar';

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

    // Search config
    MIN_SEARCH_LENGTH: 3,
    SEARCH_TYPES: ['poi', 'address'],
    SEARCH_RESULT_LIMIT: 3,

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

// Initialize the configuration only once
let initialized = false;
const initializeConfig = async () => {
    if (initialized) return config;

    try {
        config.USER_LOCATION = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve([position.coords.longitude, position.coords.latitude]);
                },
                (error) => {
                    console.error("Failed to get user location:", error);
                    reject(error);
                }
            );
        });
        console.log("USER_LOCATION set to:", config.USER_LOCATION);
    } catch (error) {
        console.error("Error setting USER_LOCATION. Defaulting to [0, 0].");
        config.USER_LOCATION = [0, 0]; // Default to a neutral location
    }

    // Initialize DEVICE
    try {
        config.DEVICE = new Device();
    } catch (error) {
        console.error("Device initialization failed:", error);
        config.DEVICE = {
            detectWebcam: () => false,
            isDesktop: () => true,
        };
    }

    // Set DEVICE properties
    config.WEBCAM_ENABLED = await config.DEVICE.detectWebcam();
    config.DESKTOP_DEVICE = config.DEVICE.isDesktop();

    // Initialize THREE.js components
    config.RENDERER = new THREE.WebGLRenderer();
    config.LOCAR_SCENE = new THREE.Scene();

    config.RENDERER.setSize(window.innerWidth, window.innerHeight);

    config.LOCAR_CAMERA = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.001, 1000);

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

    initialized = true;
    return config;
};

export default initializeConfig;