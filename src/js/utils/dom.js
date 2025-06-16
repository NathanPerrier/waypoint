import { getRoute } from "../plugins/maps/mapboxRoute.js";
import { createStaticRouteMap } from "../plugins/maps/routeOverviewMap.js";

/**
 * Waits for an element with the specified ID to be added to the DOM.
 * 
 * @param {string} id - The ID of the element to wait for.
 * @returns {Promise<HTMLElement>} - A promise that resolves with the element when it is found.
 * 
 */
export const waitForElement = (id) => {
    return new Promise((resolve) => {
        // Check if the element already exists
        const element = document.getElementById(id);

        // If it exists, resolve immediately
        if (element) {
            resolve(element);
            return;
        }

        // If it doesn't exist, set up a MutationObserver to watch for changes in the DOM
        const observer = new MutationObserver(() => {
            const element = document.getElementById(id);

            // If the element is found, resolve the promise and disconnect the observer
            if (element) {
                resolve(element);
                observer.disconnect();
            }
        });

        // Start observing the document body for child list changes (i.e., elements being added or removed)
        observer.observe(document.body, { childList: true, subtree: true });
    });
};

/**
 * Checks if the user's location is within the defined bounds of the UQ campus.
 * 
 * @param {Object} app - The Framework7 app instance containing configuration and state.
 * @param {Object} location - The user's current location with `lng` and `lat` properties.
 * 
 * @return {boolean} - Returns true if the location is within bounds, false otherwise.
 * @throws {Error} - If the bounds check fails due to an error.
 * 
 */
export function isWithinBounds(app, location) {
    // Check if the app is in debug mode, if so, allow all locations
    if (app.DEBUG) {
        return true;
    }

    try {
        // try and check if the location is within the defined bounds
        const isUserInBbx = app.MAPBOXGL_LOCATION_BOUNDS.contains(location);
        return isUserInBbx;
    } catch (error) {
        console.error("Error checking bounds:", error);
        return false;
    }
}

/**
 * Checks if the user's location is within specified bounds.
 * 
 * @param {Object} location - The user's current location with `lng` and `lat` properties.
 * @param {Object} bounds - The bounds to check against, typically a Mapbox GL Bounds object.
 * 
 * @return {boolean} - Returns true if the location is within the bounds, false otherwise.
 * @throws {Error} - If the bounds check fails due to an error.
 * 
 */
export function isWithinSpecifiedBounds(location, bounds) {
    try {
        // Check if the location is within the specified bounds
        const isUserInBbx = bounds.contains(location);
        return isUserInBbx;
    } catch (error) {
        console.error("Error checking bounds:", error);
        return false;
    }
}

/**
 * Handles the search click event for the navigation feature.
 * 
 * @async
 * 
 * @param {Object} app - The Framework7 app instance containing configuration and state.
 * @param {Object} $f7 - The Framework7 instance for UI interactions.
 * @param {string} searchValue - The value entered in the search input.
 * @param {string} mapContainerConfirmId - The ID of the map container for confirmation.
 * @param {string} timeId - The ID of the element to display the estimated time.
 * @param {string} distanceId - The ID of the element to display the estimated distance.
 * @param {string} modeId - The ID of the element to display the transportation mode.
 * @param {string} destinationNameId - The ID of the element to display the destination name.
 * @param {string} confirmationActionsClass - The class of the actions to open after search.
 * 
 * @returns {Promise<void>} - A promise that resolves when the search is handled.
 * @throws {Error} - If any validation fails or if the route cannot be calculated.
 * 
 */
