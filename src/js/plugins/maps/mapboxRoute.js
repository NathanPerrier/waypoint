import { SearchBoxCore } from '@mapbox/search-js-core';
import { displayDialog } from '../../utils/dialog.js';

// ...existing code...

export async function getRoute(app, router) {
    try {

        const { START_LOCATION, DESTINATION_LOCATION_COORDINATES, MAPBOX_ACCESS_TOKEN } = app;

        if (!START_LOCATION || !DESTINATION_LOCATION_COORDINATES) {
            throw new Error('Start or destination location is missing.');
        }

        const url = `https://api.mapbox.com/directions/v5/mapbox/${app.TRANSPORTATION_MODE}/${START_LOCATION.lng},${START_LOCATION.lat};${DESTINATION_LOCATION_COORDINATES.lng},${DESTINATION_LOCATION_COORDINATES.lat}?geometries=geojson&steps=true&access_token=${MAPBOX_ACCESS_TOKEN}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch route from Mapbox.');
        }

        const data = await response.json();
        if (!data.routes || data.routes.length === 0) {
            throw new Error('No routes found.');
        }

        console.log('Route data:', data);   

        const route = data.routes[0];
        app.NAVIGATION_ROUTE_DATA = {
            duration: route.duration, // in seconds
            distance: route.distance, // in meters
            waypoints: data.waypoints,
            uuid: data.uuid,
        };

        app.NAVIGATION_ROUTE_STEPS = route.legs[0].steps.map(step => ({
            instruction: step.maneuver,
            distance: step.distance, // in meters
            duration: step.duration, // in seconds
            coordinates: step.geometry.coordinates,
            type: step.maneuver.type,
            name: step.name || 'Unknown',
            intersections: step.intersections || [],
        }));

        app.NAVIGATION_ROUTE = route.geometry.coordinates;

        console.log('Route data:', app.NAVIGATION_ROUTE_DATA);
        console.log('Route coordinates:', app.NAVIGATION_ROUTE);
        console.log('Route steps:', app.NAVIGATION_ROUTE_STEPS);

    } catch (error) {
        console.error('Error fetching route:', error);
        displayDialog(app, router, 'Route Error', error.message, '/');
    }
}