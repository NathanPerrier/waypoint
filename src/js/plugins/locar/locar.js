import { waitForElement } from '../../utils/dom.js';

export const initializeLocAR = async (locarElement) => {

    // First, get the app instance
    const app = window.app;

    // Check if app exists before trying to access its properties
    if (!app) {
        console.error("Framework7 app instance not found. LocAR cannot initialize.");
        return;
    }

    try {
        // Now wait for the app's initialization promise
        await app.initializationPromise;
      } catch (error) {
        console.error("Config initialization failed, cannot proceed:", error);
        return; // Stop execution if config fails
    }
    
    // console.log("app instance for locar:", app, app.LOCAR_CONTAINER);

    if (!app.AR) {
        console.warn("AR is not enabled. LocAR cannot initialize. Desktop device:", app.DESKTOP_DEVICE);
        return; // Stop execution if AR is not enabled
    }

    // Use app.DESKTOP_DEVICE instead of config.DESKTOP_DEVICE
    // Uncomment this check to help debug initialization issues
    if (!app.AR || !app.LOCAR || !app.RENDERER || !app.LOCAR_SCENE || !app.LOCAR_CAMERA || !app.CAM || !app.DEVICE_ORIENTATION_CONTROLS) {
        console.error("LocAR components not initialized correctly on the app instance. AR:", app.AR, "Ensure the device is mobile and initialization succeeded.");
        return; // Stop if components are missing
    }

    window.addEventListener("resize", e => {
        app.RENDERER.setSize(window.innerWidth, window.innerHeight);
        app.LOCAR_CAMERA.aspect = window.innerWidth / window.innerHeight;
        app.RENDERER.setPixelRatio(app.DEVICE.device.pixelRatio)
        app.LOCAR_CAMERA.updateProjectionMatrix();
    });
    
    window.addEventListener("orientationchange", e => {
        // Use app variables if uncommented
        app.LOCAR_CAMERA.aspect = window.innerWidth / window.innerHeight;
        app.LOCAR_CAMERA.updateProjectionMatrix();
    });

    app.LOCAR_CONTAINER = locarElement.appendChild(app.RENDERER.domElement);
};

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize LocAR when the DOM is fully loaded
    await initializeLocAR(await waitForElement("locarjs"));
});

