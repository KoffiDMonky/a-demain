const React = require("react");
const { View, TouchableOpacity } = require("react-native");

// Évite l'appel au module natif en tests
const Swipeable = React.forwardRef(function Swipeable(
  { children, renderRightActions, onSwipeableOpen },
  ref
) {
  React.useImperativeHandle(ref, () => ({
    close: jest.fn(),
  }));
  return React.createElement(
    View,
    { testID: "swipeable" },
    children,
    renderRightActions &&
      React.createElement(View, { testID: "right-actions" }, renderRightActions()),
    onSwipeableOpen
      ? React.createElement(View, {
          testID: "swipe-open-simulate",
          onTouchEnd: () => onSwipeableOpen("right"),
        })
      : null
  );
});

module.exports = {
  GestureHandlerRootView: View,
  Swipeable,
  RectButton: TouchableOpacity,
};
