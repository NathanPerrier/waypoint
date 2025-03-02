
import HomePage from '../pages/home.f7';
import AboutPage from '../pages/about.f7';
import FormPage from '../pages/form.f7';
import RoutePage from '../pages/route.f7';
import SettingsPage from '../pages/settings.f7';

import NotFoundPage from '../pages/404.f7';

var routes = [
  {
    path: '/',
    component: HomePage,
  },
  {
    path: '/about/',
    component: AboutPage,
  },
  {
    path: '/route/',
    component: RoutePage,
  },
  {
    path: '/settings/',
    component: SettingsPage,
  },

  {
    path: '(.*)',
    component: NotFoundPage,
  },
];

export default routes;