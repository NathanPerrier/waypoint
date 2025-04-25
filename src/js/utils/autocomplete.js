window.handleRouteSuggestionClick = (name, placeFormatted, coordinatesString, fullAddress, featureType, mapboxId, distance) => {
    const app = window.app;
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results-list');

    const coordinates = coordinatesString.split(',').map(coord => coord.trim());
    const coordinatesLNGLAT = {
        lng: parseFloat(coordinates[0]), 
        lat: parseFloat(coordinates[1])  
    };

    console.log("Suggestion clicked:", { name, placeFormatted, coordinates, coordinatesLNGLAT, fullAddress, featureType, mapboxId, distance });

    // Store the selected destination data
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

    // Update the search input visually
    searchInput.value = name;

    // Clear the search results
    searchResults.innerHTML = '';

};