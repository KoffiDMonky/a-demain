/**
 * Tests de non-régression - HomeScreen (rendu + interactions)
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HomeScreen from "../../screens/HomeScreen";

const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();
function getDefaultNavigation() {
  return { navigate: mockNavigate, setOptions: mockSetOptions };
}
jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => true,
  useNavigation: () => ({ navigate: mockNavigate, setOptions: mockSetOptions }),
}));

jest.mock("../../utils/notificationHelper", () => ({
  scheduleTaskNotification: jest.fn(() => Promise.resolve("notif-id")),
  cancelTaskNotification: jest.fn(() => Promise.resolve()),
  ensureNotificationPermission: jest.fn(() => Promise.resolve(true)),
}));

jest.mock("lottie-react-native", () => {
  const { View } = require("react-native");
  return function MockLottie() {
    return <View testID="lottie-mock" />;
  };
});

describe("HomeScreen", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it("affiche le titre Tes tâches du jour", async () => {
    render(
      <HomeScreen navigation={getDefaultNavigation()} />
    );
    await screen.findByText("Tes tâches du jour");
    expect(screen.getByText("Tes tâches du jour")).toBeOnTheScreen();
  });

  it("affiche le message vide quand aucune tâche aujourd'hui", async () => {
    render(
      <HomeScreen navigation={getDefaultNavigation()} />
    );
    await screen.findByText("Aucune tâche pour aujourd'hui 💤");
    expect(
      screen.getByText("Aucune tâche pour aujourd'hui 💤")
    ).toBeOnTheScreen();
  });

  it("navigue vers Nouvelle Tâche au press du bouton ajouter", async () => {
    render(
      <HomeScreen navigation={getDefaultNavigation()} />
    );
    await screen.findByText("Aucune tâche pour aujourd'hui 💤");
    const addButton = screen.getByTestId("icon-add");
    fireEvent.press(addButton);
    expect(mockNavigate).toHaveBeenCalledWith("Nouvelle Tâche");
  });

  it("affiche une tâche du jour quand AsyncStorage en contient", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tasks = [
      {
        id: "task-1",
        text: "Tâche test du jour",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
    ];
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    render(
      <HomeScreen navigation={getDefaultNavigation()} />
    );

    await screen.findByText("Tâche test du jour");
    expect(screen.getByText("Tâche test du jour")).toBeOnTheScreen();
  });

  it("coche la tâche au press (toggle done) et met à jour le storage", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tasks = [
      {
        id: "task-1",
        text: "Tâche à cocher",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
    ];
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Tâche à cocher");

    fireEvent.press(screen.getByText("Tâche à cocher"));

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("tasks");
      const updated = JSON.parse(stored || "[]");
      expect(updated).toHaveLength(1);
      expect(updated[0].status).toBe("done");
    });
  });

  it("navigue vers Nouvelle Tâche avec la tâche au longPress (édition)", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tasks = [
      {
        id: "task-edit",
        text: "Tâche à éditer",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
    ];
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Tâche à éditer");

    fireEvent(screen.getByText("Tâche à éditer"), "longPress");

    expect(mockNavigate).toHaveBeenCalledWith("Nouvelle Tâche", {
      task: expect.objectContaining({ id: "task-edit", text: "Tâche à éditer" }),
    });
  });

  it("supprime la tâche au press du bouton supprimer (right action)", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tasks = [
      {
        id: "task-del",
        text: "Tâche à supprimer",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
    ];
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Tâche à supprimer");

    fireEvent.press(screen.getByTestId("icon-trash-outline"));

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("tasks");
      const updated = JSON.parse(stored || "[]");
      expect(updated).toHaveLength(0);
    });
  });

  it("reporter à demain (snooze) au press du bouton gauche", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tasks = [
      {
        id: "task-snooze",
        text: "Tâche à reporter",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
    ];
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Tâche à reporter");

    fireEvent.press(screen.getByTestId("icon-time-outline"));

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("tasks");
      const updated = JSON.parse(stored || "[]");
      expect(updated).toHaveLength(1);
      expect(updated[0].status).toBe("snoozed");
      expect(updated[0].snoozeCount).toBe(1);
    });
  });

  it("quand toutes les tâches sont done, le press ne décoche pas (allTasksDone)", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tasks = [
      {
        id: "task-done",
        text: "Tâche déjà faite",
        dueDate: today.toISOString(),
        status: "done",
        snoozeCount: 0,
        notificationId: null,
      },
    ];
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Tâche déjà faite");

    fireEvent.press(screen.getByText("Tâche déjà faite"));

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("tasks");
      const updated = JSON.parse(stored || "[]");
      expect(updated[0].status).toBe("done");
    });
  });
});
