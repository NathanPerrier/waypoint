import HomePage from '../pages/home.f7';
import RoutePage from '../pages/route.f7';
import RouteDesktopPage from '../pages/routeDesktop.f7';

import NotFoundPage from '../pages/404.f7';

// Removed config import as variables are now on the app instance

import { initializeConfig } from './config.js'; // Import only the initializer function


// Helper function to create route guards
const createRouteGuard = (checks, redirectPath) => {
  return async function ({ resolve, reject }) {
    const router = this;
    const app = router.app;
    
    console.log(app.USER_LOCATION, app.LOCAR, app.DESKTOP_DEVICE);

    // Wait for the config initialization promise to resolve
    try {
      await app.initializationPromise;
    } catch (error) {
      console.error("Config initialization failed, cannot proceed with route guard:", error);
      // Decide how to handle initialization failure - maybe redirect to an error page?
      // For now, rejecting to the specified redirect path.
      return reject(redirectPath);
    }

    for (const check of checks) {
      if (!check(app)) {
        // Correctly create and open the dialog
        app.dialog.create({
          title: "Feature(s) Unavailable", // Use a generic title or pass check name
          text: app.MOBILE_DEVICE+' '+app.DESKTOP_DEVICE+' Required configuration (e.g., location, camera or device) not available. Features may be limited, changed or unavailable.',
          buttons: [
            {
              text: 'OK',
              onClick: function () {
                // Redirect after dialog is closed
                router.navigate(redirectPath);
              },
            },
          ],
        }).open();

        console.warn('Route guard check failed, redirecting to:', redirectPath);
        // Reject immediately, the dialog handles the user interaction and subsequent navigation
        return reject(); // Reject without a path, as navigation is handled by dialog
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
    beforeEnter: createRouteGuard(
      [

        //! add all required config variables here for /route/ 

        (app) => !!app.USER_LOCATION,
        (app) => !!app.LOCAR,
      
      ],
      '/routeDesktop/' // Redirect here if any check fails
    ),
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