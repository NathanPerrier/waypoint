import * as THREE from 'three';
import * as LocAR from 'locar';

export const initializeLocAR = async (app, locarElement) => {
    if (!locarElement || !locarElement.id) {
        console.error("LocAR initialization requires a locarElement with a unique ID.");
        app.dialog.alert('LocAR initialization requires a locarElement with a unique ID.','Error', {
            onClose: () => {
                app.router.navigate('/');
            }
        });
        return;
    }
    const elementId = locarElement.id;

    // Initialize container for LocAR instances if it doesn't exist
    if (!app.locarInstances) {
        app.locarInstances = {};
    }

    // Check if an instance for this element already exists
    if (app.locarInstances[elementId]) {
        console.warn(`LocAR instance for element ID '${elementId}' already initialized.`);
        return app.locarInstances[elementId]; // works?
    }

    // Create a new instance object for this element ID
    app.locarInstances[elementId] = {};
    const instance = app.locarInstances[elementId];

    instance.renderer = new THREE.WebGLRenderer({ alpha: true }); // Ensure background can be transparent if needed
    instance.scene = new THREE.Scene();
    instance.camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.001, 1000); // Consider element dimensions?

    const width = locarElement.clientWidth;
    const height = locarElement.clientHeight;
    instance.renderer.setSize(window.innerWidth, window.innerHeight); // Use element dimensions
    instance.renderer.setPixelRatio(window.devicePixelRatio); // Use device pixel ration

    // Initialize LOCAR and assign to the specific instance
    instance.locar = new LocAR.LocationBased(instance.scene, instance.camera);
    instance.controls = new LocAR.DeviceOrientationControls(instance.camera);
    instance.cam = new LocAR.WebcamRenderer(instance.renderer);

    if (!app) {
        console.error("Framework7 app instance not found. LocAR cannot initialize.");
        app.dialog.alert('Framework7 app instance not found. LocAR cannot initialize.','Error', {
            onClose: () => {
                app.router.navigate('/');
            }
        });
        delete app.locarInstances[elementId];
        return;
    }

    try {
        await app.initializationPromise; // Assuming this is a global app promise
      } catch (error) {
        console.error("Config initialization failed, cannot proceed:", error);
        app.dialog.alert('Config initialization failed. Please try again later.', 'Error', {
            onClose: () => {
                app.router.navigate('/');
            }
        });
        delete app.locarInstances[elementId];
        return;
    }

    // Assuming app.AR and app.DESKTOP_DEVICE are global settings
    if (!app.AR) {
        console.warn("AR is not enabled. LocAR cannot initialize. Desktop device:", app.DESKTOP_DEVICE);
        app.dialog.alert('AR is not enabled. LocAR cannot initialize.','Error', {
            onClose: () => {
                app.router.navigate('/');
            }
        });
        delete app.locarInstances[elementId];
        return;
    }

    // Check components within the specific instance
    if (!instance.locar || !instance.renderer || !instance.scene || !instance.camera || !instance.cam || !instance.controls) {
        console.error(`LocAR components not initialized correctly for element ID '${elementId}'.`);
        app.dialog.alert('LocAR components not initialized correctly. Please try again later.','Error', {
            onClose: () => {
                app.router.navigate('/');
            }
        });
        delete app.locarInstances[elementId];
        return;
    }

    // --- Event Listeners ---
    // Store listeners perhaps on the instance object to remove them later if needed
    instance.resizeListener = () => {
        const width = locarElement.clientWidth;
        const height = locarElement.clientHeight;
        instance.renderer.setSize(width, height);
        instance.camera.aspect = width / height;
        instance.renderer.setPixelRatio(window.devicePixelRatio); // Re-set pixel ratio on resize
        instance.camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", instance.resizeListener);

    // Orientation change might affect aspect ratio if width/height swap
    instance.orientationListener = () => {
        // Delay slightly to allow layout reflow
        setTimeout(() => {
            const width = locarElement.clientWidth;
            const height = locarElement.clientHeight;
            // instance.renderer.setSize(width, height); // Resize handles this
            instance.camera.aspect = width / height;
            instance.camera.updateProjectionMatrix();
        }, 100); // Adjust delay as needed
    };
    window.addEventListener("orientationchange", instance.orientationListener);
    // --- End Event Listeners ---


    instance.container = locarElement.appendChild(instance.renderer.domElement);

    return instance;
};

// Example of how you might clean up an instance later
export const destroyLocARInstance = (app, elementId) => {
    if (!app || !app.locarInstances || !app.locarInstances[elementId]) {
        console.warn(`No LocAR instance found for element ID '${elementId}' to destroy.`);
        app.dialog.alert(`No LocAR instance found. Please try again later.`, 'Error', {
            onClose: () => {
                app.router.navigate('/');
            }
        });
        return;
    }

    const instance = app.locarInstances[elementId];

    // Remove event listeners
    if (instance.resizeListener) {
        window.removeEventListener('resize', instance.resizeListener);
    }
    if (instance.orientationListener) {
        window.removeEventListener('orientationchange', instance.orientationListener);
    }

    // Stop webcam, dispose renderer, scene, etc.
    if (instance.cam) {
        instance.cam.dispose(); // Assuming a stop method exists
    }
    if (instance.renderer) {
        instance.renderer.dispose();
    }
    if (instance.container && instance.container.parentNode) {
        instance.container.parentNode.removeChild(instance.container);
    }
    // Add disposal for scene geometries, materials, textures if necessary

    delete app.locarInstances[elementId];
    console.log(`LocAR instance for element ID '${elementId}' destroyed.`);
};
