import { Platform } from "react-native";

/**
 * Nom d’icône Ionicons pour la barre d’onglets (même règles que App.js).
 * @param {string} routeName
 * @param {boolean} focused
 * @param {string} [platformOs] — surcharge pour les tests (défaut : Platform.OS)
 * @returns {string | undefined}
 */
export function getTabBarIconName(routeName, focused, platformOs = Platform.OS) {
  const isIOS = platformOs === "ios";

  if (routeName === "Accueil") {
    return focused ? "home" : "home-outline";
  }
  if (routeName === "Demain") {
    return focused ? "calendar" : "calendar-outline";
  }
  if (routeName === "Stats") {
    return focused ? "bar-chart" : "bar-chart-outline";
  }
  if (routeName === "Confidentialité" && isIOS) {
    return focused ? "information-circle" : "information-circle-outline";
  }
  return undefined;
}
