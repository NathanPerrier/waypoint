window.handleRouteSuggestionClick = (searchInputId, searchResultsId, name, placeFormatted, coordinatesString, fullAddress, featureType, mapboxId, distance) => {
    const app = window.app;
    const searchInput = document.getElementById(searchInputId);
    const searchResults = document.getElementById(searchResultsId);

    const coordinates = coordinatesString.split(',').map(coord => coord.trim());
    const coordinatesLNGLAT = {
        lng: parseFloat(coordinates[0]), 
        lat: parseFloat(coordinates[1])  
    };

    console.log("Suggestion clicked:", { name, placeFormatted, coordinates, coordinatesLNGLAT, fullAddress, featureType, mapboxId, distance });

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

    searchInput.value = name;

    searchResults.innerHTML = '';

};