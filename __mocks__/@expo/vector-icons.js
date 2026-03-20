const React = require("react");
const { Text } = require("react-native");

function MockIcon(props) {
  return React.createElement(Text, {
    accessibilityLabel: props.name,
    testID: `icon-${props.name}`,
  }, props.name || "");
}

module.exports = {
  Ionicons: MockIcon,
};
