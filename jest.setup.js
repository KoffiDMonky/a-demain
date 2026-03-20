// Extend matchers (RTL 12.4+ inclut les matchers, @testing-library/jest-native déprécié)
import '@testing-library/jest-native/extend-expect';

// ReanimatedSwipeable : même mock que RNGH (évite le module natif / Reanimated en tests)
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const rngh = require('./__mocks__/react-native-gesture-handler.js');
  return {
    __esModule: true,
    default: rngh.Swipeable,
    SwipeDirection: { LEFT: 'left', RIGHT: 'right' },
  };
});

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

// Sous Jest, SafeAreaProvider peut ne pas descendre les enfants dans l’arbre RTL (écran vide).
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  const actual = jest.requireActual("react-native-safe-area-context");
  return {
    ...actual,
    SafeAreaProvider: ({ children }) => <>{children}</>,
  };
});
