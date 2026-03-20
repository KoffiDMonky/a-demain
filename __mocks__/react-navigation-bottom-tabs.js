/**
 * Mock Jest — seul App.js importe ce module. Exécute tabBarIcon pour la couverture App.js.
 */
const React = require("react");
const { View, Pressable, Text } = require("react-native");

module.exports = {
  createBottomTabNavigator: () => ({
    Navigator: function JestMockTabNavigator({ children, screenOptions }) {
      const screens = [];
      React.Children.forEach(children, (el) => {
        if (el && el.props && el.props.name) {
          screens.push({
            name: el.props.name,
            component: el.props.component,
          });
        }
      });
      const [active, setActive] = React.useState(0);
      const Cmp = screens[active]?.component || (() => null);
      const opts = screenOptions;
      return (
        <View testID="jest-mock-bottom-tabs">
          <View testID="jest-mock-tab-scene">
            <Cmp
              navigation={{ navigate: jest.fn(), setOptions: jest.fn() }}
              route={{ name: screens[active]?.name, key: "tab" }}
            />
          </View>
          <View testID="jest-mock-tab-bar">
            {screens.map((s, i) => {
              const route = { name: s.name, key: s.name };
              const resolved =
                typeof opts === "function" ? opts({ route }) : opts || {};
              const tabBarIcon = resolved.tabBarIcon;
              const focused = i === active;
              return (
                <Pressable
                  key={s.name}
                  onPress={() => setActive(i)}
                  accessibilityRole="button"
                >
                  <Text>{s.name}</Text>
                  {tabBarIcon
                    ? tabBarIcon({
                        focused,
                        color: focused ? "#FF2E54" : "black",
                        size: 24,
                      })
                    : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    },
    Screen: () => null,
  }),
};
