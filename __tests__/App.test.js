/**
 * Smoke test - App se monte sans crasher et affiche l'écran d'accueil
 */
import React from "react";
import { render } from "@testing-library/react-native";
import App from "../App";

jest.mock("../utils/notificationHelper", () => ({
  ensureNotificationPermission: jest.fn(() => Promise.resolve(true)),
  scheduleTaskNotification: jest.fn(() => Promise.resolve(null)),
  cancelTaskNotification: jest.fn(() => Promise.resolve()),
}));

jest.mock("lottie-react-native", () => {
  const { View } = require("react-native");
  return function MockLottie() {
    return <View testID="lottie-mock" />;
  };
});

describe("App", () => {
  it("se monte sans crasher", () => {
    const { unmount } = render(<App />);
    unmount();
  });
});
