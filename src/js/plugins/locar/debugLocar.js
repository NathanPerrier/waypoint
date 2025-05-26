import * as THREE from "three";


/**
 * Debug Function: Display a cube at the origin (user location) in the LocAR scene
 *
 * @param {Object} app - The Framework7 app instance
 * @param {Object} locarInstance - The LocAR instance containing the scene
 *
 */
export function showOriginCube(app, locarInstance) {
    // Remove any existing originCube to avoid duplicates
    const existingOriginCube = locarInstance.scene.getObjectByName("originCube");
    if (existingOriginCube) {
        locarInstance.scene.remove(existingOriginCube);
    }
    
    // if debug mode is enabled, add the origin cube    
    if (app.DEBUG) {
        locarInstance.scene.add(new THREE.AxesHelper(20));

        const originCube = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 10),
            new THREE.MeshBasicMaterial({ 
                color: 0x00FF00, 
                wireframe: true, 
                transparent: false,
                depthTest: false 
            })
        );
        
        // Set position and name for the origin cube
        originCube.position.set(0, 0, 0);
        originCube.name = "originCube";

        // Add cube to Scene
        locarInstance.scene.add(originCube);
    }   
}


/**
 * Debug Function: Create and return a set of compass lines in the LocAR scene
 * This function creates a set of lines representing the cardinal directions (N, E, S, W) and adds them to the scene.
 * 
 * @param {Object} app - The Framework7 app instance
 * @param {Boolean} firstPosition - Flag to indicate if this is the first position update
 * @param {Object} locarInstance - The LocAR instance containing the scene
 * @param {Object} pos - The position object containing coordinates
 * @param {Object} compassLines - Optional existing compass lines to remove before creating new ones
 * @param {Object} userLine - Optional user line to be used for meter display
 * 
 * @throws {Error} Throws an error if there is an issue creating the compass lines.
 * 
 * @returns {Array} An array containing the updated firstPosition flag, compassLines, and userLine.
 *
 */ 
export function showCompassLines(app, firstPosition, locarInstance, pos, compassLines=null, userLine=null) {
    // Create compass lines only if this is the first position update so that it only ads compass lines once
    if (firstPosition) {
        try {
            // Check if compass lines already exist
            if (compassLines) {
                locarInstance.scene.remove(compassLines);
            }
            // Create compass lines if debug mode is enabled
            if (app.DEBUG) {
                // Function to create compass lines then name and add them to the scene
                compassLines = createCompassLines();
                compassLines.name = "compassLines"; 
                locarInstance.scene.add(compassLines);
                
                // Set the compass lines position based on the user's current location
                const worldPos = locarInstance.locar.lonLatToWorldCoords(
                    pos.coords.longitude,
                    pos.coords.latitude
                );
                
                if (worldPos && compassLines) {
                    compassLines.position.set(worldPos.x || 0, 1, worldPos.y || 0);
                }
            
            
                // Remove any existing meter line
                const existingMeterLine = locarInstance.scene.getObjectByName("meterLine");
                if (existingMeterLine) {
                    locarInstance.scene.remove(existingMeterLine);
                }
                
                // Set line length to one meter
                const lineLength = 1; 
                
                // Create a line geometry and material for the meter line
                const meterGeometry = new THREE.BufferGeometry();
                meterGeometry.setAttribute('position', new THREE.Float32BufferAttribute(
                    [0, 0, 0, lineLength, 0, 0], 3
                ));
                const meterMaterial = new THREE.LineBasicMaterial({ 
                    color: 0xFFFF00, 
                    linewidth: 5,
                    depthTest: false,
                    transparent: false,
                    opacity: 1.0
                });
                
                // Create the meter line and set its position
                const meterLine = new THREE.Line(meterGeometry, meterMaterial);
                meterLine.name = "meterLine";
                meterLine.position.set(0, -0.25, 0); 

                // Set the meter line to always face the camera by adding to scene
                locarInstance.scene.add(meterLine);
                
                if (!userLine) {
                    userLine = meterLine;
                }
            }
            
            // Set firstPosition to false after compass lines are created
            firstPosition = false;
            
        } catch (error) {
            console.error("Error in firstPosition setup:", error);
        }

        return [firstPosition, compassLines, userLine];
    }
}

/**
 * Debugs the camera position in the LocAR scene
 * This function checks if the camera has drifted too far from the origin and resets its position if necessary.
 * It also updates the compass lines to always face the camera and logs their positions.
 * 
 * @param {Object} app - The Framework7 app instance
 * @param {Object} locarInstance - The LocAR instance containing the camera and scene
 * @param {Object} compassLines - Optional compass lines object to update
 * @param {Object} userLine - Optional user line object to log visibility
 * 
 */
export function debugCameraPosition(app, locarInstance, compassLines=null, userLine=null) {
    // Check if debug mode is enabled
    if (app.DEBUG) {
        // Log the camera position
        if (locarInstance.camera.position.length() > 5) {
            console.log('Camera drifted too far:', 
                locarInstance.camera.position.x.toFixed(2),
                locarInstance.camera.position.y.toFixed(2),
                locarInstance.camera.position.z.toFixed(2),
                '- resetting position'
            );
            
            locarInstance.camera.position.set(0, 0, 0);
        }
        
        // Log the camera quaternion
        if (compassLines && compassLines.quaternion) {
            try {
                // Make sure compassLines always faces the camera (billboard effect)
                compassLines.quaternion.copy(locarInstance.camera.quaternion);

                if (Math.random() < 0.01) { 
                    console.log('Compass lines position:', compassLines.position);
                    console.log('Camera position:', 
                        locarInstance.camera.position.x.toFixed(2),
                        locarInstance.camera.position.y.toFixed(2), 
                        locarInstance.camera.position.z.toFixed(2)
                    );
                }
            } catch (error) {
                console.error("Error updating compass lines:", error);
            }
        }
    
        // Log the user line visibility
        if (userLine) {
            if (Math.random() < 0.005) { 
                console.log('User line visible:', userLine.visible);
            }
        }
    }
}

/**
 * Logs significant camera position changes in the LocAR scene
 * This function compares the current camera position with the last recorded position and logs the change if it exceeds a specified distance threshold.
 * 
 * @param {Object} app - The Framework7 app instance
 * @param {Object} locarInstance - The LocAR instance containing the camera
 * @param {Object} lastCameraPosition - The last recorded camera position
 * 
 * @returns {Object} The updated lastCameraPosition after logging the change
 * 
 */
export function logCameraChange(app, locarInstance, lastCameraPosition) {
    // get the current camera position and calculate the distance from the last position
    const currentPos = locarInstance.camera.position;
    const distance = lastCameraPosition.distanceTo(currentPos);
    
    // if debug mode is enabled, log significant camera changes
    if (app.DEBUG) {      
        if (distance > 5) { // Only log significant changes
            console.log('SIGNIFICANT CAMERA CHANGE:');
            console.log('From:', 
                lastCameraPosition.x.toFixed(2), 
                lastCameraPosition.y.toFixed(2), 
                lastCameraPosition.z.toFixed(2)
            );
            console.log('To:', 
                currentPos.x.toFixed(2), 
                currentPos.y.toFixed(2), 
                currentPos.z.toFixed(2)
            );
        }
    }
    
    // return the last camera position updated to the current position  
    lastCameraPosition.copy(currentPos);
    return lastCameraPosition;
}