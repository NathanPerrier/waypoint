import mapboxgl from 'mapbox-gl';

export async function createStaticRouteMap(app, container) {
    if (!container) {
        console.error('Container is not defined');
        return;
    }

    // Clear the container if it already has a map
    if (container._mapInstance) {
        container._mapInstance.remove();
        container._mapInstance = null;
    }

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

export async function createLiveRouteMap(app, container) {
    console.log(container);
    if (!container) {
        console.error('Container is not defined');
        return;
    }

    // Clear the container if it already has a map
    if (container._mapInstance) {
        container._mapInstance.remove();
        container._mapInstance = null;
    }

    const map = new mapboxgl.Map({
        container: container, // Use the container element reference
        style: app.MAP_LIGHT_STYLE,
        center: app.START_LOCATION,
        zoom: 16,
        minZoom: 15,
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

    // // Add start position marker
    // if (app.NAVIGATION_ROUTE && app.NAVIGATION_ROUTE.length > 0) {
    //     new mapboxgl.Marker({ color: app.PRIMARY_COLOR, offset: [0, 0], anchor: 'bottom' })
    //         .setLngLat(app.NAVIGATION_ROUTE[0]) // Use exact coordinates from NAVIGATION_ROUTE
    //         .addTo(map);
    // }

    // // Add destination marker
    // if (app.NAVIGATION_ROUTE && app.NAVIGATION_ROUTE.length > 1) {
    //     new mapboxgl.Marker({ color: app.SECONDARY_COLOR, offset: [0, 0], anchor: 'bottom' })
    //         .setLngLat(app.NAVIGATION_ROUTE[app.NAVIGATION_ROUTE.length - 1]) // Use exact coordinates from NAVIGATION_ROUTE
    //         .addTo(map);
    // }

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