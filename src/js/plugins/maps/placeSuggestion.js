/**
 * Fetches suggestions for places near the user's location using Mapbox Tilequery API.
 * 
 * @async
 * 
 * @param {Object} app - The Framework7 app instance containing configuration and state.
 * @throws {Error} - If the start or destination location is missing, or if the route cannot be fetched.
 * 
 */
export async function placeSuggestion(app) {
    // Create the URL for the Mapbox Tilequery API request
    const url = ` https://api.mapbox.com/v4/mapbox.mapbox-streets-v8/tilequery/${app.USER_LOCATION[0]},${app.USER_LOCATION[1]}.json?radius=${app.AR_SUGGESTION_RADIUS}&dedupe&layers=poi_label&geometry=point&access_token=${app.MAPBOX_ACCESS_TOKEN}`;
    
    // Fetch the suggestions from Mapbox Tilequery API
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fretch suggestions from Mapbox.');
    }

    // Parse the response data
    const data = await response.json();

    // Check if there are any features in the response
    if (data.features.length === 0) {
        return;
    }

    // Ensure only new suggestions are added to the AR_SUGGESTIONS array
    for (const suggestion of data.features) {
        if (app.AR_SUGGESTIONS.some(s => s.geometry.coordinates === suggestion.geometry.coordinates)) {
            continue;
        }
        app.AR_SUGGESTIONS.push(suggestion);
    }
}