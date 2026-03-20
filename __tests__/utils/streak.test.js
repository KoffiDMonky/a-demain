/**
 * Tests de non-régression - utils/streak.js
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStreakData, syncStreak } from "../../utils/streak";

describe("streak", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe("getStreakData", () => {
    it("retourne { streak: 0, lastComputed: null } quand vide", async () => {
      const data = await getStreakData();
      expect(data).toEqual({ streak: 0, lastComputed: null });
    });

    it("retourne les données stockées après setItem", async () => {
      await AsyncStorage.setItem(
        "streakData",
        JSON.stringify({ streak: 5, lastComputed: "2025-03-14" })
      );
      const data = await getStreakData();
      expect(data.streak).toBe(5);
      expect(data.lastComputed).toBe("2025-03-14");
    });
  });

  describe("syncStreak", () => {
    it("retourne 0 quand aucune tâche aujourd’hui (pas encore traité)", async () => {
      const result = await syncStreak([]);
      expect(result).toBe(0);
    });

    it("retourne 1 quand toutes les tâches du jour sont done (premier jour)", async () => {
      const tasksToday = [{ id: "1", status: "done" }];
      const result = await syncStreak(tasksToday);
      expect(result).toBe(1);
    });

    it("retourne 0 quand au moins une tâche n’est pas done", async () => {
      const tasksToday = [
        { id: "1", status: "done" },
        { id: "2", status: "pending" },
      ];
      const result = await syncStreak(tasksToday);
      expect(result).toBe(0);
    });

    it("ne double pas la mise à jour si appelé deux fois le même jour", async () => {
      const tasksToday = [{ id: "1", status: "done" }];
      const r1 = await syncStreak(tasksToday);
      const r2 = await syncStreak(tasksToday);
      expect(r1).toBe(1);
      expect(r2).toBe(1);
    });
  });
});
