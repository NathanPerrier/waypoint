import * as THREE from 'three';
import { getRoute } from '../maps/mapboxRoute.js';
import { updateRouteData, populateRouteInstructions } from '../../utils/dom.js';
import { updateRouteLayer } from '../maps/routeOverviewMap.js';
import { getLocarSuggestions } from './locarSuggestions.js';

export function runLocarNav(app, locarInstance, destinationName, navigationInfo, liveMap1, liveMap2, firstTwoStepscontainer, navigationStepsContainer) {
    let firstPosition = true;

    // --- GPS Update Listener --- 
    console.log('Initializing GPS update listener in locarNav');

    locarInstance.locar.on("gpsupdate", (pos, distMoved) => {
        try {
            console.log('GPS Update Event Triggered');
            console.log('Position:', pos);
            console.log('Distance Moved:', distMoved);

            // Update global app state (used by navigationManager)
            app.USER_LOCATION = [pos.coords.longitude, pos.coords.latitude];

            console.log('User Location Updated:', app.USER_LOCATION);

            if (distMoved < app.NAVIGATION_DISTANCE_BUFFER && !firstPosition) {
                console.log('Distance moved is less than buffer, skipping update.');
                return;
            }

            getLocarSuggestions(app, locarInstance.locar);

            app.START_LOCATION = {
                lng: pos.coords.longitude,
                lat: pos.coords.latitude,
            };

            console.log('Start Location Updated:', app.START_LOCATION);

            if (!firstPosition) {
                getRoute(app, app.router).then(() => {
                    console.log('Route fetched successfully:', app.NAVIGATION_ROUTE);
                }).catch((error) => {
                    console.error('Error fetching route:', error);
                });
            }

            if (app.NAVIGATION_ROUTE.length < 2) {
                console.log('Navigation route is too short, destination reached.');
                app.dialog.alert("You have arrived to your destination.");
                return;
            }

            updateRouteLayer(liveMap1, app.NAVIGATION_ROUTE);
            updateRouteLayer(liveMap2, app.NAVIGATION_ROUTE);
            liveMap1.setCenter(app.USER_LOCATION);
            liveMap2.setCenter(app.USER_LOCATION);

            console.log('Route layers updated and maps centered.');

            liveMap1.setBearing(app.NAVIGATION_ROUTE_STEPS[0].instruction.bearing_after);
            liveMap2.setBearing(app.NAVIGATION_ROUTE_STEPS[0].instruction.bearing_after);

            updateRouteData(app.DESTINATION_LOCATION, `${Math.round(app.NAVIGATION_ROUTE_DATA.duration/60)} min`, `${Math.round(app.NAVIGATION_ROUTE_DATA.distance)} m`, destinationName, navigationInfo);
            populateRouteInstructions(app, firstTwoStepscontainer, navigationStepsContainer);

            console.log('Route data and instructions updated.');

            // Display line
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
            const points = [];
            for (let i = 0; i < app.NAVIGATION_ROUTE.length; i++) {
                points.push(new THREE.Vector3(app.NAVIGATION_ROUTE[i][0], app.NAVIGATION_ROUTE[i][1], 0));
            }

            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(lineGeometry, lineMaterial);

            locarInstance.locar.add(line, pos.coords.longitude, pos.coords.latitude);

            console.log('Line added to LocAR instance.');

            firstPosition = false;
        } catch (error) {
            console.error('Error during GPS update handling:', error);
        }
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