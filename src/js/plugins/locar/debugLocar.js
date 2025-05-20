import * as THREE from "three";

export function showOriginCube(app, locarInstance) {
    const existingOriginCube = locarInstance.scene.getObjectByName("originCube");
    if (existingOriginCube) {
        locarInstance.scene.remove(existingOriginCube);
    }
    
    if (app.DEBUG) {
        locarInstance.scene.add(new THREE.AxesHelper(20));

        const originCube = new THREE.Mesh(
            new THREE.BoxGeometry(10, 10, 10), // 10-meter cube - extremely large
            new THREE.MeshBasicMaterial({ 
                color: 0x00FF00, // Bright neon green
                wireframe: true, // Show as wireframe so we can see through it
                transparent: false,
                depthTest: false // Always visible regardless of what's in front
            })
        );
        
        originCube.position.set(0, 0, 0);
        originCube.name = "originCube"; // Give it a name so we can find it later
        
        locarInstance.scene.add(originCube);
    }   
}

export function showCompassLines(app, firstPosition, locarInstance, pos, compassLines=null, userLine=null) {
    if (firstPosition) {
        try {
            // Check if compass lines already exist
            if (compassLines) {
                locarInstance.scene.remove(compassLines);
            }
            
            if (app.DEBUG) {
                compassLines = createCompassLines();
                compassLines.name = "compassLines"; // Give it a name for easier referencing
                locarInstance.scene.add(compassLines);
                
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
                
                const lineLength = 1; 
                
                const meterGeometry = new THREE.BufferGeometry();
                meterGeometry.setAttribute('position', new THREE.Float32BufferAttribute(
                    [0, 0, 0, lineLength, 0, 0], 3
                ));
                const meterMaterial = new THREE.LineBasicMaterial({ 
                    color: 0xFFFF00, // Bright yellow for visibility
                    linewidth: 5,
                    depthTest: false,
                    transparent: false,
                    opacity: 1.0
                });
                
                const meterLine = new THREE.Line(meterGeometry, meterMaterial);
                meterLine.name = "meterLine";
                meterLine.position.set(0, -0.25, 0); 

                locarInstance.scene.add(meterLine);
                
                if (!userLine) {
                    userLine = meterLine;
                }
            }
            
            firstPosition = false;
            
        } catch (error) {
            console.error("Error in firstPosition setup:", error);
        }

        return [firstPosition, compassLines, userLine];
    }
}


export function debugCameraPosition(app, locarInstance, compassLines=null, userLine=null) {
    if (app.DEBUG) {
        if (locarInstance.camera.position.length() > 5) {
            console.log('Camera drifted too far:', 
                locarInstance.camera.position.x.toFixed(2),
                locarInstance.camera.position.y.toFixed(2),
                locarInstance.camera.position.z.toFixed(2),
                '- resetting position'
            );
            
            locarInstance.camera.position.set(0, 0, 0);
        }
        
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
    
        if (userLine) {
            if (Math.random() < 0.005) { 
                console.log('User line visible:', userLine.visible);
            }
        }
    }
}

export function logCameraChange(app, locarInstance, lastCameraPosition) {
    const currentPos = locarInstance.camera.position;
    const distance = lastCameraPosition.distanceTo(currentPos);
    
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
    
    lastCameraPosition.copy(currentPos);
    return lastCameraPosition;
}