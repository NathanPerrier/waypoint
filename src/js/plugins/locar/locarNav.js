import * as THREE from 'three';
import { displayDialog } from '../../utils/dialog';


export function runLocarNav(app, locarInstance) {

    // --- GPS Update Listener --- 
    locarInstance.locar.on("gpsupdate", (pos, distMoved) => {
        // Update global app state (used by navigationManager)
        app.USER_LOCATION = [pos.coords.longitude, pos.coords.latitude];
        app.dialog.alert(("User Location:", app.USER_LOCATION, "Distance Moved:", distMoved));





        //display line
        // const points = [];
        // points.push(new THREE.Vector3(app.USER_LOCATION[0], app.USER_LOCATION[1], 1));
        // points.push(new THREE.Vector3(nextCoordinate[0], nextCoordinate[1], 1)); 
        // const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
       
        // const mesh = new THREE.Mesh(
        //     lineGeometry,
        //     new THREE.MeshBasicMaterial({color: 0xff0000})
        // );
        // console.log(mesh, lineGeometry, points);
        // locarInstance.locar.add(mesh, app.USER_LOCATION[0], app.USER_LOCATION[1]);

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