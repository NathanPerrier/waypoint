// Import necessary Turf.js functions
// You might only need specific modules for smaller bundles, e.g., @turf/distance, @turf/nearest-point-on-line, etc.
import * as turf from '@turf/turf';

// Assume 'app' is a globally accessible object or imported/passed in
// For example:
// import { app } from './yourAppGlobalState'; // If using modules
// Or ensure 'app' is available in the scope where this module is used.

export const navigationManager = (() => {
    const app = window.app; // Assuming app is globally available

    // --- Configuration ---
    const config = {
        // Distance in meters: How close the user needs to be to the end of a step to trigger the next one.
        stepCompletionThreshold: 15,
        // Distance in meters: How far the user can be from the route line before considered off-route.
        offRouteThreshold: 40,
        // Minimum accuracy in meters: Ignore updates if GPS accuracy is worse than this.
        minAccuracyThreshold: 50,
        // Minimum speed in m/s to consider heading reliable for off-route checks (optional)
        minSpeedForHeadingCheck: 1.0,
        // Angle difference (degrees) between user heading and route segment bearing to suspect off-route (optional)
        offRouteHeadingDifference: 60,
    };

    // --- State Variables ---
    let isActive = false;
    let currentRoute = null; // GeoJSON LineString representation of the whole route
    let currentSteps = [];
    let totalRouteDistance = 0;
    let totalRouteDuration = 0;

    let currentState = {
        currentStepIndex: 0,
        distanceToNextManeuver: 0,
        timeToNextManeuver: 0, // This is harder to estimate accurately without traffic etc. Use step duration remaining.
        distanceRemaining: 0,
        timeRemaining: 0, // Estimate based on overall progress and duration
        nextInstruction: null,
        isOffRoute: false,
        currentSpeed: 0, // User's current speed (m/s)
        currentHeading: null, // User's current heading (degrees)
        timestamp: null, // Timestamp of the last update processed
        distanceTraveledOnStep: 0, // How far along the current step geometry
        closestPointOnRoute: null, // GeoJSON point feature of the snapped location
    };

    // --- Callbacks ---
    // These functions will be called when state changes. Assign your UI update functions to these.
    let onUpdateCallback = (state) => { console.log("Nav Update:", state); };
    let onOffRouteCallback = (location) => { console.warn("User is off route!", location); };
    let onRouteCompleteCallback = () => { console.log("Navigation Complete!"); };
    let onStepCompleteCallback = (stepIndex, instruction) => { console.log(`Step ${stepIndex} complete. Next: ${instruction?.instruction}`); };

    // --- Helper Functions ---

    /**
     * Calculates the estimated time remaining for a step based on distance and original duration ratio.
     * @param {number} distanceRemainingOnStep Distance left on the current step (meters)
     * @param {object} step The current step object from app.NAVIGATION_ROUTE_STEPS
     * @returns {number} Estimated time in seconds
     */
    function estimateStepTimeRemaining(distanceRemainingOnStep, step) {
        if (!step || step.distance <= 0 || step.duration <= 0) {
            return 0;
        }
        const distanceRatio = distanceRemainingOnStep / step.distance;
        return step.duration * distanceRatio;
    }

     /**
     * Calculates the estimated time remaining for the entire route.
     * @param {number} distanceTraveledTotal Distance traveled along the entire route (meters)
     * @returns {number} Estimated time in seconds
     */
    function estimateTotalTimeRemaining(distanceTraveledTotal) {
        if (totalRouteDistance <= 0 || totalRouteDuration <= 0) {
            return totalRouteDuration; // Return original duration if calculation isn't possible
        }
        const distanceRatioRemaining = (totalRouteDistance - distanceTraveledTotal) / totalRouteDistance;
        // Simple ratio - could be improved with current speed factor
        return totalRouteDuration * distanceRatioRemaining;
    }

    /**
    * Resets the internal navigation state.
    */
    function resetState() {
        isActive = false;
        currentRoute = null;
        currentSteps = [];
        totalRouteDistance = 0;
        totalRouteDuration = 0;
        currentState = {
            currentStepIndex: 0,
            distanceToNextManeuver: 0,
            timeToNextManeuver: 0,
            distanceRemaining: 0,
            timeRemaining: 0,
            nextInstruction: null,
            isOffRoute: false,
            currentSpeed: 0,
            currentHeading: null,
            timestamp: null,
            distanceTraveledOnStep: 0,
            closestPointOnRoute: null,
        };
        console.log("Navigation state reset.");
    }


    // --- Core Logic ---

    /**
     * Starts or replaces the current navigation session.
     * @param {Array<Array<number>>} routeCoords - From app.NAVIGATION_ROUTE [[lon, lat], ...]
     * @param {Array<object>} routeSteps - From app.NAVIGATION_ROUTE_STEPS
     * @param {object} routeData - From app.NAVIGATION_ROUTE_DATA {distance, duration}
     */
    function startNavigation(routeCoords, routeSteps, routeData) {
        console.log("Starting navigation...");
        resetState(); // Reset previous state first

        if (!routeCoords || routeCoords.length < 2 || !routeSteps || routeSteps.length === 0 || !routeData) {
            console.error("Invalid route data provided for navigation.");
            return;
        }

        try {
            // Create a GeoJSON LineString for the entire route for easier processing with Turf
            currentRoute = turf.lineString(routeCoords, { name: "Route" });
            currentSteps = routeSteps.map((step, index) => ({
                ...step,
                // Create GeoJSON LineString for each step's geometry
                geometry: turf.lineString(step.coordinates),
                originalIndex: index // Keep track of the original index
            }));

            totalRouteDistance = routeData.distance || turf.length(currentRoute, { units: 'meters' }); // Use turf length as fallback
            totalRouteDuration = routeData.duration || 0; // Seconds

            // Initial state setup
            currentState.currentStepIndex = 0;
            currentState.distanceRemaining = totalRouteDistance;
            currentState.timeRemaining = totalRouteDuration;
            currentState.nextInstruction = currentSteps[0]?.instruction || null;
            currentState.isOffRoute = false; // Assume starting on route

            isActive = true;
            console.log(`Navigation active. Steps: ${currentSteps.length}, Distance: ${totalRouteDistance.toFixed(1)}m, Duration: ${totalRouteDuration.toFixed(0)}s`);

            // Trigger an initial update if user location is already available
            if (app.USER_LOCATION && app.USER_LOCATION.length === 2) {
                updateNavigationState();
            } else {
                 // Provide initial state even without location yet
                 onUpdateCallback({...currentState});
            }

        } catch (error) {
            console.error("Error processing route data:", error);
            resetState(); // Ensure clean state if processing fails
        }
    }

    /**
     * Stops the current navigation session.
     */
    function stopNavigation() {
        console.log("Stopping navigation.");
        resetState();
        // Optionally notify UI that navigation has stopped
        onUpdateCallback({...currentState}); // Send the reset state
    }

    /**
     * The main function called on GPS updates.
     * Assumes app.USER_LOCATION and other app.* properties are up-to-date.
     */
    function updateNavigationState() {
        if (!isActive || !currentRoute || currentSteps.length === 0) {
            // console.log("Navigation not active or no route loaded.");
            return;
        }

        const userLocation = app.USER_LOCATION; // Expected: [longitude, latitude]
        const userAccuracy = app.USER_LOCATION_ACCURACY;
        const userSpeed = app.USER_LOCATION_SPEED; // m/s
        const userHeading = app.USER_LOCATION_HEADING; // degrees from North
        const timestamp = app.USER_LOCATION_TIMESTAMP;

        if (!userLocation || userLocation.length !== 2 || userLocation[0] === null || userLocation[1] === null) {
            console.warn("Invalid user location received.");
            return;
        }

        if (userAccuracy === null || userAccuracy > config.minAccuracyThreshold) {
            console.warn(`GPS accuracy poor (${userAccuracy?.toFixed(1)}m), skipping update.`);
            // Optionally update state with latest known good data or indicate poor signal
            currentState.timestamp = timestamp; // Still update timestamp
             // Keep previous state otherwise, maybe add a 'signalPoor' flag
            // onUpdateCallback({...currentState, signalPoor: true});
            return; // Don't process unreliable location
        }

        // --- Process Location Update ---
        const userPoint = turf.point(userLocation);
        currentState.currentSpeed = userSpeed ?? 0;
        currentState.currentHeading = userHeading;
        currentState.timestamp = timestamp;

        // 1. Find the closest point on the *entire route* to the user's location
        // This helps determine overall progress and check for major deviations.
        const nearestPointOnFullRoute = turf.nearestPointOnLine(currentRoute, userPoint, { units: 'meters' });
        const distFromRouteLine = nearestPointOnFullRoute.properties.dist;

        // 2. Off-Route Check
        if (distFromRouteLine > config.offRouteThreshold) {
            if (!currentState.isOffRoute) {
                console.warn(`User is off route! Distance: ${distFromRouteLine.toFixed(1)}m`);
                currentState.isOffRoute = true;
                onOffRouteCallback(userLocation); // Notify listener
                // Keep processing to show their location relative to route, but flag as off
            }
            // Optional: Add heading check - are they moving further away?
            // This requires comparing userHeading with bearing from userPoint to nearestPointOnFullRoute
            // const bearingToRoute = turf.bearing(userPoint, nearestPointOnFullRoute);
            // const headingDiff = Math.abs(userHeading - bearingToRoute);
            // if (userSpeed > config.minSpeedForHeadingCheck && (headingDiff > config.offRouteHeadingDifference && headingDiff < (360 - config.offRouteHeadingDifference))) {
            //    console.log("User heading away from route");
            // }

        } else {
            // If previously off-route, mark as back on track
            if (currentState.isOffRoute) {
                console.log("User is back on route.");
                currentState.isOffRoute = false;
            }
        }

        // 3. Determine Current Step and Progress along it
        let currentStep = currentSteps[currentState.currentStepIndex];
        if (!currentStep) {
            console.error("Invalid current step index:", currentState.currentStepIndex);
            // Possibly try to find the closest step? For now, we assume index tracking is correct unless off-route.
             // If off route, might need logic to snap to nearest *future* step
             if (currentState.isOffRoute) {
                 // Simplistic: just keep showing the last known step or stop?
                 // Or find nearest step geometry? Could be complex.
                 // For now, let offRouteCallback handle triggering potential recalculation.
             } else {
                 // This shouldn't happen if on route and not finished. Log error.
             }

            // Update what we can and return
            currentState.closestPointOnRoute = nearestPointOnFullRoute;
            onUpdateCallback({ ...currentState });
            return;
        }

        const currentStepGeometry = currentStep.geometry;
        const nearestPointOnStep = turf.nearestPointOnLine(currentStepGeometry, userPoint, { units: 'meters' });

        // Distance traveled *along* the current step's line geometry
        const distanceAlongStep = nearestPointOnStep.properties.location; // meters
        currentState.distanceTraveledOnStep = distanceAlongStep;

        // How far is left on this specific step's geometry?
        const stepTotalDistance = turf.length(currentStepGeometry, { units: 'meters' });
        // Ensure distance doesn't go negative or exceed step length due to snapping variance
        const distanceRemainingOnStep = Math.max(0, stepTotalDistance - distanceAlongStep);
        currentState.distanceToNextManeuver = distanceRemainingOnStep;
        currentState.timeToNextManeuver = estimateStepTimeRemaining(distanceRemainingOnStep, currentStep);

        // Store the snapped point for potential map display
        currentState.closestPointOnRoute = nearestPointOnStep;


        // 4. Check for Step Completion
        // Use distance remaining on *this* step. Need to be careful near turns.
        // Check if close enough to the *end* of the current step geometry.
        if (distanceRemainingOnStep <= config.stepCompletionThreshold) {

            // Check if it's the *last* step
            if (currentState.currentStepIndex >= currentSteps.length - 1) {
                console.log("Approaching final destination.");
                 // Could trigger arrival logic slightly early or wait for very close distance.
                 // For simplicity, let's advance state to 'completed' here.
                isActive = false; // Stop processing further updates
                currentState.distanceRemaining = 0;
                currentState.timeRemaining = 0;
                currentState.distanceToNextManeuver = 0;
                currentState.timeToNextManeuver = 0;
                currentState.nextInstruction = { instruction: "You have arrived at your destination."};
                currentState.currentStepIndex = currentSteps.length; // Indicate completion
                onStepCompleteCallback(currentStep.originalIndex, currentStep.instruction); // Notify last step complete
                onRouteCompleteCallback();
                onUpdateCallback({ ...currentState }); // Final update
                return; // End processing
            } else {
                // Advance to the next step
                const previousStepIndex = currentState.currentStepIndex;
                const previousStepInstruction = currentStep.instruction;
                currentState.currentStepIndex++;
                const nextStep = currentSteps[currentState.currentStepIndex];
                currentState.nextInstruction = nextStep?.instruction || null;

                // Reset progress for the new step (will be calculated on next GPS update)
                currentState.distanceToNextManeuver = nextStep?.distance || turf.length(nextStep.geometry, {units: 'meters'});
                currentState.timeToNextManeuver = nextStep?.duration || 0;
                currentState.distanceTraveledOnStep = 0; // Reset distance on the new step

                console.log(`Advanced to step ${currentState.currentStepIndex}`);
                onStepCompleteCallback(previousStepIndex, previousStepInstruction); // Notify step completion
            }
        } else {
             // If not completing step, update the primary instruction if needed
             // (Sometimes the 'nextInstruction' might be the current one until completion threshold)
             currentState.nextInstruction = currentStep.instruction;
        }


        // 5. Calculate Overall Route Progress
        // Sum distances of completed steps + distance traveled on current step
        let distanceTraveledTotal = 0;
        for (let i = 0; i < currentState.currentStepIndex; i++) {
            // Use pre-calculated step distance if available, otherwise calculate
            distanceTraveledTotal += currentSteps[i].distance || turf.length(currentSteps[i].geometry, { units: 'meters' });
        }
        distanceTraveledTotal += currentState.distanceTraveledOnStep;

        // Ensure total traveled doesn't exceed total route distance
        distanceTraveledTotal = Math.min(distanceTraveledTotal, totalRouteDistance);

        currentState.distanceRemaining = Math.max(0, totalRouteDistance - distanceTraveledTotal);
        currentState.timeRemaining = estimateTotalTimeRemaining(distanceTraveledTotal);


        // 6. Notify Listeners
        onUpdateCallback({ ...currentState }); // Send a copy of the state

    } // End updateNavigationState


    // --- Public Interface ---
    return {
        start: startNavigation,
        stop: stopNavigation,
        updateLocation: updateNavigationState, // Main function to call on GPS update
        getCurrentState: () => ({ ...currentState }), // Return a copy of the state
        isActive: () => isActive,
        isOffRoute: () => currentState.isOffRoute,

        // Allow setting callbacks
        setOnUpdate: (callback) => {
            if (typeof callback === 'function') onUpdateCallback = callback;
        },
        setOnOffRoute: (callback) => {
            if (typeof callback === 'function') onOffRouteCallback = callback;
        },
        setOnRouteComplete: (callback) => {
            if (typeof callback === 'function') onRouteCompleteCallback = callback;
        },
        setOnStepComplete: (callback) => {
            if (typeof callback === 'function') onStepCompleteCallback = callback;
        },
        // Expose config for potential tweaking from outside? (optional)
        // getConfig: () => ({...config}),
        // setConfig: (newConfig) => { config = {...config, ...newConfig}; }
    };

})();

