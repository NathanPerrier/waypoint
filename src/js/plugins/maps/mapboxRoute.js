/**
 * Fetches a route from Mapbox Directions API based on the provided start and destination locations.
 * adds the route data to the app instance and handles errors.
 * 
 * @async
 * 
 * @param {Object} app - The Framework7 app instance containing configuration and state.
 * @param {Object} router - The Framework7 router instance for navigation.
 * 
 * @throws {Error} - If the start or destination location is missing, or if the route cannot be fetched.
 * 
 */
export async function getRoute(app, router) {
    try {
        // Get the start and destination locations from the app instance
        const { START_LOCATION, DESTINATION_LOCATION_COORDINATES, MAPBOX_ACCESS_TOKEN } = app;

        // Validate that the start and destination locations are provided
        if (!START_LOCATION || !DESTINATION_LOCATION_COORDINATES) {
            throw new Error('Start or destination location is missing.');
        }

        // create the URL for the Mapbox Directions API request
        const url = `https://api.mapbox.com/directions/v5/mapbox/${app.TRANSPORTATION_MODE}/${START_LOCATION.lng},${START_LOCATION.lat};${DESTINATION_LOCATION_COORDINATES.lng},${DESTINATION_LOCATION_COORDINATES.lat}?geometries=geojson&steps=true&access_token=${MAPBOX_ACCESS_TOKEN}`;

        // Fetch the route from Mapbox Directions API
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch route from Mapbox.');
        }

        // Parse the response data
        const data = await response.json();
        if (!data.routes || data.routes.length === 0) {
            throw new Error('No routes found.');
        } 

        // Store the route data in the app instance
        const route = data.routes[0];
        app.NAVIGATION_ROUTE_DATA = {
            duration: route.duration, // in seconds
            distance: route.distance, // in meters
            waypoints: data.waypoints,
            uuid: data.uuid,
        };

        // Store the route steps and geometry in the app instance
        app.NAVIGATION_ROUTE_STEPS = route.legs[0].steps.map(step => ({
            instruction: step.maneuver,
            distance: step.distance, // in meters
            duration: step.duration, // in seconds
            coordinates: step.geometry.coordinates,
            type: step.maneuver.type,
            name: step.name || 'Unknown',
            intersections: step.intersections || [],
        }));

        // Store the route geometry coordinates in the app instance
        app.NAVIGATION_ROUTE = route.geometry.coordinates;

    // Navigate back to the route overview page with the route data
    } catch (error) {
        console.error('Error fetching route:', error);
        app.dialog.alert('Failed to fetch route. Please try again later.', 'Error', () => {
            router.navigate('/');
        });
    }
}