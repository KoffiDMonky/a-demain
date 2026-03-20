/**
 * Tests - succès / achievements
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ACHIEVEMENT_DEFINITIONS,
  buildAchievementContext,
  taskIsDueTomorrow,
  syncAchievementsWithContext,
  getUnlockedAchievementIds,
  UNLOCKED_KEY,
} from "../../utils/achievements";

describe("achievements", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe("taskIsDueTomorrow", () => {
    it("retourne true si la date est demain", () => {
      const now = new Date("2025-06-10T12:00:00Z");
      const tomorrow = new Date("2025-06-11T15:00:00Z");
      expect(taskIsDueTomorrow(tomorrow.toISOString(), now)).toBe(true);
    });

    it("retourne false pour aujourd’hui", () => {
      const now = new Date("2025-06-10T12:00:00Z");
      const today = new Date("2025-06-10T08:00:00Z");
      expect(taskIsDueTomorrow(today.toISOString(), now)).toBe(false);
    });
  });

  describe("buildAchievementContext", () => {
    it("calcule effectiveStreak comme le max des deux séries", () => {
      const ctx = buildAchievementContext({
        tasks: [],
        computedStats: { currentStreak: 2, bestStreak: 5, totalSnoozes: 0 },
        streakUi: 5,
        meta: {},
        todayTotal: 0,
        todayDone: 0,
      });
      expect(ctx.effectiveStreak).toBe(5);
    });
  });

  describe("syncAchievementsWithContext", () => {
    it("débloque explorer quand au moins une tâche", async () => {
      const list = await syncAchievementsWithContext({
        totalTasks: 1,
        completedTasks: 0,
        currentStreak: 0,
        bestStreak: 0,
        totalSnoozes: 0,
        lifetimeCompleted: 0,
        lifetimeSnoozes: 0,
        everTomorrowTask: false,
        hasTomorrowTask: false,
        todayTotal: 0,
        todayDone: 0,
        effectiveStreak: 0,
      });
      const explorer = list.find((x) => x.id === "explorer");
      expect(explorer?.unlocked).toBe(true);
      const ids = await getUnlockedAchievementIds();
      expect(ids).toContain("explorer");
    });

    it("persiste les déblocages dans AsyncStorage", async () => {
      await syncAchievementsWithContext({
        totalTasks: 1,
        completedTasks: 1,
        currentStreak: 0,
        bestStreak: 0,
        totalSnoozes: 0,
        lifetimeCompleted: 1,
        lifetimeSnoozes: 0,
        everTomorrowTask: false,
        hasTomorrowTask: false,
        todayTotal: 0,
        todayDone: 0,
        effectiveStreak: 0,
      });
      const raw = await AsyncStorage.getItem(UNLOCKED_KEY);
      const ids = JSON.parse(raw || "[]");
      expect(ids).toContain("explorer");
      expect(ids).toContain("premiere_victoire");
    });
  });

  describe("ACHIEVEMENT_DEFINITIONS", () => {
    it("a des ids uniques", () => {
      const ids = ACHIEVEMENT_DEFINITIONS.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
