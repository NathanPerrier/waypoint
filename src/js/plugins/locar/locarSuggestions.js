// logic to retrieve sugestions and get make three.js objects and find their relative position on 
// screen to be then handed to route and nav to be displayed to scene

// get locar instance

import { placeSuggestion } from "../maps/placeSuggestion";
import * as THREE from 'three';

export async function getLocarSuggestions(app, locar) {
    if (!locar) {
        console.error('Locar instance is not available. No suggestions can be retrieved.');
        return;
    }

    await placeSuggestion(app);

    if (!app.AR_SUGGESTIONS || app.AR_SUGGESTIONS.length === 0) {
        console.log('No suggestions available for AR.');
        return;
    }

    for (const suggestion of app.AR_SUGGESTIONS) {    
        // const coords = locar.lonLatToWorldCoords(
        //     suggestion.geometry.coordinates[0],
        //     suggestion.geometry.coordinates[1]
        // );

        if (app.PLACED_AR_SUGGESTIONS[suggestion.id]) {
            continue;
        }

        const mesh = getMarkerForSuggestion(suggestion);

        let height = 0;
        if (suggestion.properties.height) {
            height = suggestion.properties.height;
        }

        locar.add(
            mesh,

            //*TESTING
            // app.USER_LOCATION[0],
            // app.USER_LOCATION[1]+0.00001,
            suggestion.geometry.coordinates[0],
            suggestion.geometry.coordinates[1],
            height,
            mesh.userData
        );

        app.PLACED_AR_SUGGESTIONS[suggestion.id] = mesh;
       
        console.log('Suggestion added to LocAR:', suggestion);
    };
}


//* ADD ICON
function getMarkerForSuggestion(suggestion) {
    const { coordinates } = suggestion.geometry;
    const { name, type } = suggestion.properties;

    const markerRadius = 0.25;
    const innerRadius = 0.18; 

    const markerGeometry = new THREE.SphereGeometry(markerRadius, 32, 32, 0, Math.PI * 2, Math.PI);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
    markerMesh.position.set(0, 0, 0);

    const innerMarkerGeometry = new THREE.SphereGeometry(innerRadius, 32, 32, 0, Math.PI, Math.PI);
    const innerMarkerMaterial = new THREE.MeshBasicMaterial({ color: app.PRIMARY_COLOR });
    const innerMarkerMesh = new THREE.Mesh(innerMarkerGeometry, innerMarkerMaterial);
    innerMarkerMesh.position.set(0, 0, markerRadius - innerRadius * 0.7);

    const markerGroup = new THREE.Group();
    markerGroup.add(markerMesh);
    markerGroup.add(innerMarkerMesh);

    const pinHeight = 2;
    const pinRadius = 0.02;
    const pinGeometry = new THREE.CylinderGeometry(pinRadius, pinRadius, pinHeight, 8);
    const pinEdges = new THREE.EdgesGeometry(pinGeometry);
    const pinMaterial = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.2, gapSize: 0.01 });
    const pinMesh = new THREE.LineSegments(pinEdges, pinMaterial);
    pinMesh.computeLineDistances();
    pinMesh.position.y = -markerRadius - pinHeight / 2;

    markerGroup.add(pinMesh);

    const group = new THREE.Group();
    group.add(markerGroup);

    group.userData = {
        name: name,
        type: type,
        coordinates: coordinates,
    };

    return group;
}
