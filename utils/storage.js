// utils/storage.js

export const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

export const groupTasksByDay = (tasks) => {
  const group = {};
  tasks.forEach((t) => {
    if (!t.dueDate) return;
    const key = new Date(t.dueDate).toISOString().split("T")[0];
    if (!group[key]) group[key] = [];
    group[key].push(t);
  });
  return group;
};

export const computeStats = (tasks) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const totalSnoozes = tasks.reduce((acc, t) => acc + (t.snoozeCount || 0),0);
  const snoozePercentage =
    totalTasks > 0 ? ((totalSnoozes / totalTasks) * 100).toFixed(1) : 0;

  const groupByDay = groupTasksByDay(tasks);
  
  const todayKey = new Date().toISOString().split("T")[0];

  // Process only past days for streak
  const pastDays = Object.keys(groupByDay)
    .filter((date) => date < todayKey)
    .sort();

  let lastValidDate = null;
  let currentStreak = 0;
  let bestStreak = 0;

  for (const dateStr of pastDays) {
    const dayTasks = groupByDay[dateStr];
    // A day is valid if all tasks are done (or allowed snooze/abandoned)
    const dayValid = dayTasks.every(
      (t) =>
        t.status === "done" ||
        t.status === "abandoned" ||
        (t.status === "snoozed" && (t.snoozeCount || 0) <= 1)
    );

    if (dayValid) {
      const thisDate = new Date(dateStr);
      if (
        lastValidDate &&
        thisDate.getTime() - lastValidDate.getTime() === 86400000
      ) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
      lastValidDate = thisDate;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
      lastValidDate = null;
    }
  }

  // Include today only if all tasks are done
  const todayTasks = groupByDay[todayKey] || [];
  if (
    todayTasks.length > 0 &&
    todayTasks.every((t) =>
      t.status === "done" ||
      t.status === "abandoned" ||
      (t.status === "snoozed" && (t.snoozeCount || 0) <= 1)
    )
  ) {
    const thisDate = new Date(todayKey);
    if (
      lastValidDate &&
      thisDate.getTime() - lastValidDate.getTime() === 86400000
    ) {
      currentStreak++;
    } else {
      currentStreak = 1;
    }
    bestStreak = Math.max(bestStreak, currentStreak);
  }

  return {
    totalTasks,
    completedTasks,
    totalSnoozes,
    snoozePercentage,
    bestStreak,
    currentStreak,
  };
};

export const updateAndStoreStreaks = async (tasks, setStreakState) => {
  const stats = computeStats(tasks);
  await AsyncStorage.setItem(
    "streaks",
    JSON.stringify({
      currentStreak: stats.currentStreak,
      bestStreak: stats.bestStreak,
    })
  );
  if (setStreakState) setStreakState(stats.currentStreak);
};
