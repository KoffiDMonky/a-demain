/**
 * Mock TaskItem : déclenche onSnooze / onDelete / onEdit même si la vraie carte
 * masquerait l’action — couverture des garde-fous !allTasksDone && status !== done.
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HomeScreen from "../../screens/HomeScreen";

const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();

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
  const { View: V } = require("react-native");
  return function MockLottie() {
    return <V />;
  };
});

jest.mock("../../components/TaskItem", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");
  return function MockTaskItem({ task, onSnooze, onDelete, onEdit }) {
    return (
      <View>
        <Text>{task.text}</Text>
        <Pressable
          testID={`mock-snooze-${task.id}`}
          onPress={() => onSnooze(task)}
        />
        <Pressable
          testID={`mock-delete-${task.id}`}
          onPress={() => onDelete(task)}
        />
        <Pressable
          testID={`mock-edit-${task.id}`}
          onPress={() => onEdit(task)}
        />
      </View>
    );
  };
});

describe("HomeScreen — branches renderItem (TaskItem mock)", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it("snooze : ne fait rien si toute la journée est cochée (allTasksDone)", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "done-only",
          text: "Tout fini",
          dueDate: today.toISOString(),
          status: "done",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );

    render(
      <HomeScreen
        navigation={{ navigate: mockNavigate, setOptions: mockSetOptions }}
      />
    );
    await screen.findByText("Tout fini");
    fireEvent.press(screen.getByTestId("mock-snooze-done-only"));

    await waitFor(async () => {
      const list = JSON.parse((await AsyncStorage.getItem("tasks")) || "[]");
      expect(list[0].status).toBe("done");
    });
  });

  it("snooze sur tâche done alors qu’il reste du pending : ne change pas le storage", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "d1",
          text: "Déjà fait",
          dueDate: today.toISOString(),
          status: "done",
          snoozeCount: 0,
          notificationId: null,
        },
        {
          id: "p1",
          text: "Encore",
          dueDate: today.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );

    render(
      <HomeScreen
        navigation={{ navigate: mockNavigate, setOptions: mockSetOptions }}
      />
    );
    await screen.findByText("Déjà fait");
    fireEvent.press(screen.getByTestId("mock-snooze-d1"));

    await waitFor(async () => {
      const list = JSON.parse((await AsyncStorage.getItem("tasks")) || "[]");
      expect(list).toHaveLength(2);
      expect(list.find((t) => t.id === "d1").status).toBe("done");
    });
  });

  it("delete sur tâche done alors qu’il reste du pending : ne supprime pas", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "d2",
          text: "Fait",
          dueDate: today.toISOString(),
          status: "done",
          snoozeCount: 0,
          notificationId: null,
        },
        {
          id: "p2",
          text: "Reste",
          dueDate: today.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );

    render(
      <HomeScreen
        navigation={{ navigate: mockNavigate, setOptions: mockSetOptions }}
      />
    );
    await screen.findByText("Fait");
    fireEvent.press(screen.getByTestId("mock-delete-d2"));

    await waitFor(async () => {
      const list = JSON.parse((await AsyncStorage.getItem("tasks")) || "[]");
      expect(list).toHaveLength(2);
    });
  });

  it("edit sur tâche done alors qu’il reste du pending : ne navigue pas", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "d3",
          text: "Ok",
          dueDate: today.toISOString(),
          status: "done",
          snoozeCount: 0,
          notificationId: null,
        },
        {
          id: "p3",
          text: "Pas ok",
          dueDate: today.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );

    render(
      <HomeScreen
        navigation={{ navigate: mockNavigate, setOptions: mockSetOptions }}
      />
    );
    await screen.findByText("Ok");
    fireEvent.press(screen.getByTestId("mock-edit-d3"));
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