// --- How to Use ---

/*
// 1. Make sure Turf.js is loaded/imported.
// 2. Make sure your global 'app' object with USER_LOCATION etc. is accessible.

// Example Initialization in your main application code:
import navigationManager from './navigationManager.js'; // Adjust path as needed
// import { app } from './yourAppGlobalState'; // If needed

function updateMyUI(navState) {
    console.log("UI Update:", navState);
    document.getElementById('instruction').innerText = navState.nextInstruction?.instruction || 'Calculating...';
    document.getElementById('distance-next').innerText = navState.distanceToNextManeuver?.toFixed(0) + ' m';
    document.getElementById('distance-total').innerText = navState.distanceRemaining?.toFixed(0) + ' m remaining';
    document.getElementById('time-total').innerText = Math.round(navState.timeRemaining / 60) + ' min remaining';
    document.getElementById('status').innerText = navState.isOffRoute ? 'OFF ROUTE!' : 'On Route';
     document.getElementById('step-progress').value = navState.distanceTraveledOnStep; // Assuming max is step distance
     // ... update speed, accuracy, map marker for snapped location (navState.closestPointOnRoute) etc.
}

function handleOffRoute(userLocation) {
    console.error("Need to recalculate route or prompt user!");
    // Example: Trigger a function to call your routing API again
    // recalculateRouteFrom(userLocation);
    alert("You are off route! Recalculating...");
}

function handleRouteComplete() {
    alert("You have arrived!");
    // Clean up UI, maybe show summary
}

function handleStepComplete(stepIndex, instruction) {
    console.log(`Completed step ${stepIndex}: ${instruction?.instruction}`);
    // Maybe provide haptic feedback or an announcement
}

// Assign your UI update functions
navigationManager.setOnUpdate(updateMyUI);
navigationManager.setOnOffRoute(handleOffRoute);
navigationManager.setOnRouteComplete(handleRouteComplete);
navigationManager.setOnStepComplete(handleStepComplete);


// When you get a new route from your routing service:
// Assuming 'routeResponse' contains the geometry, steps, and summary data
// const routeCoords = routeResponse.routes[0].geometry.coordinates; // Adjust based on your API response structure
// const routeSteps = routeResponse.routes[0].legs[0].steps; // Adjust as needed
// const routeData = { distance: routeResponse.routes[0].distance, duration: routeResponse.routes[0].duration };
// Make sure routeCoords are [longitude, latitude] for Turf.js!
// navigationManager.start(routeCoords, routeSteps, routeData);


// In your GPS Watcher/Callback function:
function onPositionUpdate(pos) {
    // Update your global 'app' state
    app.USER_LOCATION = [pos.coords.longitude, pos.coords.latitude]; // Ensure [lon, lat] order
    app.USER_LOCATION_ALT = pos.coords.altitude;
    app.USER_LOCATION_ACCURACY = pos.coords.accuracy;
    app.USER_LOCATION_ALT_ACCURACY = pos.coords.altitudeAccuracy;
    app.USER_LOCATION_HEADING = pos.coords.heading;
    app.USER_LOCATION_SPEED = pos.coords.speed;
    app.USER_LOCATION_TIMESTAMP = pos.timestamp;

    // Trigger the navigation update
    if (navigationManager.isActive()) {
        navigationManager.updateLocation(); // No need to pass location, it reads from 'app'
    }
}

// Example: Simulate getting a position update
// navigator.geolocation.watchPosition(onPositionUpdate, onError, { enableHighAccuracy: true });

// To stop navigation:
// navigationManager.stop();

*/