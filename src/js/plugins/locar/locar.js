import * as THREE from 'three';
// Remove unused Config import
// import Config from '../../config.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Access the global Framework7 app instance
    const app = window.app;

    // Check if app is initialized
    if (!app) {
        console.error("Framework7 app instance not found. LocAR cannot initialize.");
        return;
    }

    console.log("app instance for locar:", app);

    // Use app.DESKTOP_DEVICE instead of config.DESKTOP_DEVICE
    if (!app.LOCAR || !app.RENDERER || !app.LOCAR_SCENE || !app.LOCAR_CAMERA || !app.CAM || !app.DEVICE_ORIENTATION_CONTROLS) {
        console.error("LocAR components not initialized on the app instance. Ensure the device is mobile and initialization succeeded.");
        return;
    }

    await runLocar(app); // Pass the app instance
});

// window.addEventListener("resize", e => {
//     // Use app variables if uncommented
//     app.RENDERER.setSize(window.innerWidth, window.innerHeight);
//     app.LOCAR_CAMERA.aspect = window.innerWidth / window.innerHeight;
//     app.LOCAR_CAMERA.updateProjectionMatrix();
// });

// window.addEventListener("orientationchange", e => {
//     // Use app variables if uncommented
//     app.LOCAR_CAMERA.aspect = window.innerWidth / window.innerHeight;
//     app.LOCAR_CAMERA.updateProjectionMatrix();
// });



async function runLocar(app) { // Accept app instance
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
}