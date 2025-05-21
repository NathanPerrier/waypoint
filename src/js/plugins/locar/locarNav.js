import * as THREE from 'three';

import { getRoute } from '../maps/mapboxRoute.js';
import { updateRouteData, populateRouteInstructions } from '../../utils/dom.js';
import { updateRouteLayer } from '../maps/routeOverviewMap.js';
import { getLocarSuggestions } from './locarSuggestions.js';
import { debugCameraPosition, showCompassLines, showOriginCube, logCameraChange } from './debugLocar.js';

let compassLines = null;
let userLine = null; 
let firstPosition = true;
let lineMaterial = null;
let time = 0;

export function runLocarNav(app, locarInstance, destinationName, navigationInfo, firstTwoStepscontainer, navigationStepsContainer) {

    let lastCameraPosition = new THREE.Vector3(0, 0, 0);
    
    // Correctly use setInterval by wrapping the function call
    const cameraCheckInterval = setInterval(() => {
        // Call logCameraChange inside the interval callback
        if (locarInstance && locarInstance.camera) {
            lastCameraPosition = logCameraChange(app, locarInstance, lastCameraPosition);
        }
    }, 1000);

    locarInstance.locar.on("gpsupdate", (pos, distMoved) => {
        app.USER_LOCATION = [pos.coords.longitude, pos.coords.latitude];

        app.START_LOCATION = {
            lng: pos.coords.longitude,
            lat: pos.coords.latitude,
        };

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

        console.log('User Location:', app.USER_LOCATION);
        console.log('Distance Moved:', distMoved);
        
        if (distMoved > app.NAVIGATION_DISTANCE_BUFFER) { 
            getLocarSuggestions(app, locarInstance.locar);

            getRoute(app, app.router).then(() => {
                console.log('Route fetched successfully:', app.NAVIGATION_ROUTE);
            }).catch((error) => {
                console.error('Error fetching route:', error);
            });

            if (app.liveMap1 && app.liveMap2) {
                updateRouteLayer(app.liveMap1, app.NAVIGATION_ROUTE);
                updateRouteLayer(app.liveMap2, app.NAVIGATION_ROUTE);
                app.liveMap1.setCenter(app.USER_LOCATION);
                app.liveMap2.setCenter(app.USER_LOCATION);

                //? pos.coords.bearing
                app.liveMap1.setBearing(app.NAVIGATION_ROUTE_STEPS[0].instruction.bearing_after);
                app.liveMap2.setBearing(app.NAVIGATION_ROUTE_STEPS[0].instruction.bearing_after);
            }

            updateRouteData(app.DESTINATION_LOCATION, `${Math.round(app.NAVIGATION_ROUTE_DATA.duration/60)} min`, `${Math.round(app.NAVIGATION_ROUTE_DATA.distance)} m`, destinationName, navigationInfo);
            populateRouteInstructions(app, firstTwoStepscontainer, navigationStepsContainer);
        }

        //* NAV AR START
        if (locarInstance.camera.position.length() > 5) {
            locarInstance.camera.position.set(0, 0, 0);
        } 

        if (userLine) {
            locarInstance.scene.remove(userLine);
        }

        showOriginCube(app, locarInstance);
          //* TARGET COORDS
        let targetLongitude, targetLatitude;
        try {
            // Find the next waypoint in the navigation route
            if (app.NAVIGATION_ROUTE && app.NAVIGATION_ROUTE.length > 0) {
                // Start with the first waypoint (index 0 to make sure we get a valid point)
                let targetIndex = 0;
                  // If we have route steps with maneuver points, find the next one
                if (app.NAVIGATION_ROUTE_STEPS && app.NAVIGATION_ROUTE_STEPS.length > 0) {
                    // Use the coordinates from the next navigation step
                    const nextStep = app.NAVIGATION_ROUTE_STEPS[0];
                    if (nextStep && nextStep.maneuver && nextStep.maneuver.location) {
                        // Calculate distance to the maneuver point
                        const maneuverLon = nextStep.maneuver.location[0];
                        const maneuverLat = nextStep.maneuver.location[1];
                        
                        const mLat = (maneuverLat - pos.coords.latitude) * Math.PI / 180;
                        const mLon = (maneuverLon - pos.coords.longitude) * Math.PI / 180;
                        const am = Math.sin(mLat/2) * Math.sin(mLat/2) +
                                Math.sin(mLon/2) * Math.sin(mLon/2) * 
                                Math.cos(pos.coords.latitude * Math.PI / 180) * 
                                Math.cos(maneuverLat * Math.PI / 180);
                        const cm = 2 * Math.atan2(Math.sqrt(am), Math.sqrt(1-am));
                        const maneuverDistance = 6371000 * cm; // Distance in meters
                        
                        // Only use the maneuver point if it's within 50 meters
                        if (maneuverDistance <= 50) {
                            targetLongitude = maneuverLon;
                            targetLatitude = maneuverLat;
                            console.log('Using next maneuver point:', targetLongitude, targetLatitude, 'distance:', maneuverDistance.toFixed(2), 'm');
                        } else {
                            console.log('Maneuver point too far (' + maneuverDistance.toFixed(2) + 'm), looking for closer route point');
                            // Look for a closer point in the navigation route
                            let foundCloserPoint = false;
                            
                            // Find an intermediate point from the route
                            for (let i = 0; i < app.NAVIGATION_ROUTE.length; i++) {
                                if (Array.isArray(app.NAVIGATION_ROUTE[i])) {
                                    const pointLon = app.NAVIGATION_ROUTE[i][0];
                                    const pointLat = app.NAVIGATION_ROUTE[i][1];
                                    
                                    // Calculate distance to this point
                                    const dLat = (pointLat - pos.coords.latitude) * Math.PI / 180;
                                    const dLon = (pointLon - pos.coords.longitude) * Math.PI / 180;
                                    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                            Math.sin(dLon/2) * Math.sin(dLon/2) * 
                                            Math.cos(pos.coords.latitude * Math.PI / 180) * 
                                            Math.cos(pointLat * Math.PI / 180);
                                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                                    const distance = 6371000 * c; // Distance in meters
                                    
                                    // Look for a point between 10-50m away for better navigation
                                    if (distance > 10 && distance <= 50) {
                                        targetLongitude = pointLon;
                                        targetLatitude = pointLat;
                                        console.log('Found ideal intermediate route point', i, 'distance:', distance.toFixed(2), 'm');
                                        foundCloserPoint = true;
                                        break;
                                    } else if (distance > 10 && !foundCloserPoint) {
                                        // If we don't find an ideal point, use the first point that's at least 10m away
                                        targetLongitude = pointLon;
                                        targetLatitude = pointLat;
                                        foundCloserPoint = true;
                                        console.log('Using route point', i, 'distance:', distance.toFixed(2), 'm');
                                        // Don't break here - keep looking for a better point
                                    }
                                }
                            }
                        }
                    } else {
                        // If no maneuver point, find next route point that's at least 10m away
                        for (let i = 0; i < app.NAVIGATION_ROUTE.length; i++) {
                            if (Array.isArray(app.NAVIGATION_ROUTE[i])) {
                                const pointLon = app.NAVIGATION_ROUTE[i][0];
                                const pointLat = app.NAVIGATION_ROUTE[i][1];
                                
                                // Calculate distance to this point
                                const dLat = (pointLat - pos.coords.latitude) * Math.PI / 180;
                                const dLon = (pointLon - pos.coords.longitude) * Math.PI / 180;
                                const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                                        Math.sin(dLon/2) * Math.sin(dLon/2) * 
                                        Math.cos(pos.coords.latitude * Math.PI / 180) * 
                                        Math.cos(pointLat * Math.PI / 180);
                                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                                const distance = 6371000 * c; // Distance in meters
                                
                                // Prefer points that are 10-50m away for better navigation
                                if (distance > 10 && distance <= 50) {
                                    targetLongitude = pointLon;
                                    targetLatitude = pointLat;
                                    console.log('Using route point', i, 'ideal distance:', distance.toFixed(2), 'm');
                                    break;
                                } else if (distance > 10) {
                                    targetLongitude = pointLon;
                                    targetLatitude = pointLat;
                                    console.log('Using route point', i, 'distance:', distance.toFixed(2), 'm');
                                    break;
                                }
                            }
                        }
                    }
                }
                
                // If we haven't set target coordinates yet, use a point from the route
                if (!targetLongitude || !targetLatitude) {
                    // Find first point that's not too close to current position
                    for (let i = 0; i < app.NAVIGATION_ROUTE.length; i++) {
                        if (Array.isArray(app.NAVIGATION_ROUTE[i])) {
                            targetLongitude = app.NAVIGATION_ROUTE[i][0];
                            targetLatitude = app.NAVIGATION_ROUTE[i][1];
                            break;
                        }
                    }
                }
            } 
            
            // Fallback if we still don't have valid coordinates
            if (!targetLongitude || !targetLatitude) {
                console.warn("No valid navigation route found, using fixed offset");
                targetLongitude = pos.coords.longitude + 0.001;
                targetLatitude = pos.coords.latitude;
            }
        } catch (error) {
            console.error("Error accessing navigation route:", error);
            targetLongitude = pos.coords.longitude + 0.001;
            targetLatitude = pos.coords.latitude;
        }

        const earthRadiusMeters = 6371000; // Earth radius in meters
        const dLat = (targetLatitude - pos.coords.latitude) * Math.PI / 180;
        const dLon = (targetLongitude - pos.coords.longitude) * Math.PI / 180;
        const lat1 = pos.coords.latitude * Math.PI / 180;
        const lat2 = targetLatitude * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        const realWorldDistanceMeters = earthRadiusMeters * c;

        // REMOVE: const alphaMap = createAlphaGradientTexture(256);

        const userWorldPos = locarInstance.locar.lonLatToWorldCoords(
            pos.coords.longitude,
            pos.coords.latitude
        );
        
        const targetWorldPos = locarInstance.locar.lonLatToWorldCoords(
            targetLongitude,
            targetLatitude
        );
        
        console.log('User world pos:', JSON.stringify(userWorldPos));
        console.log('Target world pos:', JSON.stringify(targetWorldPos));        // Scale the real world distance for AR representation
        // Use a variable scale factor based on distance to ensure good visibility
        const AR_SCALE = realWorldDistanceMeters < 50 ? 0.2 : 
                        (realWorldDistanceMeters < 100 ? 0.15 : 0.1);
        const fixedDistance = realWorldDistanceMeters * AR_SCALE;
        console.log('Real world distance:', realWorldDistanceMeters.toFixed(2), 'm, AR distance:', fixedDistance.toFixed(2), 'AR scale:', AR_SCALE);
        
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
                // Safety check - ensure we have a valid number
                if (!isFinite(distance) || isNaN(distance) || distance <= 0) {
                    console.warn("Invalid distance calculated, using default of 1 meter");
                    distance = 1.0; // Default to 1 meter if we get an invalid number
                }
            } catch (error) {
                console.error("Error calculating distance:", error);
                distance = 1.0; // Default fallback            
            }
            // const alphaMap = createAlphaGradientTexture(distance); // Pass the actual distance
            // alphaMap.needsUpdate = true; // Ensure the texture is updated

            lineMaterial = new THREE.MeshBasicMaterial({ 
                color: app.PRIMARY_COLOR, 
                // alphaMap: alphaMap,
                wireframe: false,
                transparent: true,
                opacity: .8, 
                depthTest: false, // Ensure always visible
                side: THREE.DoubleSide, // Visible from both sides
                alphaTest: 0.01 // Discard pixels below this threshold
            });
            const boxGeometry = new THREE.BoxGeometry(0.2, 0.1, distance); // Width, height, length
            
            const directionLine = new THREE.Mesh(
                boxGeometry,
                lineMaterial
            );
              // Calculate direction directly from world coordinates which is more reliable in AR space
            let direction;
            
            // Method 1: Use AR world coordinates (preferred if available)
            if (userWorldPos && targetWorldPos && 
                typeof userWorldPos.x !== 'undefined' && 
                typeof targetWorldPos.x !== 'undefined') {
                
                // Create normalized direction vector from user to target in the AR world
                const worldDirectionX = targetWorldPos.x - userWorldPos.x;
                const worldDirectionZ = targetWorldPos.y - userWorldPos.y; // Note: Locar uses y for the z-coordinate
                
                direction = new THREE.Vector3(worldDirectionX, 0, worldDirectionZ).normalize();
                console.log('Using AR world coordinates for direction');
            } 
            // Method 2: Fallback to traditional bearing calculation
            else {
                // Calculate bearing angle
                const y = Math.sin(dLon) * Math.cos(lat2);
                const x = Math.cos(lat1) * Math.sin(lat2) - 
                          Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
                const bearingRad = Math.atan2(y, x);
                const bearingDeg = (bearingRad * 180/Math.PI + 360) % 360;
                
                // In AR space, north might not be aligned with Three.js Z-axis
                // Adjust based on common AR conventions where:
                // North = -Z, East = +X, South = +Z, West = -X
                const directionX = Math.sin(bearingRad);
                const directionZ = -Math.cos(bearingRad);  // Note the negative sign for Z
                
                direction = new THREE.Vector3(directionX, 0, directionZ).normalize();
                console.log('Using calculated bearing for direction:', bearingDeg.toFixed(2), 'degrees');
            }
            
            // Log the final direction vector
            console.log('Final direction vector:', direction);
              try {
                // Set the origin of the line to exactly where the user is standing
                // This ensures the line starts precisely at the user's position
                
                // Position the line - we want it to start at the camera position (origin in AR)
                // and extend halfway along the direction vector
                const halfwayPoint = direction.clone().multiplyScalar(distance / 2);
                
                // Position at origin and offset slightly for visibility
                // The Y position controls the vertical position - below eye level for better visibility
                directionLine.position.set(0, -0.5, 0);
                
                // For debugging, add more info
                console.log('Line positioned at:', directionLine.position);
                console.log('Line length:', distance);
                
                // Create rotation to align the box with our direction vector
                // This uses quaternion rotation which is more robust
                const quaternion = new THREE.Quaternion().setFromUnitVectors(
                    new THREE.Vector3(0, 0, 1), // Default forward direction of box
                    direction // Our target direction
                );
                directionLine.quaternion.copy(quaternion);
                
                // After setting the quaternion, translate the box forward by half its length
                // This ensures it starts at the user position and extends forward
                directionLine.translateZ(distance / 2);
            } catch (error) {
                console.error("Error positioning direction line:", error);
                // Fallback position and rotation if the calculations fail
                directionLine.position.set(0, -0.5, distance / 2);
                directionLine.lookAt(new THREE.Vector3(0, -0.5, distance));
            }

            directionLine.name = "userDirectionLine";
            locarInstance.scene.add(directionLine);
            userLine = directionLine;  //! use this to remove from locarInstance.scene on new route (still needed?)
        
            const existingEndMarker = locarInstance.scene.getObjectByName("endMarker");
            if (existingEndMarker) {
                locarInstance.scene.remove(existingEndMarker);
            }
            
            if (app.debug) {
                const endMarker = new THREE.Mesh(
                    new THREE.SphereGeometry(0.115, 16, 16), 
                    new THREE.MeshBasicMaterial({
                        color: app.PRIMARY_COLOR,
                        depthTest: false
                    })
                );

                endMarker.name = "endMarker";                try {
                    // Position the end marker to match the end of our direction line
                    // Create a position that matches where the end of the line should be
                    const endPoint = direction.clone().multiplyScalar(distance);
                    endMarker.position.set(0, -0.5, 0); // Start at origin
                    
                    // Apply the same rotation as the direction line
                    endMarker.quaternion.copy(directionLine.quaternion);
                    
                    // Then translate along the local Z axis
                    endMarker.translateZ(distance);
                    
                    console.log('End marker positioned at:', endMarker.position);
                } catch (error) {
                    console.error("Error positioning end marker:", error);
                    // Fallback position if vector calculation fails
                    endMarker.position.set(0, -0.5, distance);
                }
                locarInstance.scene.add(endMarker);
            }
                console.log('Created line pointing to specific coordinate:', 
                targetLongitude.toFixed(6), 
                targetLatitude.toFixed(6),
                'Distance:', distance.toFixed(2), 'meters',
                'Direction:', direction,
                'User position:', pos.coords.longitude.toFixed(6), pos.coords.latitude.toFixed(6)
            );
            
            // Log device orientation for debugging
            if (pos.coords.heading !== undefined) {
                console.log('Device heading:', pos.coords.heading.toFixed(2), 'degrees');
                console.log('Computed bearing vs device heading:', 
                    (Math.atan2(direction.x, direction.z) * 180/Math.PI).toFixed(2), 
                    'vs', 
                    pos.coords.heading.toFixed(2)
                );
            } else {
                console.log('Device heading not available');
            }

        } else {
            console.error('Failed to convert target coordinates to world position');            
            
            const defaultFallbackLength = 2.0; // Define fallback length
            // const alphaMapFallback = createAlphaGradientTexture(defaultFallbackLength); // Pass fallback length

            lineMaterial = new THREE.MeshBasicMaterial({ 
                color: app.PRIMARY_COLOR, 
                // alphaMap: alphaMapFallback, // Use the correct alphaMap
                wireframe: false,
                transparent: true,
                opacity: .8, // Base opacity for pulsation
                depthTest: false, // Ensure always visible
                side: THREE.DoubleSide // Visible from both sides
            });

            const fallbackGeometry = new THREE.BoxGeometry(0.2, 0.1, 2); // Default 2m line
            
            const directionLine = new THREE.Mesh(
                fallbackGeometry,
                lineMaterial
            );
            
            directionLine.position.set(0, -0.5, 1);            
            directionLine.name = "fallbackDirectionLine";
            locarInstance.scene.add(directionLine);
            userLine = directionLine;

            const existingEndMarker = locarInstance.scene.getObjectByName("endMarker");
            if (existingEndMarker) {
                locarInstance.scene.remove(existingEndMarker);
            }
            
            if (app.debug) {
                const endMarker = new THREE.Mesh(
                    new THREE.SphereGeometry(0.115, 16, 16),
                    new THREE.MeshBasicMaterial({
                        color: app.PRIMARY_COLOR,
                        depthTest: false
                    })
                );
                endMarker.name = "endMarker";
                endMarker.position.set(0, -0.5, 2);
                locarInstance.scene.add(endMarker);
            }
            
        }   
        
        // firstPosition, compassLines, userLine = showCompassLines(app, firstPosition, locarInstance, pos, compassLines, userLine);
    });

    locarInstance.locar.startGps();
    locarInstance.renderer.setAnimationLoop(animate);

    locarInstance.cameraCheckInterval = cameraCheckInterval;
    
    locarInstance.cleanup = () => {
        if (locarInstance.cameraCheckInterval) {
            clearInterval(locarInstance.cameraCheckInterval);
            locarInstance.cameraCheckInterval = null;
        }
    };  
        
    function animate() {
        try {
            const originalPosition = locarInstance.camera.position.clone();

            locarInstance.cam.update();
            locarInstance.controls.update();

            // Smoother animation with controlled speed
            time += 0.03; // Increased speed for more visible pulsation
            
            // More pronounced pulsation effect with range from 0.6 to 1.0
            if (lineMaterial) {
                lineMaterial.opacity = 0.6 + 0.25 * Math.sin(time);
                
                // Ensure material's transparent property is true for opacity to work
                lineMaterial.transparent = true;
                lineMaterial.needsUpdate = true;
            }
            
            debugCameraPosition(app, locarInstance, compassLines, userLine);

            locarInstance.renderer.render(locarInstance.scene, locarInstance.camera);
        } catch (error) {
            console.error("Error in animation loop:", error);
        }
    };
    animate(); // Initial render
}

function createAlphaGradientTexture(lineLength, textureResolution=512) {
    // Create a 1D texture that will correctly map along the box's length
    const canvas = document.createElement('canvas');
    canvas.width = textureResolution; // Use textureResolution for the gradient direction
    canvas.height = textureResolution;     // Only need 1 pixel height for a 1D gradient
    
    const ctx = canvas.getContext('2d');
    // Create horizontal gradient (right to left)
    ctx.rect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, textureResolution,  0, 0);
    gradient.addColorStop(0, 'rgba(118, 44, 239, 1)');    // Start with solid color
    gradient.addColorStop(1, 'rgba(118, 44, 239, 0)');    // Completely transparent at the end
    
    ctx.fillStyle = gradient;
    ctx.fill()
    
    // const texture = new THREE.CanvasTexture(canvas);
    // texture.magFilter = THREE.LinearFilter;
    // texture.minFilter = THREE.LinearFilter;
    
    // // Important: we must set repeat and wrap mode for proper UV mapping
    // texture.wrapS = THREE.ClampToEdgeWrapping;
    // texture.wrapT = THREE.ClampToEdgeWrapping;
    // texture.repeat.set(1, 1);
    
    return new THREE.Texture(canvas);
}