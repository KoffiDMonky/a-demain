/**
 * Tests de non-régression - HomeScreen (rendu + interactions)
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react-native";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import HomeScreen from "../../screens/HomeScreen";
import {
  cancelTaskNotification,
  scheduleTaskNotification,
} from "../../utils/notificationHelper";

/** Callbacks onAnimationFinish enregistrés par le mock Lottie (hoisting-safe) */
var __homeScreenLottieFinishes = [];

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
  const React = require("react");
  const { View } = require("react-native");
  return function MockLottie(props) {
    React.useEffect(() => {
      if (props.onAnimationFinish) {
        __homeScreenLottieFinishes.push(props.onAnimationFinish);
      }
    }, [props.onAnimationFinish]);
    return <View testID="lottie-mock" />;
  };
});

function flushLottieAnimationFinishes() {
  const fns = __homeScreenLottieFinishes.splice(0);
  fns.forEach((fn) => fn());
}

describe("HomeScreen", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    __homeScreenLottieFinishes.length = 0;
    await AsyncStorage.clear();
  });

  it("affiche le titre Tes tâches du jour", async () => {
    render(
      <HomeScreen navigation={getDefaultNavigation()} />
    );
    await screen.findByText("Tes tâches du jour");
    expect(screen.getByText("Tes tâches du jour")).toBeOnTheScreen();
  });

  it("injecte les tâches tutoriel quand le stockage est vide", async () => {
    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Ajouter une tâche pour demain 📅");
    expect(
      screen.getByText("Glisse une tâche vers la droite pour la reporter à demain ➡️")
    ).toBeOnTheScreen();
  });

  it("affiche le message vide quand aucune tâche aujourd'hui (liste [] persistée)", async () => {
    await AsyncStorage.setItem("tasks", JSON.stringify([]));
    render(
      <HomeScreen navigation={getDefaultNavigation()} />
    );
    await screen.findByText("Aucune tâche pour aujourd'hui 💤");
    expect(
      screen.getByText("Aucune tâche pour aujourd'hui 💤")
    ).toBeOnTheScreen();
  });

  it("navigue vers Nouvelle Tâche au press du bouton ajouter", async () => {
    await AsyncStorage.setItem("tasks", JSON.stringify([]));
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

  it("toggle done ne modifie que la tâche concernée (autres lignes inchangées)", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tasks = [
      {
        id: "a",
        text: "Tâche A",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
      {
        id: "b",
        text: "Tâche B",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
    ];
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Tâche A");

    fireEvent.press(screen.getByText("Tâche A"));

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("tasks");
      const updated = JSON.parse(stored || "[]");
      expect(updated).toHaveLength(2);
      expect(updated.find((t) => t.id === "a").status).toBe("done");
      expect(updated.find((t) => t.id === "b").status).toBe("pending");
    });
  });

  it("snooze avec rappel : annule l’ancienne notif et en planifie une nouvelle", async () => {
    scheduleTaskNotification.mockResolvedValueOnce("new-scheduled-id");
    const today = new Date();
    today.setHours(8, 0, 0, 0);
    const tasks = [
      {
        id: "task-notif",
        text: "Avec notification",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: "notif-abc",
      },
    ];
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Avec notification");

    fireEvent.press(screen.getByTestId("icon-time-outline"));

    await waitFor(() => {
      expect(cancelTaskNotification).toHaveBeenCalledWith("notif-abc");
      expect(scheduleTaskNotification).toHaveBeenCalled();
    });

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("tasks");
      const updated = JSON.parse(stored || "[]");
      expect(updated[0].notificationId).toBe("new-scheduled-id");
    });
  });

  it("suppression : annule la notification si la tâche en avait une", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tasks = [
      {
        id: "task-del-notif",
        text: "À supprimer avec notif",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: "notif-del-1",
      },
    ];
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("À supprimer avec notif");

    fireEvent.press(screen.getByTestId("icon-trash-outline"));

    await waitFor(() => {
      expect(cancelTaskNotification).toHaveBeenCalledWith("notif-del-1");
    });
  });

  it("affiche la flamme dans le header quand streak > 0 (setOptions)", async () => {
    const streakMod = require("../../utils/streak");
    const spy = jest.spyOn(streakMod, "syncStreak").mockResolvedValue(4);

    try {
      render(<HomeScreen navigation={getDefaultNavigation()} />);
      await screen.findByText("Tes tâches du jour");

      await waitFor(() => {
        expect(mockSetOptions).toHaveBeenCalled();
        const last =
          mockSetOptions.mock.calls[mockSetOptions.mock.calls.length - 1][0];
        const HeaderRight = last.headerRight;
        expect(HeaderRight).toBeDefined();
        const { getByText, unmount } = render(
          <>{typeof HeaderRight === "function" ? HeaderRight() : null}</>
        );
        expect(getByText("4")).toBeOnTheScreen();
        unmount();
      });
    } finally {
      spy.mockRestore();
    }
  });

  it("affiche les Lottie de célébration puis onAnimationFinish les retire", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tasks = [
      {
        id: "c1",
        text: "Une",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
      {
        id: "c2",
        text: "Deux",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
    ];
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Une");

    fireEvent.press(screen.getByText("Une"));
    await waitFor(async () => {
      const s = await AsyncStorage.getItem("tasks");
      expect(JSON.parse(s || "[]").find((t) => t.id === "c1").status).toBe(
        "done"
      );
    });

    fireEvent.press(screen.getByText("Deux"));
    await waitFor(() => {
      expect(screen.getAllByTestId("lottie-mock").length).toBeGreaterThanOrEqual(
        1
      );
    });

    await act(async () => {
      flushLottieAnimationFinishes();
    });

    await waitFor(() => {
      expect(screen.queryAllByTestId("lottie-mock")).toHaveLength(0);
    });
  });

  it("peut repasser une tâche de done à pending si toutes ne sont pas terminées", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const tasks = [
      {
        id: "done-1",
        text: "Déjà cochée",
        dueDate: today.toISOString(),
        status: "done",
        snoozeCount: 0,
        notificationId: null,
      },
      {
        id: "pend-1",
        text: "Encore à faire",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
    ];
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Déjà cochée");

    fireEvent.press(screen.getByText("Déjà cochée"));

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("tasks");
      const updated = JSON.parse(stored || "[]");
      expect(updated.find((t) => t.id === "done-1").status).toBe("pending");
      expect(updated.find((t) => t.id === "pend-1").status).toBe("pending");
    });
  });

  it("rend sous Android avec padding lié à StatusBar (safeArea)", async () => {
    const previousOS = Platform.OS;
    Platform.OS = "android";
    try {
      await AsyncStorage.setItem("tasks", JSON.stringify([]));
      render(<HomeScreen navigation={getDefaultNavigation()} />);
      await screen.findByText("Tes tâches du jour");
    } finally {
      Platform.OS = previousOS;
    }
  });
});
