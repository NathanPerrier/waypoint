import HomePage from '../pages/home.f7';
import RoutePage from '../pages/route.f7';
import RouteDesktopPage from '../pages/routeDesktop.f7';

import NotFoundPage from '../pages/404.f7';

// Helper function to create route guards
const createRouteGuard = (checks) => {
  return async function ({ resolve, reject }) {
    const router = this;
    const app = router.app;

    // Wait for the config initialization promise to resolve
    try {
      await app.initializationPromise;
    } catch (error) {
      console.error("Config initialization failed, cannot proceed with route guard:", error);
      return reject('/error'); // Redirect to a generic error page if initialization fails
    }

    console.log(app.USER_LOCATION, app.LOCAR, app.DESKTOP_DEVICE);

    for (const check of checks) {
      const { condition, redirectPath, title, description, deviceCheck } = check;

      // Check the primary condition
      let conditionMet = condition(app);

      // If deviceCheck is specified and true, also check app.DEVICE
      if (deviceCheck && app.DESKTOP_DEVICE) {
        conditionMet = true // If device check is required and app.DEVICE is false, the overall condition fails
      }

      if (!conditionMet) {
        // Display a dialog with custom error details
        app.dialog.create({
          title: title,
          text: description,
          buttons: [
            {
              text: 'OK',
              onClick: function () {
                router.navigate(redirectPath);
              },
            },
          ],
        }).open();

        console.warn(`Route guard check failed: ${title}`);
        return reject(); // Reject immediately, navigation is handled by the dialog
      }
    }

    // All checks passed
    resolve();
  };
};

var routes = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/route/',
    component: RoutePage,
    keepAlive: true,
    beforeEnter: createRouteGuard([
      {
        condition: (app) => !!app.USER_LOCATION,
        redirectPath: '/',
        title: 'User Location Missing',
        description: 'The application could not determine your location. Please enable location services and try again.',
      },
      {
        condition: (app) => !!app.AR,
        redirectPath: '/routeDesktop/',
        title: 'AR Library Not Loaded',
        description: 'The AR library failed to load. Some features may not be available.',
        deviceCheck: true, // Add missing comma here
      },
      {
        condition: (app) => app.WEBCAM_ENABLED,
        redirectPath: '/routeDesktop/',
        title: 'Webcam Not Enabled',
        description: 'The application requires webcam access. Please enable your webcam and try again.',
        deviceCheck: true, // Example: This check now also requires app.DEVICE to be true
      },
    ]),
  },
  {
    path: '/routeDesktop/',
    component: RouteDesktopPage,
    keepAlive: true, // Add missing comma here
  },
  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;