export const handleSearchClick = async function(app, $f7, searchValue, mapContainerConfirmId, timeId, distanceId, modeId, destinationNameId, confirmationActionsClass) {
    // check if the search value is empty
    if (searchValue === '') {
        $f7.dialog.alert('Please enter a search value');
        return;
    }             

    // check if the transportation mode is selected
    if (app.TRANSPORTATION_MODE === '' || app.TRANSPORTATION_MODE === null) {
        $f7.dialog.alert('Please select a navigation mode');
        return;
    }

    // check if the start location is valid
    if (!app.START_LOCATION || typeof app.START_LOCATION.lng !== 'number' || typeof app.START_LOCATION.lat !== 'number') {
        $f7.dialog.alert('Valid start location is missing. Please set it in settings.');
        return;
    }

    // check if the start location is within the bounds of the UQ campus
    if (!isWithinBounds(app, app.START_LOCATION)) {
        $f7.dialog.alert('Your current start location is outside the the UQ campus. Please ensure you are at UQ.');
        console.warn('Start location out of bounds:', app.START_LOCATION, 'Bounds:', app.MAP_LOCATION_BOUNDS);
        return;
    }

    // check if the search value is valid
    if (searchValue === null || searchValue === undefined) {
        $f7.dialog.alert('No valid destination found for the search term.');
        return;
    }

    // check if the destination location is valid
    if (!app.DESTINATION_LOCATION_DATA || !app.DESTINATION_LOCATION_COORDINATES) {
        $f7.dialog.alert('No valid destination found for the search term. Please reenter the search destination.');
        return;
    }

    // check if the destination location is within the bounds of the UQ campus
    if (!isWithinBounds(app, app.DESTINATION_LOCATION_COORDINATES)) {
        $f7.dialog.alert('The selected destination is outside the allowed map area.');
        console.warn('Destination location out of bounds:', app.DESTINATION_LOCATION_COORDINATES, 'Bounds:', app.MAP_LOCATION_BOUNDS);
        return;
    }

    // set the destination location data
    app.DESTINATION_LOCATION_DATA.startLocation = app.START_LOCATION;

    // close any open actions
    $f7.actions.close('.settings-actions');

    // show a preloader while fetching the route
    $f7.dialog.preloader();
    await getRoute(app, $f7.router);

    //  check if the route data is valid
    if (!app.NAVIGATION_ROUTE_DATA || !app.NAVIGATION_ROUTE_DATA.duration || !app.NAVIGATION_ROUTE_DATA.distance) {
        console.error("Failed to get valid route data.");
        $f7.dialog.close();
        $f7.dialog.alert('Could not calculate the route. Please try again later.');
        return;
    }

    // wait for the map container to be available
    const mapContainerConfirm = await waitForElement(mapContainerConfirmId);

    // create the static route map  
    try {
        await createStaticRouteMap(app, mapContainerConfirm);
    } catch (error) {
        console.error("Error while creating static route map:", error);
        $f7.dialog.close();
        $f7.dialog.alert('An error occurred while creating the map. Please try again later.');
        return;
    }

    // add route data to dialog
    document.getElementById(timeId).innerHTML = (app.NAVIGATION_ROUTE_DATA.duration / 60).toFixed(0) + 'mins';
    document.getElementById(distanceId).innerHTML = (app.NAVIGATION_ROUTE_DATA.distance/1000).toFixed(1) + 'km';
    document.getElementById(modeId).innerHTML = `<i class="${app.TRANSPORTATION_MODE_ICON}"></i>`;
    document.getElementById(destinationNameId).innerHTML = app.DESTINATION_LOCATION_DATA.name;

    // close the preloader and open the confirmation actions
    $f7.dialog.close();
    $f7.actions.open(confirmationActionsClass);
}

/**
 * Handles the redirection to a specific view and route.
 * 
 * @param {string} view - The view to navigate to.
 * @param {string} route - The route to navigate to.
 * @param {Object} $f7 - The Framework7 instance for UI interactions.
 * 
 */
export const handleRedirect = (view, route, $f7) => {         
    $f7.actions.close()
    app.tab.show(view);
};

/**
 * Updates the route data displayed in the navigation UI.
 * 
 * @param {string} destinationName - The name of the destination.
 * @param {string} navigationTime - The estimated time to reach the destination.
 * @param {string} navigationDistance - The estimated distance to the destination.
 * @param {Object} destinationElement - The jQuery or DOM element where the destination name will be displayed.
 * @param {Object} navigationInfoElement - The jQuery or DOM element where the navigation info will be displayed.
 * 
 */
export function updateRouteData(destinationName, navigationTime, navigationDistance, destinationElement, navigationInfoElement) {
    // Check if the destinationElement and navigationInfoElement are valid
    // and update their content with the destination name, navigation time, and distance
    if (destinationElement && destinationElement.length > 0) { 
        destinationElement.html(destinationName); 
    }

    // Check if the navigationInfoElement is valid
    // and update its content with the navigation time and distance
    if (navigationInfoElement && navigationInfoElement.length > 0) { 
        navigationInfoElement.html(`${navigationTime} - ${navigationDistance}`); 
    }
}

/**
 * Gets the appropriate icon class based on the navigation instruction.
 * 
 * @param {string} instruction - The navigation instruction text.
 * @return {string} - The icon class corresponding to the instruction.
 * 
 */
export const getInstructionIcon = (instruction) => {
    const lowerInstruction = instruction.toLowerCase();
    if (lowerInstruction.includes('destination')) {
        return 'map_pin_ellipse'; 
    } else if (lowerInstruction.includes('arrived')) { 
        return 'map_pin_ellipset'; 
    } else if (lowerInstruction.includes('left')) {
        return 'arrow_turn_up_left';
    } else if (lowerInstruction.includes('right')) {
        return 'arrow_turn_up_right';
    } else if (lowerInstruction.includes('straight')) {
        return 'arrow_up';
    } else if (lowerInstruction.includes('depart')) {
        return 'location_north_fill'; 
    } 
    return 'arrow_up'; // Default icon
};

/**
 * Populates the route instructions for the first two steps and the remaining steps.
 * 
 * @param {Object} app - The Framework7 app instance containing configuration and state.
 * @param {HTMLElement} firstTwoStepscontainer - The container for the first two steps.
 * @param {HTMLElement} navigationStepsContainer - The container for the remaining navigation steps.
 */
