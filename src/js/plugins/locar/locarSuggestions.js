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

    //! issue with ading existing ones?
    for (const suggestion of app.AR_SUGGESTIONS) {    
        const coords = locar.lonLatToWorldCoords(
            suggestion.geometry.coordinates[0],
            suggestion.geometry.coordinates[1]
        );
        console.log('Suggestion coordinates:', coords);
        const geom = new THREE.BoxGeometry(20,20,20);

        const mesh = new THREE.Mesh(
            geom,
            new THREE.MeshBasicMaterial({color: 0xff0000})
        );

        locar.add(
            mesh,
            app.USER_LOCATION[0] + coords[0],
            app.USER_LOCATION[1] + coords[1]
        );
       
        console.log('Suggestion added to LocAR:', suggestion);
    };
}
