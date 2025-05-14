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


export function updateRouteData(destinationName, navigationTime, navigationDistance, destinationElement, navigationInfoElement) {
    if (destinationElement && destinationElement.length > 0) { 
        destinationElement.html(destinationName); 
    }

    if (navigationInfoElement && navigationInfoElement.length > 0) { 
        navigationInfoElement.html(`${navigationTime} - ${navigationDistance}`); 
    }
}

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

export function populateRouteInstructions(app, firstTwoStepscontainer, navigationStepsContainer) {

    firstTwoStepscontainer.innerHTML = ''; 
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
        if (index < firstTwoSteps.length - 1) { 
            const divider = document.createElement("hr");
            divider.className = "purple-divider";
            firstTwoStepscontainer.appendChild(divider);
        }
    });
 
    navigationStepsContainer.innerHTML = ''; 
    app.NAVIGATION_ROUTE_STEPS.forEach((step, index) => {
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
        if (index < app.NAVIGATION_ROUTE_STEPS.length - 1) { // Add divider if not the last item
            const divider = document.createElement("hr");
            divider.className = "purple-divider";
            navigationStepsContainer.appendChild(divider);
        }
    });
}

export function populateRouteInstructionsDesktop(app, firstTwoStepscontainer) {
    firstTwoStepscontainer.html(''); 
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
            </div>`; // Changed from stepElement.html()
        firstTwoStepscontainer.append(stepElement); // Use .append() for Dom7 to append a native DOM element
        if (index < app.NAVIGATION_ROUTE_STEPS.length - 1) {
            const divider = document.createElement("hr");
            divider.className = "purple-divider";
            firstTwoStepscontainer.append(divider); // Use .append() for Dom7
        }
    });
}