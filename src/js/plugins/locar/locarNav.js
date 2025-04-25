import * as THREE from 'three';

export function runLocarNav(app) { // Accept app instance
    let firstLocation = true;

    app.LOCAR.on("gpsupdate", (pos, distMoved) => {
        // locar navigation
    });

    app.LOCAR.startGps();

    app.RENDERER.setAnimationLoop(animate);

    function animate() {
        app.CAM.update();
        app.DEVICE_ORIENTATION_CONTROLS.update();
        app.RENDERER.render(app.LOCAR_SCENE, app.LOCAR_CAMERA);
    }
    animate();
}