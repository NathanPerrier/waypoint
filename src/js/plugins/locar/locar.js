import * as THREE from 'three';
import Config from '../../config.js';

document.addEventListener('DOMContentLoaded', async () => {
    const config = Config.config;

    console.log("config", config);

    if (!config.DESKTOP_DEVICE) {
        console.error("LocAR is not supported on desktop devices.");
        return;
    }

    await runLocar(config);
});

// window.addEventListener("resize", e => {
//     config.RENDERER.setSize(window.innerWidth, window.innerHeight);
//     config.LOCAR_CAMERA.aspect = window.innerWidth / window.innerHeight;
//     config.LOCAR_CAMERA.updateProjectionMatrix();
// });

// window.addEventListener("orientationchange", e => {
//     config.LOCAR_CAMERA.aspect = window.innerWidth / window.innerHeight;
//     config.LOCAR_CAMERA.updateProjectionMatrix();
// });



async function runLocar(config) {
    let firstLocation = true;

    config.LOCAR.on("gpsupdate", (pos, distMoved) => {
        if(firstLocation) {

            const boxProps = [
                { latDis: 0.001, lonDis: 0, colour: 0xff0000 },
                { latDis: -0.001, lonDis: 0, colour: 0xffff00 },
                { latDis: 0, lonDis: -0.001, colour: 0x00ffff },
                { latDis: 0, lonDis: 0.001, colour: 0x00ff00 },
            ];

            const geom = new THREE.BoxGeometry(20,20,20);

            for(const boxProp of boxProps) {
                const mesh = new THREE.Mesh(
                    geom, 
                    new THREE.MeshBasicMaterial({color: boxProp.colour})
                );
            
                config.LOCAR.add(
                    mesh, 
                    pos.coords.longitude + boxProp.lonDis, 
                    pos.coords.latitude + boxProp.latDis
                );
            }
            
            firstLocation = false;
        }
    });

    config.LOCAR.startGps();

    config.RENDERER.setAnimationLoop(animate);

    function animate() {
        config.CAM.update();
        config.DEVICE_ORIENTATION_CONTROLS.update();
        config.RENDERER.render(config.LOCAR_SCENE, config.LOCAR_CAMERA);
    }
}