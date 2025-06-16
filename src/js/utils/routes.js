import { getRoute } from "../plugins/maps/mapboxRoute";
import { isWithinBounds } from "./dom";

/**
 * Checks for URL parameters and initializes the app state accordingly.
 * 
 * @async
 * 
 * @param {Object} app - The Framework7 app instance.
 * @param {Object} router - The Framework7 router instance.
 * 
 * @returns {Promise<void>} - A promise that resolves when the URL parameters are processed.
 * @throws {Error} - If the URL parameters cannot be parsed or if the destination location is invalid.
 * 
 */
export async function checkForURLParams(app, router) {
  // create URLSearchParams object to parse the URL parameters
  const urlParams = new URLSearchParams(window.location.search);

  // Extract URL parameters
  const startLocation = urlParams.get('startLocation');
  const destinationLocation = urlParams.get('destinationLocation');
  const destinationLocationCoordinates = urlParams.get('destinationLocationCoordinates');
  const destinationLocationData = urlParams.get('destinationLocationData');
  const mode = urlParams.get('mode');
  const debug = urlParams.get('debugMode');

  // if debugMode is set, enable debug mode and set test values
  if (debug) {
    console.warn("APP DEBUG MODE ENABLED. TEST VALUES SET.");
    app.DEBUG = true;
    app.MAP_LOCATION_BOUNDS = null;
    app.MAPBOXGL_LOCATION_BOUNDS = null;
    app.MAP_LOCATION_BOUNDS_LNGLATLIKE = null;
  }

  // If no relevant URL parameters are found, exit early
  if (!(urlParams.has('startLocation') || urlParams.has('destinationLocation') || urlParams.has('destinationLocationCoordinates') || urlParams.has('destinationLocationData') || urlParams.has('mode'))) {
    return;
  }


  try {
    // See if optional URL parameters are present and parse them
    if (startLocation) {
      app.START_LOCATION = JSON.parse(startLocation);
    }
    if (mode && (mode === 'driving' || mode === 'walking' || mode === 'cycling')) {
      app.TRANSPORTATION_MODE = mode;
    }
  } catch (error) {
    console.warn('Could not parse startLocation or mode from URL params:', error);
  }

  // set destination data
  if (destinationLocation) {
    app.DESTINATION_LOCATION = JSON.parse(destinationLocation);
  }

  if (destinationLocationCoordinates) {
    app.DESTINATION_LOCATION_COORDINATES = JSON.parse(destinationLocationCoordinates);
  }

  if (destinationLocationData) {
    app.DESTINATION_LOCATION_DATA = JSON.parse(destinationLocationData);
  }  

  // Check if destination data is set
  if (!app.DESTINATION_LOCATION || !app.DESTINATION_LOCATION_COORDINATES || !app.DESTINATION_LOCATION_COORDINATES) {
    app.dialog.alert('No valid destination found for the search term. Please reenter the search destination.', 'Error');
  }

  // If no start location is provided, use the current user location
  app.DESTINATION_LOCATION_DATA.startLocation = app.START_LOCATION;

  //check if user wishes to navigate to app.DESTINATION_LOCATION
  app.dialog.confirm(`Do you want to navigate to ${app.DESTINATION_LOCATION}?`, 'Navigation', () => {

    app.dialog.close();
    app.dialog.preloader('Loading route...');

    // Check if the start location is within the allowed bounds
    if (!isWithinBounds(app, app.START_LOCATION)) {
        app.dialog.close();
        app.dialog.alert('Your current location is outside the allowed area. Please select a different location.', 'Invalid Start Location');
        return;
    }

    // get the route from Mapbox Directions API
    getRoute(app, router).then(() => {
      app.dialog.close();

      if (app.AR) {
        app.tab.show('#view-navigation');
      } else {
        app.tab.show('#view-navigation-desktop');
      }
      
    }).catch((error) => {
      console.error('Error fetching route:', error);
      app.dialog.alert('No valid route for the destination proivded. Please reenter the search destination.', 'Error');
    });
  });  
}

/**
 * Creates a route guard function that checks various conditions before allowing navigation.
 * 
 * @param {Array} checks - An array of check objects, each containing:
 * @param {Function} checks.condition - A function that returns a boolean indicating if the condition is met.
 * @param {string} checks.redirectPath - The path to redirect to if the condition is not met.
 * @param {string} checks.title - The title of the dialog to display if the condition is not met.
 * @param {string} checks.description - The description of the dialog to display if the condition is not met.
 * @param {boolean} [checks.deviceCheck] - If true, the check only applies to desktop devices.
 * @param {string} [checks.severity='error'] - The severity level for logging the error (e.g., 'error', 'warn', 'info').
 * 
 * @returns {Function} - A function that can be used as a route guard in Framework7.
 * @throws {Error} - If the app initialization fails or if the route guard is invoked multiple times.
 * 
 * */
export const createRouteGuard = (checks) => {
  return async function ({ resolve, reject }) {
    const router = this;
    const app = router.app;

    // Ensure the route guard is not invoked multiple times
    if (app.routeGuardActive) {
      console.warn("Route guard already active, skipping duplicate invocation.");
      return reject();
    }
    app.routeGuardActive = true;

    try {
      // Wait for the config initialization promise to resolve
      await app.initializationPromise;
    } catch (error) {
      console.error("Config initialization failed, cannot proceed with route guard:", error);
      app.dialog.alert("App initialization failed. Please try again later.", 'Error', () => {
        app.router.navigate('/');
      });
      app.AR = false;
      app.routeGuardActive = false;
      return reject(); // Ensure reject is called here
    }

    for (const check of checks) {
      const { condition, redirectPath, title, description, deviceCheck, severity } = check;

      // Check the primary condition
      let conditionMet = condition(app);

      // If deviceCheck is specified, this check only applies to desktop devices.
      // Skip check for non-desktop devices if deviceCheck is true
      if (deviceCheck && !app.DESKTOP_DEVICE) {
        conditionMet = true; 
      }

      if (!conditionMet) {
        // Display a dialog with custom error details
        app.dialog.alert(description, title, () => {
          router.navigate(redirectPath);
        });

        // Default to console.log if severity is not a valid method
        const logMethod = console[severity] || console.log; 
        logMethod(`Route guard check failed: ${title}`);
        app.routeGuardActive = false;
        return reject(); 
      }
    }

    // All checks passed
    app.routeGuardActive = false;
    resolve();
  };
};