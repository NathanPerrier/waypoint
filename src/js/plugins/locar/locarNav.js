import * as THREE from 'three';

export function runLocarNav(app, locarInstance) { // Accept app instance
    let firstLocation = true;

    console.log("LocarNav: ", locarInstance);

    locarInstance.locar.on("gpsupdate", (pos, distMoved) => {
        // locar navigation
    });

    locarInstance.locar.startGps();

    locarInstance.renderer.setAnimationLoop(animate);

    function animate() {
        locarInstance.cam.update();
        locarInstance.controls.update();
        // Use the scene and camera from the specific locarInstance
        locarInstance.renderer.render(locarInstance.scene, locarInstance.camera);
    }
    animate();
}