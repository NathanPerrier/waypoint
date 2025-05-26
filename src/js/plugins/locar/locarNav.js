import * as THREE from 'three';

import { getRoute } from '../maps/mapboxRoute.js';
import { updateRouteData, populateRouteInstructions, getInstructionIcon } from '../../utils/dom.js';
import { updateRouteLayer } from '../maps/routeOverviewMap.js';
import { getLocarSuggestions } from './locarSuggestions.js';
import { debugCameraPosition, showOriginCube, logCameraChange } from './debugLocar.js';


// set initial values for global variables
let compassLines = null;
let userLine = null; 
let lineMaterial = null;
let time = 0;

/**
 * Function to run LocAR navigation
 * Displays and updates the navigation elements and AR direction line
 * Uses the LocAR instance to track user position and direction 
 * 
 * @param {Object} app - The Framework7 app instance
 * @param {Object} locarInstance - The LocAR instance containing the scene and camera
 * @param {string} destinationName - The name of the destination for display purposes
 * @param {Object} navigationInfo - Additional information about the navigation
 * @param {HTMLElement} firstTwoStepscontainer - Container for the first two navigation steps
 * @param {HTMLElement} navigationStepsContainer - Container for all navigation steps
 * @param {HTMLElement} directionArrow - Element to display the direction arrow icon
 * 
 * @throws {Error} Throws an error if the locarInstance or camera is not available
 * 
 */
