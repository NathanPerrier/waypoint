import { waitForElement } from '../../utils/dom.js';

export const initializeLocAR = async (locarElement) => {

    const app = window.app;

    if (!app) {
        console.error("Framework7 app instance not found. LocAR cannot initialize.");
        return;
    }

    try {
        await app.initializationPromise;
      } catch (error) {
        console.error("Config initialization failed, cannot proceed:", error);
        return; 
    }

    if (!app.AR) {
        console.warn("AR is not enabled. LocAR cannot initialize. Desktop device:", app.DESKTOP_DEVICE);
        return;
    }

    if (!app.AR || !app.LOCAR || !app.RENDERER || !app.LOCAR_SCENE || !app.LOCAR_CAMERA || !app.CAM || !app.DEVICE_ORIENTATION_CONTROLS) {
        console.error("LocAR components not initialized correctly on the app instance. AR:", app.AR, "Ensure the device is mobile and initialization succeeded.");
        return; 
    }

    window.addEventListener("resize", e => {
        app.RENDERER.setSize(window.innerWidth, window.innerHeight);
        app.LOCAR_CAMERA.aspect = window.innerWidth / window.innerHeight;
        app.RENDERER.setPixelRatio(app.DEVICE.device.pixelRatio)
        app.LOCAR_CAMERA.updateProjectionMatrix();
    });
    
    window.addEventListener("orientationchange", e => {
        app.LOCAR_CAMERA.aspect = window.innerWidth / window.innerHeight;
        app.LOCAR_CAMERA.updateProjectionMatrix();
    });

    app.LOCAR_CONTAINER = locarElement.appendChild(app.RENDERER.domElement);
};

document.addEventListener('DOMContentLoaded', async () => {
    await initializeLocAR(await waitForElement("locarjs"));
});

