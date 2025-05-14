import * as THREE from 'three';
import { getRoute } from '../maps/mapboxRoute.js';
import { updateRouteData, populateRouteInstructions } from '../../utils/dom.js';
import { updateRouteLayer } from '../maps/routeOverviewMap.js';

export function runLocarNav(app, locarInstance, destinationName, navigationInfo, liveMap1, liveMap2, firstTwoStepscontainer, navigationStepsContainer) {

    // --- GPS Update Listener --- 
    locarInstance.locar.on("gpsupdate", (pos, distMoved) => {
        // Update global app state (used by navigationManager)
        app.USER_LOCATION = [pos.coords.longitude, pos.coords.latitude];

        console.log('User Location:', app.USER_LOCATION);
        console.log('Distance Moved:', distMoved);
        app.alert('Distance Moved:', pos.coords.heading, pos.coords.altitude);
        
        if (distMoved < app.NAVIGATION_DISTANCE_BUFFER) { // check if firstRoute before
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

        updateRouteLayer(liveMap1, app.NAVIGATION_ROUTE);
        updateRouteLayer(liveMap2, app.NAVIGATION_ROUTE);
        liveMap1.setCenter(app.USER_LOCATION);
        liveMap2.setCenter(app.USER_LOCATION);

        updateRouteData(app.DESTINATION_LOCATION, `${Math.round(app.NAVIGATION_ROUTE_DATA.duration/60)} min`, `${Math.round(app.NAVIGATION_ROUTE_DATA.distance)} m`, destinationName, navigationInfo);
        populateRouteInstructions(app, firstTwoStepscontainer, navigationStepsContainer);

        //display line
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
        // const point1 = new THREE.Vector3(app.START_LOCATION.lng, app.START_LOCATION.lat, 0);
        // const point2 = new THREE.Vector3(app.NAVIGATION_ROUTE[0][0], app.NAVIGATION_ROUTE[0][1], 0);

        const points = [];
        for (let i = 0; i < app.NAVIGATION_ROUTE.length; i++) {
            points.push(new THREE.Vector3(app.NAVIGATION_ROUTE[i][0], app.NAVIGATION_ROUTE[i][1], 0));
        }

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Mesh(lineGeometry, lineMaterial);

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