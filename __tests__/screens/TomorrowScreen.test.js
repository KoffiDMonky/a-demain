/**
 * Tests de non-régression - TomorrowScreen (rendu + interactions)
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import TomorrowScreen from "../../screens/TomorrowScreen";
import { cancelTaskNotification } from "../../utils/notificationHelper";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => true,
}));

jest.mock("../../utils/notificationHelper", () => ({
  cancelTaskNotification: jest.fn(() => Promise.resolve()),
}));

describe("TomorrowScreen", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it("affiche le titre Tâches prévues pour demain", async () => {
    render(<TomorrowScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Tâches prévues pour demain");
    expect(
      screen.getByText("Tâches prévues pour demain")
    ).toBeOnTheScreen();
  });

  it("affiche le message vide quand rien de prévu pour demain", async () => {
    render(<TomorrowScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Rien de prévu pour demain 😌");
    expect(
      screen.getByText("Rien de prévu pour demain 😌")
    ).toBeOnTheScreen();
  });

  it("navigue vers Nouvelle Tâche au press du FAB", async () => {
    render(<TomorrowScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Rien de prévu pour demain 😌");
    const addButton = screen.getByLabelText("add");
    fireEvent.press(addButton);
    expect(mockNavigate).toHaveBeenCalledWith("Nouvelle Tâche");
  });

  it("affiche les tâches prévues pour demain quand AsyncStorage en contient", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const tasks = [
      {
        id: "tomorrow-1",
        text: "Réunion demain matin",
        dueDate: tomorrow.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
    ];
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    render(<TomorrowScreen navigation={{ navigate: mockNavigate }} />);

    await screen.findByText("Réunion demain matin");
    expect(screen.getByText("Réunion demain matin")).toBeOnTheScreen();
  });

  it("supprime la tâche demain du storage au press sur supprimer", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "del-tmw",
          text: "À supprimer demain",
          dueDate: tomorrow.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );

    render(<TomorrowScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("À supprimer demain");

    fireEvent.press(screen.getByTestId("icon-trash-outline"));

    await waitFor(async () => {
      const stored = JSON.parse((await AsyncStorage.getItem("tasks")) || "[]");
      expect(stored).toHaveLength(0);
    });
  });

  it("appelle cancelTaskNotification avant suppression si la tâche a un notificationId", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(11, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "notif-tmw",
          text: "Avec notif",
          dueDate: tomorrow.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: "notif-xyz",
        },
      ])
    );

    render(<TomorrowScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Avec notif");

    fireEvent.press(screen.getByTestId("icon-trash-outline"));

    await waitFor(() => {
      expect(cancelTaskNotification).toHaveBeenCalledWith("notif-xyz");
    });
  });

  it("navigue vers Nouvelle Tâche avec la tâche au longPress (édition)", async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    const task = {
      id: "edit-tmw",
      text: "Éditer demain",
      dueDate: tomorrow.toISOString(),
      status: "pending",
      snoozeCount: 0,
    };
    await AsyncStorage.setItem("tasks", JSON.stringify([task]));

    render(<TomorrowScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Éditer demain");

    fireEvent(screen.getByText("Éditer demain"), "longPress");

    expect(mockNavigate).toHaveBeenCalledWith("Nouvelle Tâche", {
      task: expect.objectContaining({ id: "edit-tmw", text: "Éditer demain" }),
    });
  });
});
