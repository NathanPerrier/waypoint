import * as THREE from 'three';
import { displayDialog } from '../../utils/dialog';
import { getRoute } from '../maps/mapboxRoute.js';

export function runLocarNav(app, locarInstance) {

    // --- GPS Update Listener --- 
    locarInstance.locar.on("gpsupdate", (pos, distMoved) => {
        // Update global app state (used by navigationManager)
        app.USER_LOCATION = [pos.coords.longitude, pos.coords.latitude];

        console.log('User Location:', app.USER_LOCATION);
        console.log('Distance Moved:', distMoved);
        
        if (distMoved < app.NAVIGATION_DISTANCE_BUFFER) {
            return;
        }

        app.START_LOCATION = {
            lng: pos.coords.longitude,
            lat: pos.coords.latitude,
        };

        getRoute(app, app.router).then(() => {
            console.log('Route fetched successfully:', app.NAVIGATION_ROUTE);
        }).catch((error) => {
            console.error('Error fetching route:', error);
        });

        if (app.NAVIGATION_ROUTE.length < 2) {
            app.dialog.aler("You have arrived to your destination.");
            return;
        }

        //display line
        const points = app.NAVIGATION_ROUTE.map(coord => locarInstance.locar.lonLatToWorldCoords(coord[0], coord[1]));
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
         const mesh = new THREE.Mesh(
            geometry,
            new THREE.MeshBasicMaterial({color: 0x0000ff})
        );
        locarInstance.locar.add(geometry, pos.coords.longitude, pos.coords.latitude, .001);

    });

    // --- Start GPS and Animation Loop --- 
    locarInstance.locar.startGps();
    locarInstance.renderer.setAnimationLoop(animate);

    function animate() {
        locarInstance.cam.update();
        locarInstance.controls.update();
        locarInstance.renderer.render(locarInstance.scene, locarInstance.camera);
    }
    animate(); // Initial render
}