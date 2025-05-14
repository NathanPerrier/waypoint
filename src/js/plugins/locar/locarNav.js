import * as THREE from 'three';
import { getRoute } from '../maps/mapboxRoute.js';
import { updateRouteData } from '../../utils/dom.js';

export function runLocarNav(app, locarInstance, destinationName, navigationInfo) {

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
            app.dialog.alert("You have arrived to your destination.");
            return;
        }

        updateRouteData(app.DESTINATION_LOCATION, `${Math.round(app.NAVIGATION_ROUTE_DATA.duration/60)} min`, `${Math.round(app.NAVIGATION_ROUTE_DATA.distance)} m`, destinationName, navigationInfo);

        //display line
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
        const point1 = new THREE.Vector3(app.START_LOCATION.lng + 0.001, app.START_LOCATION.lat, 0);
        const point2 = new THREE.Vector3(app.NAVIGATION_ROUTE[0][0], app.NAVIGATION_ROUTE[0][1], 0);

        const lineGeometry = new THREE.BufferGeometry().setFromPoints([point1, point2]);
        const line = new THREE.Line(lineGeometry, lineMaterial);

        locarInstance.locar.add(line, pos.coords.longitude, pos.coords.latitude);

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