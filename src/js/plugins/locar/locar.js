import * as THREE from 'three';


document.addEventListener('DOMContentLoaded', async () => {

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

    /* Remove window resize/orientation listeners - handled by ResizeObserver in route.f7 */
    /*
    window.addEventListener("resize", e => {
        app.RENDERER.setSize(window.innerWidth, window.innerHeight);
        app.LOCAR_CAMERA.aspect = window.innerWidth / window.innerHeight;  //app.DEVICE.device.pixelRatio;
        app.RENDERER.setPixelRatio(app.DEVICE.device.pixelRatio)
        app.LOCAR_CAMERA.updateProjectionMatrix();
    });
    
    window.addEventListener("orientationchange", e => {
        // Use app variables if uncommented
        app.LOCAR_CAMERA.aspect = window.innerWidth / window.innerHeight;
        app.LOCAR_CAMERA.updateProjectionMatrix();
    });
    */

    runLocar(app); // Pass the app instance
});





function runLocar(app) { // Accept app instance
    let firstLocation = true;

    // Use app.LOCAR
    app.LOCAR.on("gpsupdate", (pos, distMoved) => {
        if(firstLocation) {

            const boxProps = [
                { latDis: 0.001, lonDis: 0, colour: 0xff0000 },
                { latDis: -0.001, lonDis: 0, colour: 0xffff00 },
                { latDis: 0, lonDis: -0.001, colour: 0x00ffff },
                { latDis: 0, lonDis: 0.001, colour: 0x00ff00 },
            ]; 

            const geom = new THREE.BoxGeometry(20,20,20);

            for(const boxProp of boxProps) {
                const mesh = new THREE.Mesh(
                    geom,
                    new THREE.MeshBasicMaterial({color: boxProp.colour})
                );

                // Use app.LOCAR
                app.LOCAR.add(
                    mesh,
                    pos.coords.longitude + boxProp.lonDis,
                    pos.coords.latitude + boxProp.latDis
                );
            }

            firstLocation = false;
        }
    });

    // Use app.LOCAR
    app.LOCAR.startGps();

    // Use app.RENDERER
    app.RENDERER.setAnimationLoop(animate);

    function animate() {
        // Use app variables
        app.CAM.update();
        app.DEVICE_ORIENTATION_CONTROLS.update();
        app.RENDERER.render(app.LOCAR_SCENE, app.LOCAR_CAMERA);
    }
    animate();
}