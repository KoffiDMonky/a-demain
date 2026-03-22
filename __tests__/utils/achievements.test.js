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
  getAchievementMeta,
  UNLOCKED_KEY,
  META_KEY,
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

    it("retourne false si pas de date (null / undefined / chaîne vide)", () => {
      expect(taskIsDueTomorrow(null)).toBe(false);
      expect(taskIsDueTomorrow(undefined)).toBe(false);
      expect(taskIsDueTomorrow("")).toBe(false);
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

    it("détecte hasTomorrowTask si une tâche non abandonnée est due demain", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueTomorrow = tomorrow.toISOString();
      const ctx = buildAchievementContext({
        tasks: [
          { dueDate: dueTomorrow, status: "pending" },
          { dueDate: dueTomorrow, status: "abandoned" },
        ],
        computedStats: {},
        streakUi: 0,
        meta: {},
        todayTotal: 0,
        todayDone: 0,
      });
      expect(ctx.hasTomorrowTask).toBe(true);
      expect(ctx.completedTasks).toBe(0);
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

  describe("getAchievementMeta", () => {
    it("retourne les valeurs par défaut si le JSON stocké est invalide (catch)", async () => {
      await AsyncStorage.setItem(META_KEY, "{json-invalide");
      const meta = await getAchievementMeta();
      expect(meta).toEqual({
        lifetimeCompleted: 0,
        lifetimeSnoozes: 0,
        everTomorrowTask: false,
      });
    });

    it("parse un JSON valide et normalise les champs manquants", async () => {
      await AsyncStorage.setItem(META_KEY, JSON.stringify({}));
      const meta = await getAchievementMeta();
      expect(meta.lifetimeCompleted).toBe(0);
      expect(meta.lifetimeSnoozes).toBe(0);
      expect(meta.everTomorrowTask).toBe(false);
    });

    it("conserve les compteurs et everTomorrowTask depuis le stockage", async () => {
      await AsyncStorage.setItem(
        META_KEY,
        JSON.stringify({
          lifetimeCompleted: 12,
          lifetimeSnoozes: 3,
          everTomorrowTask: true,
        })
      );
      const meta = await getAchievementMeta();
      expect(meta).toEqual({
        lifetimeCompleted: 12,
        lifetimeSnoozes: 3,
        everTomorrowTask: true,
      });
    });
  });

  describe("getUnlockedAchievementIds", () => {
    it("retourne [] si le JSON stocké est invalide (catch)", async () => {
      await AsyncStorage.setItem(UNLOCKED_KEY, "pas-un-tableau");
      const ids = await getUnlockedAchievementIds();
      expect(ids).toEqual([]);
    });

    it("retourne [] si le JSON est un objet et non un tableau", async () => {
      await AsyncStorage.setItem(UNLOCKED_KEY, JSON.stringify({ foo: 1 }));
      const ids = await getUnlockedAchievementIds();
      expect(ids).toEqual([]);
    });
  });
});
