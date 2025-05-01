export async function mapMatching(app, coordinates, waypoints) {
    const WaypointsCoordinates = waypoints
        .map(waypoint => `${waypoint[0]},${waypoint[1]}`) // Swap [longitude, latitude] to [latitude, longitude]
        .join(';'); 

    const url = `https://api.mapbox.com/matching/v5/mapbox/${app.TRANSPORTATION_MODE}/${coordinates[0]},${coordinates[1]};${app.DESTINATION_LOCATION_COORDINATES.lng},${app.DESTINATION_LOCATION_COORDINATES.lat}.json?steps=true&banner_instructions=true&radiuses=25;25&access_token=${app.MAPBOX_ACCESS_TOKEN}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to update route information');
    }
    const data = await response.json();
    return data; 
}