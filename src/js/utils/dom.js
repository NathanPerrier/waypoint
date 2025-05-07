import { getRoute } from "../plugins/maps/mapboxRoute.js";
import { createStaticRouteMap } from "../plugins/maps/routeOverviewMap.js";

export const waitForElement = (id) => {
    return new Promise((resolve) => {
        const element = document.getElementById(id);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.getElementById(id);
            if (element) {
                resolve(element);
                observer.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    });
};

export function isWithinBounds(app, location) {
    if (app.DEBUG) {
        return true;
    }

    try {
        const isUserInBbx = app.MAPBOXGL_LOCATION_BOUNDS.contains(location);
        return isUserInBbx;
    } catch (error) {
        console.error("Error checking bounds:", error);
        return false;
    }
}

export function isWithinSpecifiedBounds(location, bounds) {
    try {
        const isUserInBbx = bounds.contains(location);
        return isUserInBbx;
    } catch (error) {
        console.error("Error checking bounds:", error);
        return false;
    }
}

//! MOVE TO DIFFERENT FILE
export const handleSearchClick = async function(app, $f7, searchValue, mapContainerConfirmId, timeId, distanceId, modeId, destinationNameId, confirmationActionsClass) {
    
    if (searchValue === '') {
        $f7.dialog.alert('Please enter a search value');
        return;
    }             

    if (app.TRANSPORTATION_MODE === '' || app.TRANSPORTATION_MODE === null) {
        $f7.dialog.alert('Please select a navigation mode');
        return;
    }

    if (!app.START_LOCATION || typeof app.START_LOCATION.lng !== 'number' || typeof app.START_LOCATION.lat !== 'number') {
        $f7.dialog.alert('Valid start location is missing. Please set it in settings.');
        return;
    }

    if (!isWithinBounds(app, app.START_LOCATION)) {
        $f7.dialog.alert('Your current start location is outside the the UQ campus. Please ensure you are at UQ.');
        console.warn('Start location out of bounds:', app.START_LOCATION, 'Bounds:', app.MAP_LOCATION_BOUNDS);
        return;
    }

    if (searchValue === null || searchValue === undefined) {
        $f7.dialog.alert('No valid destination found for the search term.');
        return;
    }

    if (!app.DESTINATION_LOCATION_DATA || !app.DESTINATION_LOCATION_COORDINATES) {
        $f7.dialog.alert('No valid destination found for the search term. Please reenter the search destination.');
        return;
    }

    if (!isWithinBounds(app, app.DESTINATION_LOCATION_COORDINATES)) {
        $f7.dialog.alert('The selected destination is outside the allowed map area.');
        console.warn('Destination location out of bounds:', app.DESTINATION_LOCATION_COORDINATES, 'Bounds:', app.MAP_LOCATION_BOUNDS);
        return;
    }

    app.DESTINATION_LOCATION_DATA.startLocation = app.START_LOCATION;

    $f7.actions.close('.settings-actions');

    await getRoute(app, $f7.router);

    if (!app.NAVIGATION_ROUTE_DATA || !app.NAVIGATION_ROUTE_DATA.duration || !app.NAVIGATION_ROUTE_DATA.distance) {
        console.error("Failed to get valid route data.");
        $f7.dialog.alert('Could not calculate the route. Please try again later.');
        return;
    }

    console.log("Route data:", app.NAVIGATION_ROUTE_DATA);
    console.log("Destination location data:", app.DESTINATION_LOCATION_DATA);
    console.log("Start location data:", app.START_LOCATION);
    console.log("Transportation mode:", app.TRANSPORTATION_MODE);

    const mapContainerConfirm = await waitForElement(mapContainerConfirmId);

    try {
        await createStaticRouteMap(app, mapContainerConfirm);
    } catch (error) {
        console.error("Error while creating static route map:", error);
        $f7.dialog.alert('An error occurred while creating the map. Please try again later.');
        return;
    }

    document.getElementById(timeId).innerHTML = (app.NAVIGATION_ROUTE_DATA.duration / 60).toFixed(0) + 'mins';
    document.getElementById(distanceId).innerHTML = (app.NAVIGATION_ROUTE_DATA.distance/1000).toFixed(1) + 'km';
    document.getElementById(modeId).innerHTML = `<i class="${app.TRANSPORTATION_MODE_ICON}"></i>`;
    document.getElementById(destinationNameId).innerHTML = app.DESTINATION_LOCATION_DATA.name;

    $f7.actions.open(confirmationActionsClass);
}

export const handleRedirect = (view, route, $f7) => {         
    $f7.actions.close()
    $f7.views.navigation.router.navigate(route);
    app.tab.show(view);
};
