import * as THREE from 'three';
import { displayDialog } from '../../utils/dialog';


export function runLocarNav(app, locarInstance) {

    // --- GPS Update Listener --- 
    locarInstance.locar.on("gpsupdate", (pos, distMoved) => {
        // Update global app state (used by navigationManager)
        app.USER_LOCATION = [pos.coords.longitude, pos.coords.latitude];
        app.USER_LOCATION_ALT = pos.coords.altitude;
        app.USER_LOCATION_ACCURACY = pos.coords.accuracy;
        app.USER_LOCATION_ALT_ACCURACY = pos.coords.altitudeAccuracy;
        app.USER_LOCATION_HEADING = pos.coords.heading;
        app.USER_LOCATION_SPEED = pos.coords.speed;
        app.USER_LOCATION_TIMESTAMP = pos.timestamp;

        // create a three.js line from user position to the next coordinate
        let nextCoordinate = app.NAVIGATION_ROUTE[1];  //! TEMP

        //display line
        const points = [];
        points.push(new THREE.Vector3(app.USER_LOCATION[0], app.USER_LOCATION[1], 1));
        points.push(new THREE.Vector3(nextCoordinate[0], nextCoordinate[1], 1)); 
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
       
        const mesh = new THREE.Mesh(
            lineGeometry,
            new THREE.MeshBasicMaterial({color: 0xff0000})
        );
        console.log(mesh, lineGeometry, points);
        locarInstance.locar.add(mesh, app.USER_LOCATION[0], app.USER_LOCATION[1]);
        console.log("Added line to locar instance");

        console.log("User Location:", app.USER_LOCATION);
        console.log("User Location Altitude:", app.USER_LOCATION_ALT);
        console.log("locar", locarInstance.locar);
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