import { getRoute } from "../plugins/maps/mapboxRoute";

export async function checkForURLParams(app, router) {
    const urlParams = new URLSearchParams(window.location.search);

    const startLocation = urlParams.get('startLocation');
    const destinationLocation = urlParams.get('destinationLocation');
    const destinationLocationCoordinates = urlParams.get('destinationLocationCoordinates');
    const destinationLocationData = urlParams.get('destinationLocationData');
    const mode = urlParams.get('mode');

    if (!(urlParams.has('startLocation') || urlParams.has('destinationLocation') || urlParams.has('destinationLocationCoordinates') || urlParams.has('destinationLocationData') || urlParams.has('mode'))) {
      return;
    }

    if (startLocation) {
      app.START_LOCATION = JSON.parse(startLocation);
    }

    if (destinationLocation) {
      app.DESTINATION_LOCATION = JSON.parse(destinationLocation);
    }

    if (destinationLocationCoordinates) {
      app.DESTINATION_LOCATION_COORDINATES = JSON.parse(destinationLocationCoordinates);
    }

    if (destinationLocationData) {
      app.DESTINATION_LOCATION_DATA = JSON.parse(destinationLocationData);
    }

    if (mode) {
      app.TRANSPORTATION_MODE = JSON.parse(mode);
    }

    console.log("Parsed URL Parameters:", { startLocation: app.START_LOCATION, endLocation: app.END_LOCATION, route: app.TRANSPORTATION_MODE });

    if (!app.DESTINATION_LOCATION || !app.DESTINATION_LOCATION_COORDINATES || !app.DESTINATION_LOCATION_COORDINATES) {
      app.dialog.alert('No valid destination found for the search term. Please reenter the search destination.', 'Error', () => {
        router.navigate('/');
      });
    }

    getRoute(app, router).then(() => {
      console.log('Route fetched successfully:', app.NAVIGATION_ROUTE);
      if (app.AR) {
        app.router.navigate('/navigation');
      } else {
        app.router.navigate('/navigationDesktop');
      }
    }).catch((error) => {
      console.error('Error fetching route:', error);
      app.dialog.alert('No valid route for the destination proivded. Please reenter the search destination.', 'Error', () => {
        router.navigate('/');
      });
    });
}

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
      // If it's not a desktop device, the check is considered passed/irrelevant.
      if (deviceCheck && !app.DESKTOP_DEVICE) {
        conditionMet = true; // Skip check for non-desktop devices if deviceCheck is true
      }

      if (!conditionMet) {
        // Display a dialog with custom error details
        app.dialog.alert(description, title, () => {
          router.navigate(redirectPath);
        });

        const logMethod = console[severity] || console.log; // Default to console.log if severity is not a valid method
        logMethod(`Route guard check failed: ${title}`);
        app.routeGuardActive = false;
        return reject(); // Ensure reject is called here
      }
    }

    // All checks passed
    app.routeGuardActive = false;
    resolve();
  };
};