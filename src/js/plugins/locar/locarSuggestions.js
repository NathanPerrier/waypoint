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

    console.log('AR_Suggestions:', app.AR_SUGGESTIONS);

    //! issue with adding existing ones?
    for (const suggestion of app.AR_SUGGESTIONS) {    
        const coords = locar.lonLatToWorldCoords(
            suggestion.geometry.coordinates[0],
            suggestion.geometry.coordinates[1]
        );

        if (locar.hasSuggestion(coords)) {
            console.log('Suggestion already exists in LocAR:', suggestion);
            continue;
        }

        //! WORKS?
        console.log('Suggestion coordinates:', coords);
        const mesh = getMarkerForSuggestion(suggestion);

        let height = 0;
        if (suggestion.properties.height) {
            height = suggestion.properties.height;
        }
        console.log('Height:', height);

        locar.add(
            mesh,
            app.USER_LOCATION[0] + coords[0],
            app.USER_LOCATION[1] + coords[1],
            height
        );
       
        console.log('Suggestion added to LocAR:', suggestion);
    };
}

function getIconForType(type) {
    const iconMap = {
        'restaurant': 'fa-utensils',
        'park': 'fa-tree',
        'shop': 'fa-shopping-bag',
        'default': 'fa-map-marker'
    };
    return iconMap[type] || iconMap['default'];
}

function getMarkerForSuggestion(suggestion) {
    const group = new THREE.Group();

    // Create the circle
    const circleGeometry = new THREE.CircleGeometry(10, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({ color: app.PRIMARY_COLOR });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    group.add(circle);

    //! FIX
      // const iconType = getIconForType(suggestion.properties.type);
    // const iconTexture = new THREE.TextureLoader().load(`/icons/${iconType}.png`); // Assuming icons are stored in /icons
    // const iconMaterial = new THREE.MeshBasicMaterial({ map: iconTexture, transparent: true });
    const iconGeometry = new THREE.PlaneGeometry(5, 5);
    const iconMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const icon = new THREE.Mesh(iconGeometry, iconMaterial);
    icon.position.set(0, 0, 0.1); // Slightly above the circle
    group.add(icon);

    // Add the dotted line
    const lineMaterial = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 1, gapSize: 0.5 });
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -10, 0),
        new THREE.Vector3(0, -20, 0)
    ]);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.computeLineDistances(); // Required for dashed lines
    group.add(line);

    return group;
}
