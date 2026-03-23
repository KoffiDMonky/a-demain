/**
 * Tests de non-régression - StatsScreen (rendu + interactions)
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { Platform, StyleSheet, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import StatsScreen from "../../screens/StatsScreen";

const mockNavigate = jest.fn();
const mockIsFocused = jest.fn(() => true);
jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => mockIsFocused(),
}));

describe("StatsScreen", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockIsFocused.mockReturnValue(true);
    await AsyncStorage.clear();
  });

  it("n’affiche plus le titre « Statistiques » (retiré de l’UI)", async () => {
    render(<StatsScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Tâches créées");
    expect(screen.queryByText("Statistiques")).toBeNull();
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
    await screen.findByText("Tâches créées");
    expect(screen.queryByText("Avancement du jour")).toBeNull();
  });

  it("affiche les libellés des stats (Tâches créées, Série en cours)", async () => {
    render(<StatsScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Tâches créées");
    expect(screen.getByText("Tâches créées")).toBeOnTheScreen();
    expect(screen.getByText("Série en cours")).toBeOnTheScreen();
  });

  it("navigue vers Nouvelle Tâche au press du bouton ajouter", async () => {
    render(<StatsScreen navigation={{ navigate: mockNavigate }} />);
    await screen.findByText("Tâches créées");
    const addButton = screen.getByTestId("stats-screen-add");
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

  it("sans focus : ne charge pas les stats (pas de lecture AsyncStorage « tasks »)", async () => {
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "only",
          text: "Ignorée si pas focus",
          dueDate: new Date().toISOString(),
          status: "pending",
          snoozeCount: 0,
        },
      ])
    );
    const spy = jest.spyOn(AsyncStorage, "getItem");
    mockIsFocused.mockReturnValue(false);

    render(<StatsScreen navigation={{ navigate: mockNavigate }} />);

    await waitFor(() => {
      expect(screen.getByText("Tâches créées")).toBeOnTheScreen();
    });

    const tasksReads = spy.mock.calls.filter((c) => c[0] === "tasks");
    expect(tasksReads.length).toBe(0);
    spy.mockRestore();
  });

  it("SafeAreaView : paddingTop = StatusBar sous Android", async () => {
    const prevOS = Platform.OS;
    const prevH = StatusBar.currentHeight;
    Platform.OS = "android";
    StatusBar.currentHeight = 44;

    const { UNSAFE_root } = render(
      <StatsScreen navigation={{ navigate: mockNavigate }} />
    );
    await screen.findByText("Tâches créées");

    const nodes = UNSAFE_root.findAllByType(SafeAreaView);
    expect(nodes.length).toBeGreaterThan(0);
    const flat = StyleSheet.flatten(nodes[0].props.style);
    expect(flat.paddingTop).toBe(44);

    Platform.OS = prevOS;
    StatusBar.currentHeight = prevH;
  });
});
