import * as THREE from 'three';
import { getLocarSuggestions } from './locarSuggestions';
import { debugCameraPosition, showCompassLines, showOriginCube, logCameraChange } from './debugLocar';

let compassLines = null;
let userLine = null; 
let firstPosition = true;

export function runLocarRoute(app, locarInstance) { 

    //! TRIAL CAMERA CHECK
    let lastCameraPosition = new THREE.Vector3(0, 0, 0);
        
    const cameraCheckInterval = setInterval(() => {
        // Call logCameraChange inside the interval callback
        if (locarInstance && locarInstance.camera) {
            lastCameraPosition = logCameraChange(app, locarInstance, lastCameraPosition);
        }
    }, 1000);
    //!

    showOriginCube(app, locarInstance);
   
    locarInstance.locar.on("gpsupdate", (pos, distMoved) => {
        app.USER_LOCATION = [pos.coords.longitude, pos.coords.latitude];

        app.START_LOCATION = {
            lng: pos.coords.longitude,
            lat: pos.coords.latitude,
        };

        if (distMoved > app.NAVIGATION_DISTANCE_BUFFER) {
            getLocarSuggestions(app, locarInstance.locar);
        }  

        // firstPosition, compassLines, userLine = showCompassLines(app, firstPosition, locarInstance, pos, compassLines, userLine);
    });

    locarInstance.locar.startGps();

    locarInstance.renderer.setAnimationLoop(animate);

    //! test camera check
    
    locarInstance.cameraCheckInterval = cameraCheckInterval;
    
    locarInstance.cleanup = () => {
        if (locarInstance.cameraCheckInterval) {
            clearInterval(locarInstance.cameraCheckInterval);
            locarInstance.cameraCheckInterval = null;
        }
    };  
    //!
    
    function animate() {
        const originalPosition = locarInstance.camera.position.clone();

        locarInstance.cam.update();
        locarInstance.controls.update();

        debugCameraPosition(app, locarInstance);

        locarInstance.renderer.render(locarInstance.scene, locarInstance.camera);
    }
    animate();
}
