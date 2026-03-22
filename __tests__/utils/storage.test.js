/**
 * Tests de non-régression - utils/storage.js
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  isSameDay,
  groupTasksByDay,
  computeStats,
  getStoredTasks,
  abandonOutdatedTasks,
  updateAndStoreStreaks,
} from "../../utils/storage";

// AsyncStorage est mocké via __mocks__/@react-native-async-storage/async-storage.js

describe("storage", () => {
  describe("isSameDay", () => {
    it("retourne true pour deux dates le même jour", () => {
      const d1 = new Date("2025-03-15T10:00:00Z");
      const d2 = new Date("2025-03-15T22:30:00Z");
      expect(isSameDay(d1, d2)).toBe(true);
    });

    it("retourne false pour deux jours différents", () => {
      const d1 = new Date("2025-03-15T12:00:00.000Z");
      const d2 = new Date("2025-03-16T12:00:00.000Z");
      expect(isSameDay(d1, d2)).toBe(false);
    });

    it("retourne false pour des mois différents", () => {
      const d1 = new Date("2025-02-28T12:00:00Z");
      const d2 = new Date("2025-03-28T12:00:00Z");
      expect(isSameDay(d1, d2)).toBe(false);
    });
  });

  describe("groupTasksByDay", () => {
    it("groupe les tâches par jour (clé ISO date)", () => {
      const tasks = [
        { id: "1", dueDate: "2025-03-15T09:00:00.000Z" },
        { id: "2", dueDate: "2025-03-15T14:00:00.000Z" },
        { id: "3", dueDate: "2025-03-16T09:00:00.000Z" },
      ];
      const group = groupTasksByDay(tasks);
      expect(group["2025-03-15"]).toHaveLength(2);
      expect(group["2025-03-16"]).toHaveLength(1);
    });

    it("ignore les tâches sans dueDate", () => {
      const tasks = [
        { id: "1", dueDate: "2025-03-15T09:00:00.000Z" },
        { id: "2" },
      ];
      const group = groupTasksByDay(tasks);
      expect(group["2025-03-15"]).toHaveLength(1);
    });

    it("retourne un objet vide pour tableau vide", () => {
      expect(groupTasksByDay([])).toEqual({});
    });
  });

  describe("computeStats", () => {
    const TODAY = "2025-03-15";

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(`${TODAY}T12:00:00.000Z`));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("calcule totalTasks et completedTasks", () => {
      const tasks = [
        { id: "1", dueDate: `${TODAY}T09:00:00.000Z`, status: "done" },
        { id: "2", dueDate: `${TODAY}T09:00:00.000Z`, status: "pending" },
      ];
      const stats = computeStats(tasks);
      expect(stats.totalTasks).toBe(2);
      expect(stats.completedTasks).toBe(1);
    });

    it("calcule totalSnoozes et snoozePercentage", () => {
      const tasks = [
        { id: "1", dueDate: `${TODAY}T09:00:00.000Z`, snoozeCount: 2 },
        { id: "2", dueDate: `${TODAY}T09:00:00.000Z`, snoozeCount: 1 },
      ];
      const stats = computeStats(tasks);
      expect(stats.totalSnoozes).toBe(3);
      expect(Number(stats.snoozePercentage)).toBe(150); // (3/2)*100 = 150
    });

    it("snoozePercentage à 0 quand aucune tâche", () => {
      const stats = computeStats([]);
      expect(stats.totalTasks).toBe(0);
      expect(stats.snoozePercentage).toBe(0);
    });

    it("inclut currentStreak et bestStreak pour jour du jour si toutes done", () => {
      const tasks = [
        { id: "1", dueDate: `${TODAY}T09:00:00.000Z`, status: "done" },
      ];
      const stats = computeStats(tasks);
      expect(stats.currentStreak).toBeGreaterThanOrEqual(0);
      expect(stats.bestStreak).toBeGreaterThanOrEqual(0);
    });

    it("accumule une série sur des jours passés consécutifs tous complétés", () => {
      const tasks = [
        { id: "a", dueDate: "2025-03-13T12:00:00.000Z", status: "done" },
        { id: "b", dueDate: "2025-03-14T12:00:00.000Z", status: "done" },
      ];
      const stats = computeStats(tasks);
      expect(stats.currentStreak).toBe(2);
      expect(stats.bestStreak).toBe(2);
    });

    it("réinitialise la série si un jour passé est invalide", () => {
      const tasks = [
        { id: "a", dueDate: "2025-03-13T12:00:00.000Z", status: "done" },
        { id: "b", dueDate: "2025-03-14T12:00:00.000Z", status: "pending" },
        { id: "c", dueDate: "2025-03-15T12:00:00.000Z", status: "done" },
      ];
      const stats = computeStats(tasks);
      expect(stats.currentStreak).toBe(1);
    });

    it("accepte un jour passé avec tâches abandonnées comme valide", () => {
      const tasks = [
        { id: "a", dueDate: "2025-03-14T12:00:00.000Z", status: "abandoned" },
      ];
      const stats = computeStats(tasks);
      expect(stats.bestStreak).toBeGreaterThanOrEqual(1);
    });

    it("prolonge la série (currentStreak++) quand hier était valide et aujourd’hui entièrement complété", () => {
      const tasks = [
        { id: "hier", dueDate: "2025-03-14T12:00:00.000Z", status: "done" },
        { id: "auj", dueDate: `${TODAY}T09:00:00.000Z`, status: "done" },
      ];
      const stats = computeStats(tasks);
      // Hier compte pour 1, bloc « aujourd’hui » incrémente car lastValidDate = veille (l.84)
      expect(stats.currentStreak).toBe(2);
      expect(stats.bestStreak).toBe(2);
    });

    it("accepte un jour passé snoozed au plus une fois comme valide (branche snoozed)", () => {
      const tasks = [
        {
          id: "s",
          dueDate: "2025-03-14T12:00:00.000Z",
          status: "snoozed",
          snoozeCount: 1,
        },
      ];
      const stats = computeStats(tasks);
      expect(stats.currentStreak).toBe(1);
    });

    it("traite snoozeCount absent comme 0 pour un jour passé snoozed (branche || 0)", () => {
      const tasks = [
        {
          id: "s",
          dueDate: "2025-03-14T12:00:00.000Z",
          status: "snoozed",
        },
      ];
      const stats = computeStats(tasks);
      expect(stats.currentStreak).toBe(1);
    });

    it("invalide un jour passé si une tâche est snoozed plus d’une fois (snoozeCount > 1)", () => {
      const tasks = [
        {
          id: "s",
          dueDate: "2025-03-14T12:00:00.000Z",
          status: "snoozed",
          snoozeCount: 2,
        },
        { id: "ok", dueDate: `${TODAY}T09:00:00.000Z`, status: "done" },
      ];
      const stats = computeStats(tasks);
      expect(stats.currentStreak).toBe(1);
    });

    it("compte aujourd’hui snoozed (≤1) comme jour valide pour prolonger la série", () => {
      const tasks = [
        { id: "y", dueDate: "2025-03-14T12:00:00.000Z", status: "done" },
        {
          id: "t",
          dueDate: `${TODAY}T09:00:00.000Z`,
          status: "snoozed",
          snoozeCount: 0,
        },
      ];
      const stats = computeStats(tasks);
      expect(stats.currentStreak).toBe(2);
    });

    it("n’étend pas la série à aujourd’hui si snoozed > 1 sur une tâche du jour", () => {
      const tasks = [
        { id: "y", dueDate: "2025-03-14T12:00:00.000Z", status: "done" },
        {
          id: "t",
          dueDate: `${TODAY}T09:00:00.000Z`,
          status: "snoozed",
          snoozeCount: 2,
        },
      ];
      const stats = computeStats(tasks);
      expect(stats.currentStreak).toBe(1);
    });
  });

  describe("updateAndStoreStreaks", () => {
    const TODAY = "2025-03-15";

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(`${TODAY}T12:00:00.000Z`));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("écrit streaks dans AsyncStorage et appelle setStreakState", async () => {
      const setStreakState = jest.fn();
      const tasks = [
        { id: "1", dueDate: `${TODAY}T09:00:00.000Z`, status: "done" },
      ];
      await updateAndStoreStreaks(tasks, setStreakState);

      const raw = await AsyncStorage.getItem("streaks");
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw);
      expect(parsed).toHaveProperty("currentStreak");
      expect(parsed).toHaveProperty("bestStreak");
      expect(setStreakState).toHaveBeenCalled();
    });

    it("écrit les streaks sans appeler setStreakState si le callback est omis", async () => {
      const tasks = [
        { id: "1", dueDate: `${TODAY}T09:00:00.000Z`, status: "done" },
      ];
      await expect(updateAndStoreStreaks(tasks)).resolves.toBeUndefined();
      const raw = await AsyncStorage.getItem("streaks");
      expect(raw).toBeTruthy();
    });
  });

  describe("getStoredTasks", () => {
    it("retourne un tableau vide quand aucun stockage", async () => {
      const tasks = await getStoredTasks();
      expect(Array.isArray(tasks)).toBe(true);
      expect(tasks.length).toBe(0);
    });
  });

  describe("abandonOutdatedTasks", () => {
    it("ne lance pas d’erreur (AsyncStorage mocké)", async () => {
      await expect(abandonOutdatedTasks()).resolves.toBeUndefined();
    });

    it("passe les tâches pending d’hier en abandoned", async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2025-03-15T12:00:00.000Z"));
      await AsyncStorage.setItem(
        "tasks",
        JSON.stringify([
          {
            id: "old",
            text: "En retard",
            dueDate: "2025-03-14T10:00:00.000Z",
            status: "pending",
            snoozeCount: 0,
          },
          {
            id: "today",
            text: "Aujourd’hui",
            dueDate: "2025-03-15T10:00:00.000Z",
            status: "pending",
            snoozeCount: 0,
          },
        ])
      );

      await abandonOutdatedTasks();

      const tasks = JSON.parse((await AsyncStorage.getItem("tasks")) || "[]");
      expect(tasks.find((t) => t.id === "old").status).toBe("abandoned");
      expect(tasks.find((t) => t.id === "today").status).toBe("pending");
      jest.useRealTimers();
    });
  });
});
