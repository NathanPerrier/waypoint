import HomePage from '../pages/home.f7';
import RoutePage from '../pages/route.f7';
import RouteDesktopPage from '../pages/routeDesktop.f7';

import NotFoundPage from '../pages/404.f7';

function displayDialog(router, title, description, redirectPath) {
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
}

const createRouteGuard = (checks) => {
  return async function ({ resolve, reject }) {
    const router = this;
    const app = router.app;

    // Wait for the config initialization promise to resolve
    try {
      await app.initializationPromise;
    } catch (error) {
      console.error("Config initialization failed, cannot proceed with route guard:", error);
      displayDialog(router, "Initialization Error", "The application could not initialize properly. Please try again later.", '/');
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
        
        displayDialog(router, title, description, redirectPath);

        const logMethod = console[severity] || console.log; // Default to console.log if severity is not a valid method
        logMethod(`Route guard check failed: ${title}`);
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
        severity: 'error',
      },
      {
        condition: (app) => !!app.AR,
        redirectPath: '/routeDesktop/',
        title: 'AR Library Not Loaded',
        description: 'The AR library is not available on this device. Desktop environment detected. Please use a mobile device for AR features.',
        severity: 'warn',
        
      },
      {
        condition: (app) => !!app.WEBCAM_ENABLED,
        redirectPath: '/routeDesktop/',
        title: 'Webcam Not Enabled',
        description: 'The application requires webcam access. Please enable your webcam and try again.',
        deviceCheck: true, 
        severity: 'error',
      },
      {
        condition: (app) => !!app.RENDERER && !!app.LOCAR_SCENE && !!app.LOCAR_CAMERA && !!app.CAM && !!app.DEVICE_ORIENTATION_CONTROLS,
        redirectPath: '/routeDesktop/',
        title: 'AR Components Not Initialized',
        description: 'The AR components are not initialized correctly. Please check your device and try again.',
        severity: 'error',
      },
      {
        condition: (app) => !!app.MAPBOX_ACCESS_TOKEN && !!app.MAP_SESSION_TOKEN && !!app.TRANSPORTATION_MODE && !!app.MAP_LOCATION_CENTER && !!app.MAP_LOCATION_BOUNDS,
        redirectPath: '/',
        title: 'Mapbox Access Token Missing',
        description: 'Mapbox failed to initialised. Navagtion services are not available. Please try again.',
        severity: 'error',
      }
    ]),
  },
  {
    path: '/routeDesktop/',
    component: RouteDesktopPage,
    beforeEnter: createRouteGuard([
      {
        condition: (app) => !!app.USER_LOCATION,
        redirectPath: '/',
        title: 'User Location Missing',
        description: 'The application could not determine your location. Please enable location services and try again.',
        severity: 'error',
      },
      {
        condition: (app) => !!app.MAPBOX_ACCESS_TOKEN && !!app.MAP_SESSION_TOKEN && !!app.TRANSPORTATION_MODE && !!app.MAP_LOCATION_CENTER && !!app.MAP_LOCATION_BOUNDS,
        redirectPath: '/',
        title: 'Mapbox Access Token Missing',
        description: 'Mapbox failed to initialised. Navagtion services are not available. Please try again.',
        severity: 'error',
      }

      //! Add more checks as needed
    ]),
    keepAlive: true, 
  },
  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;