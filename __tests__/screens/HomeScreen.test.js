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
import * as applyHomeTaskStatus from "../../utils/applyHomeTaskStatus";
import {
  cancelTaskNotification,
  scheduleTaskNotification,
} from "../../utils/notificationHelper";

/** Callbacks onAnimationFinish enregistrés par le mock Lottie (hoisting-safe) */
var __homeScreenLottieFinishes = [];

const mockNavigate = jest.fn();
const mockSetOptions = jest.fn();
/** Permet de couvrir la branche `if (isFocused)` dans l’effet focus */
const mockIsFocused = jest.fn(() => true);
function getDefaultNavigation() {
  return { navigate: mockNavigate, setOptions: mockSetOptions };
}
jest.mock("@react-navigation/native", () => ({
  useIsFocused: () => mockIsFocused(),
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

/** Date de demain à midi (cohérent avec les filtres jour dans HomeScreen) */
function tomorrowNoon() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(12, 0, 0, 0);
  return d;
}

describe("HomeScreen", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    mockIsFocused.mockReturnValue(true);
    __homeScreenLottieFinishes.length = 0;
    await AsyncStorage.clear();
  });

  it("affiche la section Aujourd'hui et l'avancement", async () => {
    render(
      <HomeScreen navigation={getDefaultNavigation()} />
    );
    await screen.findByText(/Aujourd.hui/);
    expect(screen.getByText("Avancement du jour")).toBeOnTheScreen();
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
    const addButton = screen.getByTestId("icon-add-tomorrow");
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
      await screen.findByText(/Aujourd.hui/);

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
      await screen.findByText(/Aujourd.hui/);
    } finally {
      Platform.OS = previousOS;
    }
  });

  it("supprime une tâche demain : AsyncStorage vide au press (allTasks vide)", async () => {
    const tmw = tomorrowNoon();
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "tmw-empty-store",
          text: "Demain puis storage vidé",
          dueDate: tmw.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );
    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Demain puis storage vidé");
    await AsyncStorage.removeItem("tasks");
    fireEvent.press(screen.getByTestId("tomorrow-task-trash"));
    await waitFor(async () => {
      expect(await AsyncStorage.getItem("tasks")).toBe(JSON.stringify([]));
    });
  });

  it("supprime une tâche « demain » (deleteTomorrowTask) et met à jour le storage", async () => {
    const tmw = tomorrowNoon();
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "tmw-del",
          text: "À supprimer demain",
          dueDate: tmw.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("À supprimer demain");

    fireEvent.press(screen.getByTestId("tomorrow-task-trash"));

    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("tasks");
      expect(JSON.parse(stored || "[]")).toHaveLength(0);
    });
    expect(cancelTaskNotification).not.toHaveBeenCalled();
  });

  it("supprime une tâche demain avec notification : annule le rappel (deleteTomorrowTask)", async () => {
    const tmw = tomorrowNoon();
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "tmw-notif",
          text: "Demain avec rappel",
          dueDate: tmw.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: "notif-tmw-del",
        },
      ])
    );

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Demain avec rappel");

    fireEvent.press(screen.getByTestId("tomorrow-task-trash"));

    await waitFor(() => {
      expect(cancelTaskNotification).toHaveBeenCalledWith("notif-tmw-del");
    });
    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("tasks");
      expect(JSON.parse(stored || "[]")).toHaveLength(0);
    });
  });

  it("navigue vers Nouvelle Tâche au longPress sur une tâche demain (onEdit)", async () => {
    const tmw = tomorrowNoon();
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "tmw-edit",
          text: "Éditer demain",
          dueDate: tmw.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Éditer demain");

    fireEvent(screen.getByText("Éditer demain"), "longPress");

    expect(mockNavigate).toHaveBeenCalledWith("Nouvelle Tâche", {
      task: expect.objectContaining({
        id: "tmw-edit",
        text: "Éditer demain",
      }),
    });
  });

  it("toggle la section Aujourd'hui via l'en-tête quand il y a des tâches", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "toggle-today",
          text: "Tâche pour toggle section",
          dueDate: today.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Tâche pour toggle section");

    const header = screen.getByTestId("home-section-today-header");
    fireEvent.press(header);
    fireEvent.press(header);

    expect(screen.getByText("Tâche pour toggle section")).toBeOnTheScreen();
  });

  it("replie la section Aujourd'hui puis déplie au tap sur la pile (CollapsedDeckPreview)", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "deck-today",
          text: "Visible après dépli depuis la pile",
          dueDate: today.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Visible après dépli depuis la pile");

    fireEvent.press(screen.getByTestId("home-section-today-header"));

    const sameLabel = screen.getAllByLabelText(/Déplier la section Aujourd/);
    expect(sameLabel.length).toBeGreaterThanOrEqual(2);
    fireEvent.press(sameLabel[1]);

    expect(
      screen.getByText("Visible après dépli depuis la pile")
    ).toBeOnTheScreen();
  });

  it("pile repliée Aujourd'hui : masque les tâches done si des pending existent", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "done-hidden",
          text: "Tâche faite (masquée dans la pile)",
          dueDate: today.toISOString(),
          status: "done",
          snoozeCount: 0,
          notificationId: null,
        },
        {
          id: "pending-visible",
          text: "Tâche en cours (visible dans la pile)",
          dueDate: today.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Tâche en cours (visible dans la pile)");

    fireEvent.press(screen.getByTestId("home-section-today-header"));

    expect(
      screen.queryByText("Tâche faite (masquée dans la pile)")
    ).toBeNull();
    expect(
      screen.getByText("Tâche en cours (visible dans la pile)")
    ).toBeOnTheScreen();
  });

  it("pile repliée Aujourd'hui : si tout est done, affiche la 1re tâche validée", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "done-first",
          text: "Première tâche validée",
          dueDate: today.toISOString(),
          status: "done",
          snoozeCount: 0,
          notificationId: null,
        },
        {
          id: "done-second",
          text: "Seconde tâche validée",
          dueDate: today.toISOString(),
          status: "done",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Première tâche validée");

    fireEvent.press(screen.getByTestId("home-section-today-header"));

    expect(screen.getByText("Première tâche validée")).toBeOnTheScreen();
    expect(screen.queryByText("Seconde tâche validée")).toBeNull();
  });

  it("injecte le tutoriel quand tasks en stockage n’est pas un tableau (objet JSON)", async () => {
    await AsyncStorage.setItem("tasks", JSON.stringify({ invalid: true }));
    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Ajouter une tâche pour demain 📅");
    expect(
      screen.getByText(
        "Glisse une tâche vers la droite pour la reporter à demain ➡️"
      )
    ).toBeOnTheScreen();
  });

  it("toggle done : AsyncStorage vide au moment du press (branche allTasks = [])", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "solo",
          text: "Sans storage après chargement UI",
          dueDate: today.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );
    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Sans storage après chargement UI");
    await AsyncStorage.removeItem("tasks");
    fireEvent.press(screen.getByText("Sans storage après chargement UI"));
    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("tasks");
      expect(JSON.parse(stored || "[]")).toEqual([]);
    });
  });

  it("snooze : AsyncStorage vide au press (updateTaskStatus, allTasks = [])", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "snooze-empty-store",
          text: "Snooze storage vide",
          dueDate: today.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );
    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Snooze storage vide");
    await AsyncStorage.removeItem("tasks");
    fireEvent.press(screen.getByTestId("icon-time-outline"));
    await waitFor(async () => {
      expect(await AsyncStorage.getItem("tasks")).toBeNull();
    });
  });

  it("snooze : ne persiste rien si buildTasksAfterStatusChange retourne null", async () => {
    const spy = jest
      .spyOn(applyHomeTaskStatus, "buildTasksAfterStatusChange")
      .mockResolvedValueOnce(null);
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "no-next",
          text: "Snooze bloqué",
          dueDate: today.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );
    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Snooze bloqué");
    fireEvent.press(screen.getByTestId("icon-time-outline"));
    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("tasks");
      const list = JSON.parse(stored || "[]");
      expect(list).toHaveLength(1);
      expect(list[0].status).toBe("pending");
    });
    spy.mockRestore();
  });

  it("suppression : AsyncStorage vide au press (deleteTask avec allTasks vide)", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "del-solo",
          text: "Suppr sans storage",
          dueDate: today.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );
    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Suppr sans storage");
    await AsyncStorage.removeItem("tasks");
    fireEvent.press(screen.getByTestId("icon-trash-outline"));
    await waitFor(async () => {
      expect(await AsyncStorage.getItem("tasks")).toBe(JSON.stringify([]));
    });
  });

  it("quand l’écran n’est pas focus, l’effet focus ne relance pas loadTasks (liste [] persistée)", async () => {
    await AsyncStorage.setItem("tasks", JSON.stringify([]));
    mockIsFocused.mockReturnValue(false);
    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Aucune tâche pour aujourd'hui 💤");
    expect(mockIsFocused).toHaveBeenCalled();
  });

  it("snooze vers demain : la tâche apparaît dans la section demain (prev 0 → 1)", async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "move-tmw",
          text: "Va à demain",
          dueDate: today.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );
    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Va à demain");
    fireEvent.press(screen.getByTestId("icon-time-outline"));
    await waitFor(async () => {
      const stored = await AsyncStorage.getItem("tasks");
      const list = JSON.parse(stored || "[]");
      expect(list[0].status).toBe("snoozed");
    });
    await screen.findByText("Va à demain");
    expect(screen.queryByText("Rien de prévu pour demain 😌")).toBeNull();
  });

  it("replie la section À demain puis déplie au tap sur la pile (CollapsedDeckPreview)", async () => {
    const tmw = tomorrowNoon();
    await AsyncStorage.setItem(
      "tasks",
      JSON.stringify([
        {
          id: "deck-tmw",
          text: "Tâche demain pile",
          dueDate: tmw.toISOString(),
          status: "pending",
          snoozeCount: 0,
          notificationId: null,
        },
      ])
    );

    render(<HomeScreen navigation={getDefaultNavigation()} />);
    await screen.findByText("Tâche demain pile");

    fireEvent.press(screen.getByTestId("home-section-tomorrow-header"));

    const demainBtns = screen.getAllByLabelText(/Déplier la section À demain/);
    expect(demainBtns.length).toBeGreaterThanOrEqual(2);
    fireEvent.press(demainBtns[1]);

    expect(screen.getByText("Tâche demain pile")).toBeOnTheScreen();
  });
});
