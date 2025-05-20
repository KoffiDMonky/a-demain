import AsyncStorage from "@react-native-async-storage/async-storage";

const STREAK_KEY = "streakData";

const toKey = date => {
  const d = new Date(date);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

export async function getStreakData() {
  const json = await AsyncStorage.getItem(STREAK_KEY);
  return json ? JSON.parse(json) : { streak: 0, lastComputed: null };
}

export async function syncStreak(tasksToday) {
  const { streak: storedStreak, lastComputed } = await getStreakData();
  const todayKey = toKey(new Date());
  const yesterdayKey = toKey(Date.now() - 86400_000);

  // Si déjà traité
  if (lastComputed === todayKey) return storedStreak;

  const allDone =
    tasksToday.length > 0 && tasksToday.every(t => t.status === "done");
  let newStreak;

  if (lastComputed === yesterdayKey) {
    newStreak = allDone ? storedStreak + 1 : storedStreak;
  } else {
    newStreak = allDone ? 1 : 0;
  }

  await AsyncStorage.setItem(
    STREAK_KEY,
    JSON.stringify({ streak: newStreak, lastComputed: todayKey })
  );
  return newStreak;
}