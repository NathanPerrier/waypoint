import * as THREE from 'three';
import { getLocarSuggestions } from './locarSuggestions';

import { MeshLineGeometry, MeshLineMaterial, raycast } from 'meshline'

export function runLocarRoute(app, locarInstance) { // Accept app instance
    // let firstLocation = true;

    locarInstance.locar.on("gpsupdate", (pos, distMoved) => {
        app.USER_LOCATION = [pos.coords.longitude, pos.coords.latitude];
        
        // if(firstLocation) {

        //     const boxProps = [
        //         { latDis: 0.001, lonDis: 0, colour: 0xff0000 },
        //         { latDis: -0.001, lonDis: 0, colour: 0xffff00 },
        //         { latDis: 0, lonDis: -0.001, colour: 0x00ffff },
        //         { latDis: 0, lonDis: 0.001, colour: 0x00ff00 },
        //     ];

        //     console.log('User Location:', app.USER_LOCATION);

        //     const geom = new THREE.BoxGeometry(20,20,20);

        //     for(const boxProp of boxProps) {
        //         const mesh = new THREE.Mesh(
        //             geom,
        //             new THREE.MeshBasicMaterial({color: boxProp.colour})
        //         );

        //         locarInstance.locar.add(
        //             mesh,
        //             pos.coords.longitude + boxProp.lonDis,
        //             pos.coords.latitude + boxProp.latDis
        //         );
        //     }

        //     firstLocation = false;
        // }
;
        const point1 = new THREE.Vector3(pos.coords.longitude, pos.coords.latitude, 0);
        const point2 = new THREE.Vector3(pos.coords.longitude+0.001, pos.coords.latitude, 0);

        const line = new MeshLineGeometry();
        line.setPoints([point1, point2]);

        const material = new MeshLineMaterial();

        const mesh = new THREE.Mesh( line, material );

        // mesh.raycast = raycast;

        locarInstance.locar.add(mesh, pos.coords.longitude, pos.coords.latitude);

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