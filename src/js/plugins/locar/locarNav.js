import * as THREE from 'three';
import { MeshLineGeometry, MeshLineMaterial, raycast } from 'meshline'

import { getRoute } from '../maps/mapboxRoute.js';
import { updateRouteData, populateRouteInstructions } from '../../utils/dom.js';
import { updateRouteLayer } from '../maps/routeOverviewMap.js';
import { getLocarSuggestions } from './locarSuggestions.js';

export function runLocarNav(app, locarInstance, destinationName, navigationInfo, liveMap1, liveMap2, firstTwoStepscontainer, navigationStepsContainer) {
    let firstPosition = true;

    // --- GPS Update Listener --- 
    locarInstance.locar.on("gpsupdate", (pos, distMoved) => {
        // Update global app state (used by navigationManager)
        app.USER_LOCATION = [pos.coords.longitude, pos.coords.latitude];

        console.log('User Location:', app.USER_LOCATION);
        console.log('Distance Moved:', distMoved);
        
        // if (distMoved < app.NAVIGATION_DISTANCE_BUFFER && !firstPosition) { 
        //     return;
        // } 

        // getLocarSuggestions(app, locarInstance.locar);

        // app.START_LOCATION = {
        //     lng: pos.coords.longitude,
        //     lat: pos.coords.latitude,
        // };

        // if (!firstPosition) {
        //     getRoute(app, app.router).then(() => {
        //         console.log('Route fetched successfully:', app.NAVIGATION_ROUTE);
        //     }).catch((error) => {
        //         console.error('Error fetching route:', error);
        //     });
        // }

        // if (app.NAVIGATION_ROUTE.length < 2) {
        //     app.dialog.alert("You have arrived to your destination.");
        //     return;
        // }

        // updateRouteLayer(liveMap1, app.NAVIGATION_ROUTE);
        // updateRouteLayer(liveMap2, app.NAVIGATION_ROUTE);
        // liveMap1.setCenter(app.USER_LOCATION);
        // liveMap2.setCenter(app.USER_LOCATION);

        // //? pos.coords.bearing
        // liveMap1.setBearing(app.NAVIGATION_ROUTE_STEPS[0].instruction.bearing_after);
        // liveMap2.setBearing(app.NAVIGATION_ROUTE_STEPS[0].instruction.bearing_after);

        // updateRouteData(app.DESTINATION_LOCATION, `${Math.round(app.NAVIGATION_ROUTE_DATA.duration/60)} min`, `${Math.round(app.NAVIGATION_ROUTE_DATA.distance)} m`, destinationName, navigationInfo);
        // populateRouteInstructions(app, firstTwoStepscontainer, navigationStepsContainer);

        let points = [];
        for (let i = 0; i < app.NAVIGATION_ROUTE.length; i++) {
            const coords = locarInstance.locar.lonLatToWorldCoords(
                app.NAVIGATION_ROUTE[i][0],
                app.NAVIGATION_ROUTE[i][1]
            );
            console.log('Route Coordinates:', coords); //*TEMP
            points.push(new THREE.Vector3(coords[0], coords[1], 0)); // Changed Z from 1 to 0 to make the line flat
        }


        const line = new MeshLineGeometry();
        line.setPoints(points);

        const material = new MeshLineMaterial(
            {
                color: app.PRIMARY_COLOR,
                lineWidth: 5.0, // Increased from 0.1
            }
        );

        const mesh = new THREE.Mesh( line, material );
    
        locarInstance.locar.add(mesh, pos.coords.longitude, pos.coords.latitude);  //? SHOULD IT BE PLACED AT USER LOCATION? (because start location is the same as user location it should?)

        firstPosition = false;

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