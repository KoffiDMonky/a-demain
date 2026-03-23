/**
 * Tests de non-régression - StatsScreen (rendu + interactions)
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import StatsScreen from "../../screens/StatsScreen";

const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => true,
}));

describe("StatsScreen", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it("affiche le titre Statistiques", async () => {
    render(<StatsScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Statistiques");
    expect(screen.getByText("Statistiques")).toBeOnTheScreen();
  });

  it("affiche la section Succès avec des badges", async () => {
    render(<StatsScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Succès");
    expect(screen.getByText("Succès")).toBeOnTheScreen();
    await screen.findByText("Premier pas");
    expect(screen.getByText("Premier pas")).toBeOnTheScreen();
  });

  it("affiche la carte d'avancement du jour quand il y a des tâches prévues aujourd’hui", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "1",
          text: "Aujourd’hui",
          dueDate: today.toISOString(),
          status: "pending",
          snoozeCount: 0,
        },
      ])
    );

    render(<StatsScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Avancement du jour");
    expect(screen.getByText("0 / 1")).toBeOnTheScreen();
  });

  it("n’affiche pas la carte d'avancement du jour sans tâche prévue aujourd’hui", async () => {
    render(<StatsScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Statistiques");
    expect(screen.queryByText("Avancement du jour")).toBeNull();
  });

  it("affiche les libellés des stats (Tâches créées, Série en cours)", async () => {
    render(<StatsScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Statistiques");
    expect(screen.getByText("Tâches créées")).toBeOnTheScreen();
    expect(screen.getByText("Série en cours")).toBeOnTheScreen();
  });

  it("navigue vers Nouvelle Tâche au press du bouton ajouter", async () => {
    render(<StatsScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Statistiques");
    const addButton = screen.getByTestId("icon-add");
    fireEvent.press(addButton);
    expect(mockNavigate).toHaveBeenCalledWith("Nouvelle Tâche");
  });

  it("affiche les stats calculées quand AsyncStorage contient des tâches", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tasks = [
      {
        id: "1",
        text: "Tâche faite",
        dueDate: today.toISOString(),
        status: "done",
        snoozeCount: 0,
      },
      {
        id: "2",
        text: "Tâche en attente",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
      },
    ];
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    render(<StatsScreen navigation={{ navigate: mockNavigate }} />);

    await screen.findByText("Tâches créées");
    expect(screen.getByText("2")).toBeOnTheScreen();
    expect(screen.getByText("1")).toBeOnTheScreen();
  });

  it("affiche le compteur de série dans l’en-tête quand streakData > 0", async () => {
    await AsyncStorage.setItem(
      "streakData",
      JSON.stringify({ streak: 5, lastComputed: null })
    );

    render(<StatsScreen navigation={{ navigate: mockNavigate }} />);

    await screen.findByText("5");
    expect(screen.getByText("5")).toBeOnTheScreen();
  });

  it("affiche un message motivationnel (premier tirage si Math.random = 0)", async () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);

    render(<StatsScreen navigation={{ navigate: mockNavigate }} />);

    await screen.findByText(/Tu avances,.+essentiel/);
    expect(screen.getByText(/Tu avances,.+essentiel/)).toBeOnTheScreen();

    randomSpy.mockRestore();
  });
});
