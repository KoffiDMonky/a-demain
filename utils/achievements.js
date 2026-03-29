/**
 * Succès / badges — stockage local (AsyncStorage), pas de notifications.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { t } from "../i18n";

export const UNLOCKED_KEY = "achievement_unlocked_ids";
export const META_KEY = "achievement_meta";

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

/**
 * @typedef {object} AchievementMeta
 * @property {number} [lifetimeCompleted]
 * @property {number} [lifetimeSnoozes]
 * @property {boolean} [everTomorrowTask]
 */

/**
 * Contexte pour évaluer les succès (données déjà chargées côté écran Stats).
 * @typedef {object} AchievementContext
 * @property {number} totalTasks
 * @property {number} completedTasks
 * @property {number} currentStreak
 * @property {number} bestStreak
 * @property {number} totalSnoozes
 * @property {number} lifetimeCompleted
 * @property {number} lifetimeSnoozes
 * @property {boolean} everTomorrowTask
 * @property {boolean} hasTomorrowTask
 * @property {number} todayTotal
 * @property {number} todayDone
 */

export const ACHIEVEMENT_DEFINITIONS = [
  {
    id: "explorer",
    icon: "footsteps-outline",
    test: (c) => c.totalTasks >= 1,
  },
  {
    id: "premiere_victoire",
    icon: "checkmark-circle-outline",
    test: (c) => c.completedTasks >= 1 || c.lifetimeCompleted >= 1,
  },
  {
    id: "organisateur",
    icon: "calendar-outline",
    test: (c) => c.everTomorrowTask || c.hasTomorrowTask,
  },
  {
    id: "pause",
    icon: "time-outline",
    test: (c) => c.totalSnoozes >= 1 || c.lifetimeSnoozes >= 1,
  },
  {
    id: "serie_bronze",
    icon: "flame-outline",
    test: (c) => c.effectiveStreak >= 3,
  },
  {
    id: "serie_argent",
    icon: "flame",
    test: (c) => c.effectiveStreak >= 7,
  },
  {
    id: "serie_or",
    icon: "trophy-outline",
    test: (c) => c.effectiveStreak >= 30,
  },
  {
    id: "record",
    icon: "ribbon-outline",
    test: (c) => c.bestStreak >= 10,
  },
  {
    id: "marathon_10",
    icon: "flag-outline",
    test: (c) => c.lifetimeCompleted >= 10,
  },
  {
    id: "marathon_50",
    icon: "medal-outline",
    test: (c) => c.lifetimeCompleted >= 50,
  },
  {
    id: "journee_parfaite",
    icon: "sunny-outline",
    test: (c) => c.todayTotal > 0 && c.todayDone === c.todayTotal,
  },
  {
    id: "procrastination_assumee",
    icon: "shuffle-outline",
    test: (c) => c.lifetimeSnoozes >= 10,
  },
];

export async function getAchievementMeta() {
  try {
    const raw = await AsyncStorage.getItem(META_KEY);
    if (!raw) {
      return { lifetimeCompleted: 0, lifetimeSnoozes: 0, everTomorrowTask: false };
    }
    const parsed = JSON.parse(raw);
    return {
      lifetimeCompleted: parsed.lifetimeCompleted || 0,
      lifetimeSnoozes: parsed.lifetimeSnoozes || 0,
      everTomorrowTask: !!parsed.everTomorrowTask,
    };
  } catch {
    return { lifetimeCompleted: 0, lifetimeSnoozes: 0, everTomorrowTask: false };
  }
}

async function saveAchievementMeta(meta) {
  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
}

/** Appeler quand une tâche passe de « pending » à « done ». */
export async function recordTaskCompletedOnce() {
  const meta = await getAchievementMeta();
  meta.lifetimeCompleted = (meta.lifetimeCompleted || 0) + 1;
  await saveAchievementMeta(meta);
}

/** Appeler à chaque snooze (report à demain). */
export async function recordSnoozeOnce() {
  const meta = await getAchievementMeta();
  meta.lifetimeSnoozes = (meta.lifetimeSnoozes || 0) + 1;
  await saveAchievementMeta(meta);
}

/** Appeler quand une tâche est enregistrée pour demain (écran Nouvelle tâche). */
export async function markTomorrowTaskPlanned() {
  const meta = await getAchievementMeta();
  meta.everTomorrowTask = true;
  await saveAchievementMeta(meta);
}

export async function getUnlockedAchievementIds() {
  try {
    const raw = await AsyncStorage.getItem(UNLOCKED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

async function saveUnlockedIds(ids) {
  await AsyncStorage.setItem(UNLOCKED_KEY, JSON.stringify(ids));
}

/**
 * Indique si une tâche est due « demain » par rapport à `now`.
 */
export function taskIsDueTomorrow(dueDateIso, now = new Date()) {
  if (!dueDateIso) return false;
  const d = new Date(dueDateIso);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(d, tomorrow);
}

/**
 * Construit le contexte à partir des données Stats + meta + streak UI.
 */
export function buildAchievementContext({
  tasks,
  computedStats,
  streakUi,
  meta,
  todayTotal,
  todayDone,
}) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const hasTomorrowTask = tasks.some(
    (t) => t.dueDate && taskIsDueTomorrow(t.dueDate) && t.status !== "abandoned"
  );

  const effectiveStreak = Math.max(
    computedStats.currentStreak || 0,
    streakUi || 0
  );

  return {
    totalTasks: tasks.length,
    completedTasks: tasks.filter((t) => t.status === "done").length,
    currentStreak: computedStats.currentStreak || 0,
    bestStreak: computedStats.bestStreak || 0,
    totalSnoozes: computedStats.totalSnoozes || 0,
    lifetimeCompleted: meta.lifetimeCompleted || 0,
    lifetimeSnoozes: meta.lifetimeSnoozes || 0,
    everTomorrowTask: !!meta.everTomorrowTask,
    hasTomorrowTask,
    todayTotal: todayTotal || 0,
    todayDone: todayDone || 0,
    effectiveStreak,
  };
}

/**
 * Met à jour les IDs débloqués selon le contexte ; retourne la liste affichable.
 */
export async function syncAchievementsWithContext(context) {
  const prev = new Set(await getUnlockedAchievementIds());

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (!prev.has(def.id) && def.test(context)) {
      prev.add(def.id);
    }
  }

  await saveUnlockedIds([...prev]);

  return ACHIEVEMENT_DEFINITIONS.map((def) => ({
    id: def.id,
    title: t(`achievement.${def.id}.title`),
    description: t(`achievement.${def.id}.description`),
    icon: def.icon,
    unlocked: prev.has(def.id),
  }));
}
