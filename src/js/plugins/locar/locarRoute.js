import * as THREE from 'three';
import { getLocarSuggestions } from './locarSuggestions';
import { debugCameraPosition, showOriginCube, logCameraChange } from './debugLocar';

/**
 * Run LocAR route function
 * Basic locar function which displays the location suggestions
 * 
 * @param {Object} app - The Framework7 app instance.
 * @param {Object} locarInstance - The LocAR instance containing the scene, camera, and renderer.
 * 
 */
export function runLocarRoute(app, locarInstance) { 
    // set defualt camera position to user position
    let lastCameraPosition = new THREE.Vector3(0, 0, 0);
       
    // check camera position every second
    const cameraCheckInterval = setInterval(() => {
        // Call logCameraChange inside the interval callback
        if (locarInstance && locarInstance.camera) {
            lastCameraPosition = logCameraChange(app, locarInstance, lastCameraPosition);
        }
    }, 1000);

    // debug function to show origin cube
    showOriginCube(app, locarInstance);
   
    // update user location and suggestions on GPS update
    locarInstance.locar.on("gpsupdate", (pos, distMoved) => {
        app.USER_LOCATION = [pos.coords.longitude, pos.coords.latitude];

        // Set the start location to the current GPS position
        app.START_LOCATION = {
            lng: pos.coords.longitude,
            lat: pos.coords.latitude,
        };

        // if the user has moved a significant distance, get new suggestions
        if (distMoved > app.NAVIGATION_DISTANCE_BUFFER) {
            getLocarSuggestions(app, locarInstance.locar);
        }  
    });

    // start the GPS tracking
    locarInstance.locar.startGps();

    // start animation loop
    locarInstance.renderer.setAnimationLoop(animate);
    
    // set the camera check interval
    locarInstance.cameraCheckInterval = cameraCheckInterval;
    
    // cleanup function to clear the camera check interval
    locarInstance.cleanup = () => {
        if (locarInstance.cameraCheckInterval) {
            clearInterval(locarInstance.cameraCheckInterval);
            locarInstance.cameraCheckInterval = null;
        }
    };  
    
    /**
     * Animation function that updates the camera and renderer.
     * This function is called in a loop to render the scene.
     */
    function animate() {
        // update the camera position and controls
        locarInstance.cam.update();
        locarInstance.controls.update();

        // Debugging: Log the camera position
        debugCameraPosition(app, locarInstance);

        // Render the scene with the camera
        locarInstance.renderer.render(locarInstance.scene, locarInstance.camera);
    }
    // Start the animation loop
    animate();
}
