const React = require("react");
const { View, TouchableOpacity } = require("react-native");

/**
 * Mock partagé pour Swipeable (API Reanimated : render* reçoit progress, translation, methods).
 */
function invokeRender(fn, prog, trans, mockMethods) {
  if (!fn) return null;
  if (typeof fn === "function") {
    return fn.length >= 2 ? fn(prog, trans, mockMethods) : fn();
  }
  return null;
}

const Swipeable = React.forwardRef(function Swipeable(
  {
    children,
    renderRightActions,
    renderLeftActions,
    onSwipeableOpen,
  },
  ref
) {
  const mockMethods = {
    close: jest.fn(),
    openLeft: jest.fn(),
    openRight: jest.fn(),
    reset: jest.fn(),
  };
  React.useImperativeHandle(ref, () => mockMethods, []);

  const prog = { value: 0 };
  const trans = { value: 0 };

  return React.createElement(
    View,
    { testID: "swipeable" },
    children,
    renderLeftActions &&
      React.createElement(
        View,
        { testID: "left-actions" },
        invokeRender(renderLeftActions, prog, trans, mockMethods)
      ),
    renderRightActions &&
      React.createElement(
        View,
        { testID: "right-actions" },
        invokeRender(renderRightActions, prog, trans, mockMethods)
      ),
    onSwipeableOpen
      ? React.createElement(
          View,
          { testID: "swipe-open-simulate-triggers" },
          React.createElement(View, {
            testID: "swipe-open-simulate-right",
            onTouchEnd: () => onSwipeableOpen("right"),
          }),
          React.createElement(View, {
            testID: "swipe-open-simulate-left",
            onTouchEnd: () => onSwipeableOpen("left"),
          })
        )
      : null
  );
});

module.exports = {
  GestureHandlerRootView: View,
  Swipeable,
  RectButton: TouchableOpacity,
};
