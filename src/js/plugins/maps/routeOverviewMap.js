import mapboxgl from 'mapbox-gl';

/**
 * Creates a static route map using Mapbox GL JS.
 * 
 * @param {Object} app - The Framework7 app instance containing configuration and state.
 * @param {HTMLElement} container - The HTML element to render the map in.
 * 
 * @returns {Promise<void>} - A promise that resolves when the map is created.
 * @throws {Error} - If the container is not defined or if the NAVIGATION_ROUTE_COORDINATES is missing or not in the correct format.
 * 
 */
export async function createStaticRouteMap(app, container) {
    // Check if the container is defined
    if (!container) {
        console.error('Container is not defined');
        return;
    }

    // Clear the container if it already has a map
    if (container._mapInstance) {
        container._mapInstance.remove();
        container._mapInstance = null;
    }

    // Create a new Mapbox map instance
    const map = new mapboxgl.Map({
        container: container, // Use the container element reference
        style: app.MAP_LIGHT_STYLE,
        center: app.START_LOCATION,
        zoom: 14,
        minZoom: 14,
        maxZoom: 18,
        pitch: 0,
        maxPitch: 0,
        minPitch: 0,
        accessToken: app.MAPBOX_ACCESS_TOKEN,
        maxBounds: app.MAP_LOCATION_BOUNDS_LNGLATLIKE,
        refreshExpiredTiles: false,
    });

    // Store the map instance in the container for future reference
    container._mapInstance = map;

    // Add start position marker
    if (app.NAVIGATION_ROUTE && app.NAVIGATION_ROUTE.length > 0) {
        new mapboxgl.Marker({ color: app.PRIMARY_COLOR, offset: [0, 0], anchor: 'bottom' })
            .setLngLat(app.NAVIGATION_ROUTE[0]) // Use exact coordinates from NAVIGATION_ROUTE
            .addTo(map);
    }

    // Add destination marker
    if (app.NAVIGATION_ROUTE && app.NAVIGATION_ROUTE.length > 1) {
        new mapboxgl.Marker({ color: app.SECONDARY_COLOR, offset: [0, 0], anchor: 'bottom' })
            .setLngLat(app.NAVIGATION_ROUTE[app.NAVIGATION_ROUTE.length - 1]) // Use exact coordinates from NAVIGATION_ROUTE
            .addTo(map);
    }

    // Add route line
    if (app.NAVIGATION_ROUTE && Array.isArray(app.NAVIGATION_ROUTE)) {
        map.on('load', () => {
            map.resize();
            // Ensure the source is added correctly
            map.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: app.NAVIGATION_ROUTE,
                    },
                },
            });

            // Add the dashed route layer
            map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': app.PRIMARY_COLOR,
                    'line-width': 8,
                },
            });
        });
    } else {
        console.error('NAVIGATION_ROUTE_COORDINATES is missing or not in the correct format.');
    }
}


/**
 * Creates a live route map using Mapbox GL JS.
 * 
 * @async
 * 
 * @param {Object} app - The Framework7 app instance containing configuration and state.
 * @param {HTMLElement} container - The HTML element to render the map in.
 * @param {boolean} [interactive=true] - Whether the map should be interactive.
 * 
 * @returns {Promise<mapboxgl.Map>} - A promise that resolves to the created Mapbox map instance.
 * @throws {Error} - If the container is not defined or if the NAVIGATION_ROUTE_COORDINATES is missing or not in the correct format.
 * 
 */
export async function createLiveRouteMap(app, container, interactive = true) {
    // Check if the container is defined
    if (!container) {
        console.error('Container is not defined');
        return;
    }

    // Clear the container if it already has a map
    if (container._mapInstance) {
        container._mapInstance.remove();
        container._mapInstance = null;
    }

    // Create a new Mapbox map instance
    const map = new mapboxgl.Map({
        container: container, 
        style: app.MAP_LIGHT_STYLE,
        center: app.START_LOCATION,
        zoom: 16,
        minZoom: 15,
        maxZoom: 18,
        pitch: 0,
        maxPitch: 0,
        interactive: interactive,
        minPitch: 0,
        accessToken: app.MAPBOX_ACCESS_TOKEN,
        maxBounds: app.MAP_LOCATION_BOUNDS_LNGLATLIKE,
        refreshExpiredTiles: false,
    });

    // Store the map instance in the container for future reference
    container._mapInstance = map;

    // Add route line
    if (app.NAVIGATION_ROUTE && Array.isArray(app.NAVIGATION_ROUTE)) {
        map.on('load', () => {
            map.resize();

            // Ensure the source is added correctly
            map.addSource('route', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: app.NAVIGATION_ROUTE,
                    },
                },
            });

            // Add the dashed route layer
            map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round',
                },
                paint: {
                    'line-color': app.PRIMARY_COLOR,
                    'line-width': 8,
                },
            });
        });
    } else {
        console.error('NAVIGATION_ROUTE_COORDINATES is missing or not in the correct format.');
    }    

    // add user location and orientation control
    const geolocateControl = new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true,

        // make color app.SECONDARY_COLOR
        style: {
            backgroundColor: app.SECONDARY_COLOR,
        },
    });
    
    // Add the geolocate control to the map
    map.addControl(geolocateControl);
    map.on('load', () => {
        map.resize();
        setTimeout(() => {
            geolocateControl.trigger(); 
        }, 100);
    });

    return map;
}

/**
 * Updates the route layer on the map with new route coordinates.
 * 
 * @param {mapboxgl.Map} map - The Mapbox map instance.
 * @param {Array} routeCoordinates - An array of coordinates representing the route.
 * 
 * @throws {Error} - If the map or route source is not defined.
 * 
 */
export function updateRouteLayer(map, routeCoordinates) {
    // Check if the map and route source are defined
    if (map && map.getSource('route')) {
        // Update the route source with new coordinates
        map.getSource('route').setData({
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: routeCoordinates,
            },
        });
    } else {
        console.warn('Map or route source is not defined.');
    }
}