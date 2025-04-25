import * as THREE from 'three';

export function runLocarRoute(app) { // Accept app instance
    let firstLocation = true;

    app.LOCAR.on("gpsupdate", (pos, distMoved) => {
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

                app.LOCAR.add(
                    mesh,
                    pos.coords.longitude + boxProp.lonDis,
                    pos.coords.latitude + boxProp.latDis
                );
            }

            firstLocation = false;
        }
    });

    app.LOCAR.startGps();

    app.RENDERER.setAnimationLoop(animate);

    function animate() {
        app.CAM.update();
        app.DEVICE_ORIENTATION_CONTROLS.update();
        app.RENDERER.render(app.LOCAR_SCENE, app.LOCAR_CAMERA);
    }
    animate();
}