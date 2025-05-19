import * as turf from '@turf/turf';
import { populateRouteInstructionsDesktop } from '../../utils/dom.js';

let temp;
let lastBearing = undefined; // Variable to store the last bearing

export const runDesktopNav = (app, map, liveMap, targetRoute, cameraRoute, $f7, arrowIcon, firstTwoStepscontainer) => {
    map.resize();
    const animationDuration = app.NAVIGATION_ROUTE_DATA.duration*300;   //! TODO: calculate based oof EST travel time dependant on dist and average speed
    
    const routeDistance = turf.length(turf.lineString(targetRoute));
    const cameraRouteDistance = turf.length(
        turf.lineString(cameraRoute)
    );
  
    const cumulativeDistances = [0];
    for (let i = 0; i < cameraRoute.length - 1; i++) {
        const dist = turf.distance(turf.point(cameraRoute[i]), turf.point(cameraRoute[i+1]));
        cumulativeDistances.push(cumulativeDistances[i] + dist);
    }
  
    const lookAheadDistance = routeDistance * app.LOOK_AHEAD_FACTOR;
    let start;

    const initialDuration = app.NAVIGATION_ROUTE_DATA.duration;
    const initialDistance = app.NAVIGATION_ROUTE_DATA.distance;

    let smoothedAltitude;

    function frame(time) {
        if (!map) return; 
        if (!start) start = time;
        const phase = (time - start) / animationDuration;
        if (phase >= 1) {
            app.notification.create({
                icon: '<i class="fa-solid  icon-center fa-location-dot"></i>',
                title: 'Arrived at destination',
                text: 'You have reached your destination. ',
                closeTimeout: 5000,
            }).open();
            // $f7.views.main.router.navigate('/routeDesktop/'); 
            app.tab.show('#view-route-desktop'); 
            return;
        }
       
        const currentDistance = cameraRouteDistance * phase;
        const cameraPosition = turf.along(
            turf.lineString(cameraRoute),
            currentDistance
        );
        const cameraPositionCoords = cameraPosition.geometry.coordinates;

        const lookAtTargetDistance = Math.min(routeDistance, currentDistance + lookAheadDistance);
        const lookAtPosition = turf.along(
            turf.lineString(targetRoute),
            lookAtTargetDistance
        );
        const lookAtCoords = lookAtPosition.geometry.coordinates;
        
        const terrainElevation = map.queryTerrainElevation(cameraPositionCoords) || 0;

        let currentFrameTargetAltitude = Math.max(terrainElevation + app.RELATIVE_CAMERA_ALTITUDE, app.RELATIVE_CAMERA_ALTITUDE); 

        if (smoothedAltitude === undefined) {
            smoothedAltitude = currentFrameTargetAltitude; 
        } else {
            smoothedAltitude = smoothedAltitude * (1 - app.ALTITUDE_SMOOTHING_FACTOR) + currentFrameTargetAltitude * app.ALTITUDE_SMOOTHING_FACTOR;
        }

       
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

        app.NAVIGATION_ROUTE_DATA.duration = initialDuration * (1 - phase);
        app.NAVIGATION_ROUTE_DATA.distance = initialDistance * (1 - phase);

        map.setFreeCameraOptions(camera);
        
        var bearing = turf.bearing(
            turf.point(cameraPositionCoords),
            turf.point(lookAtCoords)
        );


        if (arrowIcon && arrowIcon.length > 0) {
            arrowIcon.css({
                'transform': `rotate(${bearing}deg)`,
            });

            // temp = bearing;

            // if (Math.abs(lastBearing - bearing) < .25) { // Check if the difference between bearings is less than 1 degree
            //     arrowIcon.css({
            //         'transform': `rotate(0deg)`,
            //         'transition': 'transform 1s ease-in-out',
            //     });
            //     bearing = 0;
            // }

            // lastBearing = temp;
            
        }

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

        populateRouteInstructionsDesktop(app, firstTwoStepscontainer);
        
        if (
            app.NAVIGATION_ROUTE_STEPS && app.NAVIGATION_ROUTE_STEPS.length > 1
        ) {
            const nextStepCoord = app.NAVIGATION_ROUTE_STEPS[0].instruction.location;
            const distanceToNextStep = turf.distance(
                turf.point(cameraPositionCoords),
                turf.point(nextStepCoord)
            );
            if (distanceToNextStep < 0.0025) { // 2.5m
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

        window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
}

export function addTerrainLayer(mapSource, targetRoute) {
    try {
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