import rolly from 'rolly.js';

const appElement = document.querySelector('.app');
if (appElement) {
  const r = rolly({
    view: appElement,
    native: true,
    // other options
  });
  r.init();
} else {
  console.error("Element with class '.app' not found. Rolly initialization skipped.");
}