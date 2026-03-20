/**
 * Mock Jest — NavigationContainer rend les enfants (sinon arbre vide sous Jest).
 * requireActual via le chemin du package (évite la résolution vers ce fichier mappé).
 */
const path = require("path");
const React = require("react");
const { View } = require("react-native");

const pkgDir = path.dirname(
  require.resolve("@react-navigation/native/package.json")
);
const actual = jest.requireActual(
  path.join(pkgDir, "lib/module/index.js")
);

module.exports = {
  ...actual,
  NavigationContainer: ({ children }) => (
    <View testID="jest-mock-navigation-container">{children}</View>
  ),
};
