/**
 * App : smoke, notifications, navigation onglets (mocks stack/tab dans jest.setup.js).
 */
import React from "react";
import { Platform } from "react-native";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("../screens/HomeScreen", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return function MockHome() {
    return <Text>Avancement du jour</Text>;
  };
});
jest.mock("../screens/StatsScreen", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return function MockStats() {
    return <Text>Statistiques</Text>;
  };
});
jest.mock("../screens/PrivacyPolicyScreen", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return function MockPrivacy() {
    return <Text>Politique de confidentialité</Text>;
  };
});
jest.mock("../screens/NewTaskScreen", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return function MockNewTask() {
    return <Text>Nouvelle tâche écran</Text>;
  };
});

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

const App = require("../App").default;
const {
  ensureNotificationPermission,
} = require("../utils/notificationHelper");

describe("App", () => {
  const previousOS = Platform.OS;

  beforeEach(async () => {
    await AsyncStorage.clear();
    await AsyncStorage.setItem("tasks", JSON.stringify([]));
  });

  afterEach(() => {
    Platform.OS = previousOS;
  });

  it("se monte sans crasher", () => {
    const { unmount } = render(<App />);
    expect(screen.getByTestId("jest-mock-bottom-tabs")).toBeOnTheScreen();
    unmount();
  });

  it("demande la permission notification au montage", async () => {
    render(<App />);
    await waitFor(() => {
      expect(ensureNotificationPermission).toHaveBeenCalled();
    });
  });

  it("affiche l’accueil et navigue entre onglets (Android)", async () => {
    Platform.OS = "android";
    render(<App />);

    expect(await screen.findByText("Avancement du jour")).toBeOnTheScreen();

    fireEvent.press(screen.getByText("Stats"));
    expect(await screen.findByText("Statistiques")).toBeOnTheScreen();

    expect(screen.queryByText("Confidentialité")).toBeNull();
  });

  it("sous iOS, onglet Confidentialité ouvre l’écran", async () => {
    Platform.OS = "ios";
    render(<App />);

    await screen.findByText("Avancement du jour");

    fireEvent.press(screen.getByText("Confidentialité"));
    expect(
      await screen.findByText("Politique de confidentialité")
    ).toBeOnTheScreen();
  });

  it("tabBarIcon : pas d’Ionicons si getTabBarIconName renvoie undefined", () => {
    const tabBarIcons = require("../utils/tabBarIcons");
    const spy = jest
      .spyOn(tabBarIcons, "getTabBarIconName")
      .mockReturnValue(undefined);
    try {
      render(<App />);
      expect(screen.getByTestId("jest-mock-bottom-tabs")).toBeOnTheScreen();
    } finally {
      spy.mockRestore();
    }
  });
});
