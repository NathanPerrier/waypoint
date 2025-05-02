export async function checkForURLParams(app, router) {
    const urlParams = new URLSearchParams(window.location.search);
    console.log("URL Parameters:", urlParams.toString());
    const startLocation = urlParams.get('startLocation');
    const endLocation = urlParams.get('endLocation');
    const mode = urlParams.get('mode');

    if (!(urlParams.has('startLocation') || urlParams.has('endLocation') || urlParams.has('mode'))) {
      return;
    }

    if (startLocation) {
      app.START_LOCATION = JSON.parse(startLocation);
    }

    if (endLocation) {
      app.END_LOCATION = JSON.parse(endLocation);
    }

    if (mode) {
      app.TRANSPORTATION_MODE = JSON.parse(mode);
    }

    console.log("Parsed URL Parameters:", { startLocation: app.START_LOCATION, endLocation: app.END_LOCATION, route: app.TRANSPORTATION_MODE });

    if (!app.END_LOCATION) {
      app.dialog.alert('No valid destination found for the search term. Please reenter the search destination.', 'Error', () => {
        router.navigate('/');
      });
    }
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