export function runLocarNav(app, locarInstance, destinationName, navigationInfo, firstTwoStepscontainer, navigationStepsContainer, directionArrow) {
    // user position
    let lastCameraPosition = new THREE.Vector3(0, 0, 0);
    
    // Correctly use setInterval by wrapping the function call
    const cameraCheckInterval = setInterval(() => {
        // Call logCameraChange inside the interval callback
        if (locarInstance && locarInstance.camera) {
            lastCameraPosition = logCameraChange(app, locarInstance, lastCameraPosition);
        }
    }, 1000);

    // Add a reference point object to represent user position
    const userPositionMarker = new THREE.Object3D();
    userPositionMarker.name = "userPositionMarker";
    userPositionMarker.position.set(0, app.USER_POSITION_Y, 0);
    locarInstance.scene.add(userPositionMarker);

    // On GPS update, update user position, navigation elements, and AR direction line
    locarInstance.locar.on("gpsupdate", (pos, distMoved) => {
        app.USER_LOCATION = [pos.coords.longitude, pos.coords.latitude];

        // Update the start location with the current GPS position
        app.START_LOCATION = {
            lng: pos.coords.longitude,
            lat: pos.coords.latitude,
        };

        // If the user has arrived at the destination, show a notification and navigate to the route view
        if (app.NAVIGATION_ROUTE.length < 3) {
            app.notification.create({
                icon: '<i class="fa-solid  icon-center fa-location-dot"></i>',
                title: 'Arrived at destination',
                text: 'You have reached your destination. ',
                closeTimeout: 5000,
            }).open();
            // $f7.views.main.router.navigate('/route/'); 
            app.tab.show('#view-route'); 
            return;
        }

        // If the user has moved a significant distance, update elements, suggestions and route
        if (distMoved > app.NAVIGATION_DISTANCE_BUFFER) { 
            getLocarSuggestions(app, locarInstance.locar);

            getRoute(app, app.router).catch((error) => {
                console.error('Error fetching route:', error);
            });

            // Update the user position marker in the scene as well as new route
            if (app.liveMap1 && app.liveMap2) {
                updateRouteLayer(app.liveMap1, app.NAVIGATION_ROUTE);
                updateRouteLayer(app.liveMap2, app.NAVIGATION_ROUTE);
                app.liveMap1.setCenter(app.USER_LOCATION);
                app.liveMap2.setCenter(app.USER_LOCATION);

                app.liveMap1.setBearing(app.NAVIGATION_ROUTE_STEPS[0].instruction.bearing_after);
                app.liveMap2.setBearing(app.NAVIGATION_ROUTE_STEPS[0].instruction.bearing_after);
            }

            // Update route data in the UI
            updateRouteData(app.DESTINATION_LOCATION, `${Math.round(app.NAVIGATION_ROUTE_DATA.duration/60)} min`, `${Math.round(app.NAVIGATION_ROUTE_DATA.distance)} m`, destinationName, navigationInfo);
            populateRouteInstructions(app, firstTwoStepscontainer, navigationStepsContainer);

            directionArrow.innerHTML = `${getInstructionIcon(app.NAVIGATION_ROUTE_STEPS[0].instruction.instruction)}`;
        }

        // Update camera position to the user's current GPS position
        if (locarInstance.camera.position.length() > 5) {
            locarInstance.camera.position.set(0, 0, 0);
        } 

        // Remove any existing user line from the scene
        if (userLine) {
            locarInstance.scene.remove(userLine);
        }

        // Debig Function
        showOriginCube(app, locarInstance);
        
        // Create a new AR direction line based on the user's current position and navigation route
        let targetLongitude, targetLatitude;
        try {
            if (app.NAVIGATION_ROUTE && app.NAVIGATION_ROUTE.length > 0 && Array.isArray(app.NAVIGATION_ROUTE[1])) {
                targetLongitude = app.NAVIGATION_ROUTE[1][0];
                targetLatitude = app.NAVIGATION_ROUTE[1][1];
            } else {
                // Fallback to fixed offset if route is not available
                console.warn("No valid navigation route found, using fixed offset");
                targetLongitude = pos.coords.longitude + 0.001;
                targetLatitude = pos.coords.latitude;
            }
        } catch (error) {
            console.error("Error accessing navigation route:", error);
            targetLongitude = pos.coords.longitude + 0.001;
            targetLatitude = pos.coords.latitude;
        }

        // Calculate the real-world distance between the user and target coordinates using Haversine formula
        const earthRadiusMeters = 6371000;
        const dLat = (targetLatitude - pos.coords.latitude) * Math.PI / 180;
        const dLon = (targetLongitude - pos.coords.longitude) * Math.PI / 180;
        const lat1 = pos.coords.latitude * Math.PI / 180;
        const lat2 = targetLatitude * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const realWorldDistanceMeters = earthRadiusMeters * c;

        // Convert user and target coordinates to world positions
        const userWorldPos = locarInstance.locar.lonLatToWorldCoords(
            pos.coords.longitude,
            pos.coords.latitude
        );
        
        const targetWorldPos = locarInstance.locar.lonLatToWorldCoords(
            targetLongitude,
            targetLatitude
        ); 

        // If the conversion fails, use a default fallback
        const fixedDistance = realWorldDistanceMeters * 0.1; 
        
        // If both positions are valid, calculate the direction line
        if (targetWorldPos && userWorldPos) {
            // Create vectors for both positions
            const userVector = new THREE.Vector3(userWorldPos.x || 0, 0, userWorldPos.y || 0);
            const targetVector = new THREE.Vector3(targetWorldPos.x || 0, 0, targetWorldPos.y || 0);
            
            // Calculate vector from user to target
            const directionVector = new THREE.Vector3().subVectors(targetVector, userVector);
            
            
            // Calculate distance to target using the vector
            const vectorDistance = directionVector.length();

            // Use either the vector distance if it's non-zero, or our calculated real-world distance
            let distance;
            try {
                distance = (vectorDistance > 0.01) ? vectorDistance : fixedDistance;
                if (!isFinite(distance) || isNaN(distance) || distance <= 0) {
                    console.warn("Invalid distance calculated, using default of 1 meter");
                    distance = 1.0;
                }
            } catch (error) {
                console.error("Error calculating distance:", error);
                distance = 1.0;           
            }

            // Create a material for the direction line
            lineMaterial = new THREE.MeshBasicMaterial({ 
                color: app.PRIMARY_COLOR, 
                wireframe: false,
                transparent: true,
                opacity: .8, 
                depthTest: false, 
                side: THREE.DoubleSide, 
                alphaTest: 0.01 
            });
            
            // Create a box geometry with the origin at one end instead of in the middle
            const boxGeometry = new THREE.BoxGeometry(0.2, 0.1, distance);

            // Shift the geometry so its origin is at the start of the box instead of its center
            boxGeometry.translate(0, 0, distance/2);
            
            // Create the direction line mesh with the box geometry and material
            const directionLine = new THREE.Mesh(
                boxGeometry,
                lineMaterial
            );
            
            // Calculate an accurate direction based on the longitude/latitude difference
            // find the bearing in degrees using Haversine bearing formula
            const y = Math.sin(dLon) * Math.cos(lat2);
            const x = Math.cos(lat1) * Math.sin(lat2) - 
                        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
            const bearingRad = Math.atan2(y, x);
            
            // Convert bearing to a normalized direction vector in the XZ plane
            const directionX = Math.sin(bearingRad);
            const directionZ = Math.cos(bearingRad);
            const direction = new THREE.Vector3(directionX, 0, directionZ).normalize(); 
            
            try {
                // Position the line at the user position (origin in AR space)
                directionLine.position.set(0, app.USER_POSITION_Y, 0);
                
                // Create rotation to align the box with our direction vector
                const quaternion = new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 0, 1), 
                    direction 
                );
                directionLine.quaternion.copy(quaternion);
            } catch (error) {
                console.error("Error positioning direction line:", error);
                // Fallback position and rotation if the calculations fail
                directionLine.position.set(0, app.USER_POSITION_Y, 0);
                directionLine.lookAt(new THREE.Vector3(0, app.USER_POSITION_Y, distance));
            }

            // Add the direction line to the scene with a name for easy identification
            directionLine.name = "userDirectionLine";
            locarInstance.scene.add(directionLine);
            userLine = directionLine;  
        
            // remove any existing end marker from the scene
            const existingEndMarker = locarInstance.scene.getObjectByName("endMarker");
            if (existingEndMarker) {
                locarInstance.scene.remove(existingEndMarker);
            }
            
            // If debug mode is enabled, add an end marker at the calculated end point
            if (app.debug) {
                const endMarker = new THREE.Mesh(
                    new THREE.SphereGeometry(0.115, 16, 16), 
                    new THREE.MeshBasicMaterial({
                        color: app.PRIMARY_COLOR,
                        depthTest: false
                    })
                );

                endMarker.name = "endMarker";  

                try {
                    const endPoint = direction.clone().multiplyScalar(distance);
                    endMarker.position.set(endPoint.x, app.USER_POSITION_Y, endPoint.z);
                } catch (error) {
                    console.error("Error positioning end marker:", error);
                    // Fallback position if vector calculation fails
                    endMarker.position.set(0, app.USER_POSITION_Y, distance);
                }
                locarInstance.scene.add(endMarker);
            }

        } else {
            console.error('Failed to convert target coordinates to world position');            
            
            // Fallback to a default direction line if conversion fails
            const defaultFallbackLength = 2.0; 

            // Create a material for the fallback direction line    
            lineMaterial = new THREE.MeshBasicMaterial({ 
                color: app.PRIMARY_COLOR, 
                wireframe: false,
                transparent: true,
                opacity: .8, 
                depthTest: false, 
                side: THREE.DoubleSide 
            });

            // Create a box geometry with the origin at one end instead of in the middle
            const fallbackGeometry = new THREE.BoxGeometry(0.2, 0.1, defaultFallbackLength);

            // Shift the geometry so its origin is at the start of the box instead of its center
            fallbackGeometry.translate(0, 0, defaultFallbackLength/2);
            
            // Create the fallback direction line mesh with the box geometry and material
            const directionLine = new THREE.Mesh(
                fallbackGeometry,
                lineMaterial
            );
            
            // Position the fallback line at the user position (origin in AR space)
            directionLine.position.set(0, app.USER_POSITION_Y, 0);     
            
            // give the fallback line a name and add it to the scene
            directionLine.name = "fallbackDirectionLine";
            locarInstance.scene.add(directionLine);
            userLine = directionLine;

            // remove any existing end marker from the scene
            const existingEndMarker = locarInstance.scene.getObjectByName("endMarker");
            if (existingEndMarker) {
                locarInstance.scene.remove(existingEndMarker);
            }
            
            // If debug mode is enabled, add an end marker at the default fallback length
            if (app.debug) {
                const endMarker = new THREE.Mesh(
                    new THREE.SphereGeometry(0.115, 16, 16),
                    new THREE.MeshBasicMaterial({
                        color: app.PRIMARY_COLOR,
                        depthTest: false
                    })
                );
                endMarker.name = "endMarker";
                endMarker.position.set(0, app.USER_POSITION_Y, defaultFallbackLength);
                locarInstance.scene.add(endMarker);
            }
        }   
    });

    // start the LocAR GPS and Animation loop
    locarInstance.locar.startGps();
    locarInstance.renderer.setAnimationLoop(animate);

    // Set up the camera check interval to log camera changes
    locarInstance.cameraCheckInterval = cameraCheckInterval;
    
    // Cleanup function to clear the camera check interval
    locarInstance.cleanup = () => {
        if (locarInstance.cameraCheckInterval) {
            clearInterval(locarInstance.cameraCheckInterval);
            locarInstance.cameraCheckInterval = null;
        }
    };  
        

    /**
     * Animation loop for LocAR navigation
     * This function updates the camera position, controls, and renders the scene.
     * It also applies a pulsation effect to the AR direction line material.
     * 
     * @throws {Error} Throws an error if there is an issue during the animation loop
     * 
     */
    function animate() {
        try {
            // Update camera and controls
            locarInstance.cam.update();
            locarInstance.controls.update();

            // Update time for pulsation effect
            time += 0.03;
            
            // Create a pulsation effect on the AR direction line material in a sinusoidal manner
            if (lineMaterial) {
                lineMaterial.opacity = 0.6 + 0.25 * Math.sin(time);
                
                // Ensure material's transparent property is true for opacity to work
                lineMaterial.transparent = true;
                lineMaterial.needsUpdate = true;
            }
            
            // debug the camera position and update compass lines
            debugCameraPosition(app, locarInstance, compassLines, userLine);

            // Render the scene with the camera
            locarInstance.renderer.render(locarInstance.scene, locarInstance.camera);

        } catch (error) {
            console.error("Error in animation loop:", error);
        }
    };
    // Start the animation loop (initial render)
    animate(); 
}
