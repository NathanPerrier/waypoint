import * as turf from '@turf/turf';
import { populateRouteInstructionsDesktop } from '../../utils/dom.js';

/**
 * Runs the desktop navigation animation.
 * Uses Mapbox GL JS to animate the camera along a route.
 * 
 * @param {Object} app - The Framework7 app instance.
 * @param {Object} map - The Mapbox GL JS map instance.
 * @param {Object} liveMap - The Mapbox GL JS live map instance.
 * @param {Array} targetRoute - The route to follow, as an array of coordinates.
 * @param {Array} cameraRoute - The route for the camera to follow, as an array of coordinates.
 * @param {Object} $f7 - The Framework7 instance.
 * @param {Object} arrowIcon - The jQuery object for the arrow icon to rotate.
 * @param {Object} firstTwoStepscontainer - The container for the first two steps of the route instructions.
 * 
 * @throws {Error} If the map or targetRoute is not provided.
 * 
 */
export const runDesktopNav = (app, map, liveMap, targetRoute, cameraRoute, $f7, arrowIcon, firstTwoStepscontainer) => {
    // Check if map and targetRoute are provided
    if (!map || !targetRoute) {
        console.error("Map or targetRoute is not provided.");
        app.dialog.alert('Map or targetRoute is not provided. Please try again later.', 'Error', {
            onClose: () => {
                $f7.views.main.router.navigate('/routeDesktop/');
            }
        });
    }

    // resize map to canvas
    map.resize();

    // set duraction based on the route data
    const animationDuration = app.NAVIGATION_ROUTE_DATA.duration*300;   
    
    // calculate the total distance of the route and camera route
    const routeDistance = turf.length(turf.lineString(targetRoute));
    const cameraRouteDistance = turf.length(
        turf.lineString(cameraRoute)
    );
  
    // Calculate cumulative distances for the camera route
    const cumulativeDistances = [0];
    for (let i = 0; i < cameraRoute.length - 1; i++) {
        const dist = turf.distance(turf.point(cameraRoute[i]), turf.point(cameraRoute[i+1]));
        cumulativeDistances.push(cumulativeDistances[i] + dist);
    }
  
    // Calculate the look-ahead distance based on the route distance
    const lookAheadDistance = routeDistance * app.LOOK_AHEAD_FACTOR;
    let start;

    // set the initial duration and distance in the app's navigation route data
    const initialDuration = app.NAVIGATION_ROUTE_DATA.duration;
    const initialDistance = app.NAVIGATION_ROUTE_DATA.distance;

    let smoothedAltitude;

    /**
     * Animates the camera along the route.
     * 
     * @param {number} time - The current time in milliseconds.
     * @returns {void}
     * 
     */
    function frame(time) {
        // If the map is not initialized return 
        if (!map) return; 

        // If the start time is not set, set it to the current time
        if (!start) start = time;

        // Calculate the phase of the animation based on the elapsed time
        const phase = (time - start) / animationDuration;

        // If the phase is greater than or equal to 1, the animation is complete
        if (phase >= 1) {
            // notify the user that they have arrived at their destination and return to the route view
            app.notification.create({
                icon: '<i class="fa-solid  icon-center fa-location-dot"></i>',
                title: 'Arrived at destination',
                text: 'You have reached your destination. ',
                closeTimeout: 5000,
            }).open();
            app.tab.show('#view-route-desktop'); 
            return;
        }
       
        // Calculate the current position along the camera route
        const currentDistance = cameraRouteDistance * phase;
        const cameraPosition = turf.along(
            turf.lineString(cameraRoute),
            currentDistance
        );
        const cameraPositionCoords = cameraPosition.geometry.coordinates;

        // calculate the coordinates the camera should look at along the target route
        const lookAtTargetDistance = Math.min(routeDistance, currentDistance + lookAheadDistance);
        const lookAtPosition = turf.along(
            turf.lineString(targetRoute),
            lookAtTargetDistance
        );
        const lookAtCoords = lookAtPosition.geometry.coordinates;
        
        // find the terrain elevation at the camera position
        const terrainElevation = map.queryTerrainElevation(cameraPositionCoords) || 0;

        // If the terrain elevation is not available, use a default value
        let currentFrameTargetAltitude = Math.max(terrainElevation + app.RELATIVE_CAMERA_ALTITUDE, app.RELATIVE_CAMERA_ALTITUDE); 

        // calculate the altitude smoothing for smoother camera movement
        if (smoothedAltitude === undefined) {
            smoothedAltitude = currentFrameTargetAltitude; 
        } else {
            smoothedAltitude = smoothedAltitude * (1 - app.ALTITUDE_SMOOTHING_FACTOR) + currentFrameTargetAltitude * app.ALTITUDE_SMOOTHING_FACTOR;
        }

        // set the camera position and look at point
        const camera = map.getFreeCameraOptions();
        camera.position = mapboxgl.MercatorCoordinate.fromLngLat(
            {
                lng: cameraPositionCoords[0],
                lat: cameraPositionCoords[1]
            },
            smoothedAltitude 
        );
        
        if (lookAtCoords && lookAtCoords.length === 2) {
            camera.lookAtPoint({
                lng: lookAtCoords[0],
                lat: lookAtCoords[1],
            });
        } else {
            console.warn("Invalid lookAtCoords:", lookAtCoords);
        }

        // Update the app's navigation route data with the current phase
        app.NAVIGATION_ROUTE_DATA.duration = initialDuration * (1 - phase);
        app.NAVIGATION_ROUTE_DATA.distance = initialDistance * (1 - phase);

        // Update the camera options on the map
        map.setFreeCameraOptions(camera);
        
        // Calculate the bearing from the camera position to the look-at point
        var bearing = turf.bearing(
            turf.point(cameraPositionCoords),
            turf.point(lookAtCoords)
        );

        // update arrow with the current bearing
        if (arrowIcon && arrowIcon.length > 0) {
            arrowIcon.css({
                'transform': `rotate(${bearing}deg)`,
            });        
        }

        // Update the live map's center and bearing
        liveMap.setCenter(cameraPositionCoords);
        liveMap.setBearing(bearing);


        // Update the distance to the next step
        if (app.NAVIGATION_ROUTE_STEPS && app.NAVIGATION_ROUTE_STEPS.length > 0) {
            const nextStepCoord = app.NAVIGATION_ROUTE_STEPS[0].instruction.location;
            const distanceToNextStep = turf.distance(
                turf.point(cameraPositionCoords),
                turf.point(nextStepCoord)
            );
            app.NAVIGATION_ROUTE_STEPS[0].distance = distanceToNextStep*1000;
        }

        // update the route instructions on the desktop
        populateRouteInstructionsDesktop(app, firstTwoStepscontainer);
        
        // If there are multiple steps in the navigation route, check if the user has reached the next step
        if (
            app.NAVIGATION_ROUTE_STEPS && app.NAVIGATION_ROUTE_STEPS.length > 1
        ) {
            const nextStepCoord = app.NAVIGATION_ROUTE_STEPS[0].instruction.location;
            const distanceToNextStep = turf.distance(
                turf.point(cameraPositionCoords),
                turf.point(nextStepCoord)
            );
            // If the user is within 2.5 meters of the next step, remove it from the list
            if (distanceToNextStep < 0.0025) { // 2.5 meters
                const stepItems = document.querySelectorAll('.step-item');
                if (stepItems.length > 0) {
                    const firstStep = stepItems[0];
                    if (firstStep.nextSibling && firstStep.nextSibling.tagName === 'HR') {
                        firstStep.nextSibling.remove();
                    }
                    firstStep.remove();
                }
                app.NAVIGATION_ROUTE_STEPS.splice(0, 1);
            }
        }

        // Request the next animation frame
        window.requestAnimationFrame(frame);
    }
    // Start the animation loop
    window.requestAnimationFrame(frame);
}

/**
 * Adds a terrain layer to the Mapbox map source and a route layer for the target route.
 * 
 * @param {Object} mapSource - The Mapbox map source to add the terrain layer to.
 * @param {Array} targetRoute - The route to be displayed, as an array of coordinates.
 * 
 * @throws {Error} If there is an error adding the terrain layer or route layer.
 */
export function addTerrainLayer(mapSource, targetRoute) {
    try {
        // Add the Mapbox terrain source
        mapSource.addSource('mapbox-dem', {
            'type': 'raster-dem',
            'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
            'tileSize': 512,
            'maxzoom': 14
        });
        mapSource.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1 });  
    } catch (error) {
        console.warn("Error adding terrain layer:", error);
    }

    // Add the route layer for the target route
    mapSource.addSource('trace', {
        type: 'geojson',
        data: {
            'type': 'Feature',
            'properties': {},
            'geometry': {
                'type': 'LineString',
                'coordinates': targetRoute 
            }
        }
    });
    mapSource.addLayer({
        type: 'line',
        source: 'trace',
        id: 'line',
        paint: {
            'line-color': app.PRIMARY_COLOR,
            'line-width': 25
        },
        layout: {
            'line-cap': 'round',
            'line-join': 'round',
        }
    });
}