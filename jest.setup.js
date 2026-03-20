// Extend matchers (RTL 12.4+ inclut les matchers, @testing-library/jest-native déprécié)
import '@testing-library/jest-native/extend-expect';

// Réduire le bruit des warnings "not wrapped in act(...)" pour les mises à jour
// asynchrones (loadTasks, loadTomorrowTasks) — les tests utilisent déjà findBy* pour attendre.
const originalError = global.console.error;
const originalWarn = global.console.warn;
beforeAll(() => {
  global.console.error = (...args) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('An update to') && msg.includes('was not wrapped in act')) return;
    originalError.call(console, ...args);
  };
  global.console.warn = (...args) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('Notification trop proche ou passée')) return;
    originalWarn.call(console, ...args);
  };
});
afterAll(() => {
  global.console.error = originalError;
  global.console.warn = originalWarn;
});
