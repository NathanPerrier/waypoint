import { placeSuggestion } from "../maps/placeSuggestion";
import * as THREE from 'three';


/**
 * Fetches and displays location suggestions in the LocAR scene.
 * 
 * @async
 * 
 * @param {Object} app - The Framework7 app instance.
 * @param {Object} locar - The LocAR instance containing the scene and camera.
 * 
 * @returns {Promise<void>} - A promise that resolves when suggestions are processed.
 * @throws {Error} - If the locar instance is not available.
 * 
 */
export async function getLocarSuggestions(app, locar) {
    // Check if the locar instance is available
    if (!locar) {
        console.error('Locar instance is not available. No suggestions can be retrieved.');
        return;
    }

    // retrieve suggestions from Mapbox
    await placeSuggestion(app);

    // Check if suggestions are available
    if (!app.AR_SUGGESTIONS || app.AR_SUGGESTIONS.length === 0) {
        return;
    }

    // for each suggestion, create a marker and add it to the LocAR scene
    for (const suggestion of app.AR_SUGGESTIONS) {    
        // Check if the suggestion already exists in the LocAR scene
        if (app.PLACED_AR_SUGGESTIONS[suggestion.id]) {
            continue;
        }

        // Create a marker for the suggestion and add it to the LocAR scene
        const mesh = getMarkerForSuggestion(suggestion);

        // set height based on suggestion properties
        let height = 0;
        if (suggestion.properties.height) {
            height = suggestion.properties.height;
        }

        // add the marker to the LocAR scene
        locar.add(
            mesh,
            suggestion.geometry.coordinates[0],
            suggestion.geometry.coordinates[1],
            height,
            mesh.userData
        );

        // add to dictionary of existing placed suggestions
        app.PLACED_AR_SUGGESTIONS[suggestion.id] = mesh;
    };
}

/**
 * Creates a marker for a given suggestion.
 * 
 * @param {Object} suggestion - The suggestion object containing geometry and properties.
 * @return {THREE.Group} - A THREE.Group containing the marker mesh and pin.
 * 
 */
function getMarkerForSuggestion(suggestion) {
    // Extract coordinates, name and type from the suggestion
    const { coordinates } = suggestion.geometry;
    const { name, type } = suggestion.properties;

    // set default values 
    const markerRadius = 0.25;
    const innerRadius = 0.18; 

    // Create a sphere geometry with colour white that surrounds inner sphere
    const markerGeometry = new THREE.SphereGeometry(markerRadius, 32, 32, 0, Math.PI * 2, Math.PI);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
    markerMesh.position.set(0, 0, 0);

    // Create an inner sphere with primary color that sits on top of the marker
    const innerMarkerGeometry = new THREE.SphereGeometry(innerRadius, 32, 32, 0, Math.PI, Math.PI);
    const innerMarkerMaterial = new THREE.MeshBasicMaterial({ color: app.PRIMARY_COLOR });
    const innerMarkerMesh = new THREE.Mesh(innerMarkerGeometry, innerMarkerMaterial);
    innerMarkerMesh.position.set(0, 0, markerRadius - innerRadius * 0.7);

    // group the marker and inner marker together
    const markerGroup = new THREE.Group();
    markerGroup.add(markerMesh);
    markerGroup.add(innerMarkerMesh);

    // Create a dotted white line below the marker group
    const pinHeight = 2;
    const pinRadius = 0.02;
    const pinGeometry = new THREE.CylinderGeometry(pinRadius, pinRadius, pinHeight, 8);
    const pinEdges = new THREE.EdgesGeometry(pinGeometry);
    const pinMaterial = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.2, gapSize: 0.01 });
    const pinMesh = new THREE.LineSegments(pinEdges, pinMaterial);
    pinMesh.computeLineDistances();
    pinMesh.position.y = -markerRadius - pinHeight / 2;

    // add line to marker group
    markerGroup.add(pinMesh);

    // add group to a new THREE.Group
    const group = new THREE.Group();
    group.add(markerGroup);

    // Set the userData for the group
    group.userData = {
        name: name,
        type: type,
        coordinates: coordinates,
    };

    // return Three js suggestion pin
    return group;
}
