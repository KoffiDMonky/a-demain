/**
 * Tests de non-régression - utils/streak.js
 * (syncStreak : même logique de clés jour que le module — date locale)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStreakData, syncStreak } from "../../utils/streak";

/** Aligné sur utils/streak.js — pour calculer yesterdayKey comme le prod */
function toKey(date) {
  const d = new Date(date);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

describe("streak", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
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

    it("incrémente la série quand hier était le dernier jour compté et tout est fait aujourd’hui", async () => {
      jest.useFakeTimers({ advanceTimers: true });
      jest.setSystemTime(new Date(2025, 2, 15, 12, 0, 0));

      const todayKey = toKey(new Date());
      const yesterdayKey = toKey(Date.now() - 86400_000);

      await AsyncStorage.setItem(
        "streakData",
        JSON.stringify({ streak: 4, lastComputed: yesterdayKey })
      );

      const result = await syncStreak([{ id: "1", status: "done" }]);
      expect(result).toBe(5);

      const stored = await getStreakData();
      expect(stored.streak).toBe(5);
      expect(stored.lastComputed).toBe(todayKey);
    });

    it("conserve la série (sans +1) si hier était compté mais pas toutes les tâches faites aujourd’hui", async () => {
      jest.useFakeTimers({ advanceTimers: true });
      jest.setSystemTime(new Date(2025, 2, 15, 12, 0, 0));

      const yesterdayKey = toKey(Date.now() - 86400_000);

      await AsyncStorage.setItem(
        "streakData",
        JSON.stringify({ streak: 7, lastComputed: yesterdayKey })
      );

      const result = await syncStreak([
        { id: "1", status: "done" },
        { id: "2", status: "pending" },
      ]);
      expect(result).toBe(7);

      const stored = await getStreakData();
      expect(stored.streak).toBe(7);
      expect(stored.lastComputed).toBe(toKey(new Date()));
    });

    it("avec hier compté et aucune tâche aujourd’hui : garde le streak stocké (0 ou N)", async () => {
      jest.useFakeTimers({ advanceTimers: true });
      jest.setSystemTime(new Date(2025, 2, 15, 12, 0, 0));

      const yesterdayKey = toKey(Date.now() - 86400_000);

      await AsyncStorage.setItem(
        "streakData",
        JSON.stringify({ streak: 3, lastComputed: yesterdayKey })
      );

      const result = await syncStreak([]);
      expect(result).toBe(3);
    });

    it("trou > 1 jour : repart à 1 si tout est fait, sinon 0", async () => {
      jest.useFakeTimers({ advanceTimers: true });
      jest.setSystemTime(new Date(2025, 2, 15, 12, 0, 0));

      const staleKey = toKey(new Date(2025, 2, 5, 12, 0, 0));
      await AsyncStorage.setItem(
        "streakData",
        JSON.stringify({ streak: 99, lastComputed: staleKey })
      );

      expect(await syncStreak([{ id: "1", status: "done" }])).toBe(1);
      await AsyncStorage.setItem(
        "streakData",
        JSON.stringify({ streak: 99, lastComputed: "2025-03-10" })
      );
      expect(
        await syncStreak([
          { id: "1", status: "done" },
          { id: "2", status: "pending" },
        ])
      ).toBe(0);
    });

    it("hier compté + streak 0 + tout fait : passe à 1", async () => {
      jest.useFakeTimers({ advanceTimers: true });
      jest.setSystemTime(new Date(2025, 2, 15, 12, 0, 0));

      const yesterdayKey = toKey(Date.now() - 86400_000);

      await AsyncStorage.setItem(
        "streakData",
        JSON.stringify({ streak: 0, lastComputed: yesterdayKey })
      );

      expect(await syncStreak([{ id: "1", status: "done" }])).toBe(1);
    });
  });
});
