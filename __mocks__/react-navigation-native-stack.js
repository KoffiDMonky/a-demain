/**
 * Mock Jest — seul App.js importe ce module.
 */
const React = require("react");
const { View } = require("react-native");

module.exports = {
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => (
      <View testID="jest-mock-native-stack">{children}</View>
    ),
    Screen: ({ name, component: Component }) => {
      if (name !== "Retour" || !Component) return null;
      return (
        <View testID="jest-mock-stack-retour">
          <Component
            navigation={{ navigate: jest.fn(), setOptions: jest.fn() }}
            route={{ key: "retour", name: "Retour", params: undefined }}
          />
        </View>
      );
    },
  }),
};
