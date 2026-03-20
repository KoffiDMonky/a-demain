const React = require("react");
const { View, Text } = require("react-native");

function MockDateTimePicker({ value, onChange }) {
  return React.createElement(
    View,
    { testID: "datetime-picker-ios" },
    React.createElement(Text, { testID: "picker-value" }, value ? value.toISOString() : ""),
    React.createElement(View, {
      testID: "picker-trigger-change",
      onTouchEnd: () => onChange({ type: "set" }, new Date(2025, 0, 15, 14, 30)),
    }),
    React.createElement(View, {
      testID: "picker-trigger-no-date",
      onTouchEnd: () => onChange({ type: "dismissed" }, undefined),
    })
  );
}

module.exports = {
  __esModule: true,
  default: MockDateTimePicker,
  DateTimePickerAndroid: {
    open: jest.fn(),
  },
};
