/**
 * Fetches a route from Mapbox Directions API based on the provided start and destination locations.
 * 
 * @param {string} searchInputId - The ID of the search input element.
 * @param {string} searchResultsId - The ID of the search results element.
 * @param {string} name - The name of the location.
 * @param {string} placeFormatted - The formatted place name.
 * @param {string} coordinatesString - The coordinates of the location as a string (e.g., "lng,lat").
 * @param {string} fullAddress - The full address of the location.
 * @param {string} featureType - The type of the feature (e.g., "poi", "address").
 * @param {string} mapboxId - The Mapbox ID of the location.
 * @param {number} distance - The distance to the location in meters.
 * 
 * @returns {void}
 * @throws {Error} - If the search input or results element is not found.
 * 
 */
window.handleRouteSuggestionClick = (searchInputId, searchResultsId, name, placeFormatted, coordinatesString, fullAddress, featureType, mapboxId, distance) => {
    const app = window.app;

    //retrieve the search input and results elements by their IDs
    const searchInput = document.getElementById(searchInputId);
    const searchResults = document.getElementById(searchResultsId);

    // Check if the search input and results elements exist
    if (!searchInput || !searchResults) {
        console.error('Search input or results element not found.');
        return;
    }

    // get coordinates from the coordinates string
    const coordinates = coordinatesString.split(',').map(coord => coord.trim());
    const coordinatesLNGLAT = {
        lng: parseFloat(coordinates[0]), 
        lat: parseFloat(coordinates[1])  
    };

    // update destination with selected location data
    app.DESTINATION_LOCATION = name;
    app.DESTINATION_LOCATION_DATA = {
        name: name,
        placeFormatted: placeFormatted,
        coordinates: coordinatesLNGLAT,
        fullAddress: fullAddress,
        featureType: featureType,
        mapboxId: mapboxId,
        distance: distance 
    };
    app.DESTINATION_LOCATION_COORDINATES = coordinatesLNGLAT; 

    // update the search input value and clear the search results
    searchInput.value = name;
    searchResults.innerHTML = '';
};