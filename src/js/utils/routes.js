import { displayDialog } from './dialog.js';

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
      displayDialog(app, router, "Error", "No destination location provided. Please set a destination.", '/route/');
    }
}

export const createRouteGuard = (checks) => {
  return async function ({ resolve, reject }) {
    const router = this;
    const app = router.app;
    
    // Wait for the config initialization promise to resolve
    try {
      await app.initializationPromise;
    } catch (error) {
      console.error("Config initialization failed, cannot proceed with route guard:", error);
      displayDialog(app, router, "Initialization Error", "The application could not initialize properly. Please try again later.", '/');
      app.AR = false;
      return reject(); 
    }

    for (const check of checks) {
      const { condition, redirectPath, title, description, deviceCheck, severity } = check;

      // Check the primary condition
      let conditionMet = condition(app);

      // If deviceCheck is specified and true, also check app.DEVICE
      if (deviceCheck && app.DESKTOP_DEVICE) {
        conditionMet = true // If device check is required and app.DEVICE is false, the overall condition fails
      }

      if (!conditionMet) {
        // Display a dialog with custom error details
        
        displayDialog(app, router, title, description, redirectPath);

        const logMethod = console[severity] || console.log; // Default to console.log if severity is not a valid method
        logMethod(`Route guard check failed: ${title}`);
        return reject(); // Reject immediately, navigation is handled by the dialog
      }
    }

    // All checks passed
    resolve();
  };
};