export function populateRouteInstructions(app, firstTwoStepscontainer, navigationStepsContainer) {
    // clear the existing content in the containers
    firstTwoStepscontainer.innerHTML = ''; 

    // Populate the first two steps
    const firstTwoSteps = app.NAVIGATION_ROUTE_STEPS.slice(0, 2);
    firstTwoSteps.forEach((step, index) => {
        const stepElement = document.createElement("div");
        stepElement.classList.add("step-item"); 
        const iconClass = getInstructionIcon(step.instruction.instruction);
        stepElement.innerHTML = `
            <div class="h-100 row mb-2">
                <div class="col-3 d-flex align-items-center justify-content-center">    
                    <i class="text-primary f7-icons bold">${iconClass}</i>
                </div>
                <div class="col-9">
                    <div class="row h-100">
                        <div class="col-9"> 
                            <h3 class="h-100 step-name">${step.distance === 0 ? 'Arrived' : step.name}</h3> 
                        </div>
                        <div class="col-3 text-align-left"> 
                            <small class="h-100 step-distance">${Math.round(step.distance)}m</small> 
                        </div>
                    </div>
                    <div class="row h-100">
                        <div class="col-12"> 
                            <small class="h-100 step-instruction mb-2">${step.instruction.instruction}</small> 
                        </div>
                    </div>
                </div> 
            </div>`;
        firstTwoStepscontainer.appendChild(stepElement);

        // Add a divider after each step except the last one
        if (index < firstTwoSteps.length - 1) { 
            const divider = document.createElement("hr");
            divider.className = "purple-divider";
            firstTwoStepscontainer.appendChild(divider);
        }
    });
 
    // clear the existing content in the navigation steps container
    navigationStepsContainer.innerHTML = ''; 

    // Populate the remaining steps
    const lastFewSteps = app.NAVIGATION_ROUTE_STEPS.slice(2);
    lastFewSteps.forEach((step, index) => {
        const stepElement = document.createElement("div");
        stepElement.classList.add("step-item"); 
        const iconClass = getInstructionIcon(step.instruction.instruction);
        stepElement.innerHTML = `
            <div class="row h-100 mb-2">
                <div class="col-3 d-flex align-items-center justify-content-center">    
                    <i class="text-primary f7-icons bold">${iconClass}</i>
                </div>
                <div class="col-9">
                    <div class="row h-100">
                        <div class="col-9"> 
                            <h3 class="h-100 step-name">${step.distance === 0 ? 'Arrived' : step.name}</h3> 
                        </div>
                        <div class="col-3 text-align-left"> 
                            <small class="h-100 step-distance">${Math.round(step.distance)}m</small> 
                        </div>
                    </div>
                    <div class="row h-100">
                        <div class="col-12"> 
                            <small class="h-100 step-instruction mb-2">${step.instruction.instruction}</small> 
                        </div>
                    </div>
                </div> 
            </div>`;
        navigationStepsContainer.appendChild(stepElement);

        // Add a divider after each step except the last one
        if (index < app.NAVIGATION_ROUTE_STEPS.length - 1) { 
            const divider = document.createElement("hr");
            divider.className = "purple-divider";
            navigationStepsContainer.appendChild(divider);
        }
    });
}

/**
 * Populates the route instructions for desktop view, displaying the first two steps and all remaining steps.
 * 
 * @param {Object} app - The Framework7 app instance containing configuration and state.
 * @param {HTMLElement} firstTwoStepscontainer - The container for the first two steps.
 * 
 */
export function populateRouteInstructionsDesktop(app, firstTwoStepscontainer) {
    // clear the existing content in the firstTwoStepscontainer
    firstTwoStepscontainer.html(''); 

    // Populate the first two steps
    app.NAVIGATION_ROUTE_STEPS.forEach((step, index) => {
        const stepElement = document.createElement("div");
        stepElement.classList.add("step-item");
        const iconClass = getInstructionIcon(step.instruction.instruction);
        stepElement.innerHTML = `
            <div class="step-item">
                <div class="h-100 row mb-2">
                    <div class="col-3 d-flex align-items-center justify-content-center">
                        <i class="text-primary f7-icons bold">${iconClass}</i>
                    </div>
                    <div class="col-9">
                        <div class="row h-100">
                            <div class="col-9">
                                <h3 class="h-100 step-name">${step.distance === 0 ? 'Arrived' : step.name}</h3>
                            </div>
                            <div class="col-3 text-align-left">
                                <small class="h-100 step-distance">${Math.round(step.distance)}m</small>
                            </div>
                        </div>
                        <div class="row h-100">
                            <div class="col-12">
                                <small class="h-100 step-instruction mb-2">${step.instruction.instruction}</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`; 
        firstTwoStepscontainer.append(stepElement); 

        // Add a divider after each step except the last one
        if (index < app.NAVIGATION_ROUTE_STEPS.length - 1) {
            const divider = document.createElement("hr");
            divider.className = "purple-divider";
            firstTwoStepscontainer.append(divider); 
        }
    });
}