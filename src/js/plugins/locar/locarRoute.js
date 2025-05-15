import * as THREE from 'three';
import { getLocarSuggestions } from './locarSuggestions';

import { MeshLineGeometry, MeshLineMaterial, raycast } from 'meshline'


export function runLocarRoute(app, locarInstance) { // Accept app instance
    // let firstLocation = true;

    locarInstance.locar.on("gpsupdate", (pos, distMoved) => {
        app.USER_LOCATION = [pos.coords.longitude, pos.coords.latitude];

        //* Use LOCAR.lonLatToWorldCoords to convert lat/lon to world coordinates
        // const point1 = new THREE.Vector3(0, 0, 0);
        // const point2 = new THREE.Vector3(10, 0, 0); // Changed Z from 1 to 0 to make the line flat

        // const line = new MeshLineGeometry();
        // line.setPoints([point1, point2]);

        // const material = new MeshLineMaterial(
        //     {
        //         color: app.PRIMARY_COLOR,
        //         lineWidth: 5.0, // Increased from 0.1
        //         sizeAttenuation: true,
        //         depthTest: false,
        //         transparent: true, // Kept true for smooth edges, opacity controls visibility
        //         opacity: 1.0,    // Increased from 0.5 for full visibility
        //     }
        // );

        // const mesh = new THREE.Mesh( line, material );

        // mesh.raycast = raycast;

        // locarInstance.locar.add(mesh, pos.coords.longitude, pos.coords.latitude);


        if (distMoved > app.NAVIGATION_DISTANCE_BUFFER) {
            getLocarSuggestions(app, locarInstance.locar);
        }
    });

    locarInstance.locar.startGps();

    locarInstance.renderer.setAnimationLoop(animate);

    function animate() {
        locarInstance.cam.update();
        locarInstance.controls.update();
        locarInstance.renderer.render(locarInstance.scene, locarInstance.camera);
    }
    animate();
}