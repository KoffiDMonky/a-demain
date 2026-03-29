import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import TaskItem from "./../components/TaskItem.js";
import TomorrowTaskItem from "../components/TomorrowTaskItem.js";
import CollapsedDeckPreview from "../components/CollapsedDeckPreview.js";
import {
  computeStats,
  getStoredTasks,
  isSameDay,
  abandonOutdatedTasks,
} from "../utils/storage";
import { buildTasksAfterStatusChange } from "../utils/applyHomeTaskStatus";
import { syncStreak } from "../utils/streak";
import {
  scheduleTaskNotification,
  cancelTaskNotification,
  ensureNotificationPermission,
} from "./../utils/notificationHelper.js";
import {
  recordTaskCompletedOnce,
  recordSnoozeOnce,
} from "../utils/achievements";
import { t } from "../i18n";

const HomeScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [tomorrowTasks, setTomorrowTasks] = useState([]);
  const [animationDone, setAnimationDone] = useState(false);
  /** true = déplié (cartes en liste), false = replié (illusion de pile) */
  const [sectionOpenToday, setSectionOpenToday] = useState(true);
  const [sectionOpenTomorrow, setSectionOpenTomorrow] = useState(true);
  const prevTodayCountRef = useRef(undefined);
  const prevTomorrowCountRef = useRef(undefined);
  const isFocused = useIsFocused();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streak, setStreak] = useState(0);

  const injectTutorialTasks = async (onInjected) => {
    const existing = await AsyncStorage.getItem("tasks");
    if (existing !== null) {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        return;
      }
    }

    const now = new Date();
    const today = new Date(now.setHours(6, 0, 0, 0));

    const tutorialTasks = [
      {
        id: "tutorial-1",
        text: t("tutorial.addTomorrow"),
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tutorial-2",
        text: t("tutorial.longPressEdit"),
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tutorial-5",
        text: t("tutorial.tapCheck"),
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tutorial-3",
        text: t("tutorial.swipeRightSnooze"),
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tutorial-4",
        text: t("tutorial.swipeLeftDelete"),
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tutorial-7",
        text: t("tutorial.deleteTomorrowTasks"),
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tutorial-6",
        text: t("tutorial.finishAll"),
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
    ];

    await AsyncStorage.setItem("tasks", JSON.stringify(tutorialTasks));

    onInjected?.();
  };

  const loadTasks = async () => {
    const tasksData = await getStoredTasks();
    const today = new Date();
    const todayTasks = tasksData.filter(
      (t) => isSameDay(new Date(t.dueDate), today) && t.status !== "abandoned"
    );

    const tmwDate = new Date();
    tmwDate.setDate(today.getDate() + 1);
    const tmw = tasksData.filter(
      (t) => isSameDay(new Date(t.dueDate), tmwDate) && t.status !== "abandoned"
    );

    setTasks(todayTasks);
    setTomorrowTasks(tmw);

    const stats = computeStats(tasksData);
    setCurrentStreak(stats.currentStreak);
    await AsyncStorage.setItem(
      "streaks",
      JSON.stringify({
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
      })
    );

    await ensureNotificationPermission();
  };

  const toggleTaskDone = async (task) => {
    const stored = await AsyncStorage.getItem("tasks");
    const allTasks = stored ? JSON.parse(stored) : [];

    const updated = allTasks.map((t) => {
      if (t.id === task.id) {
        const newStatus = t.status === "done" ? "pending" : "done";
        return { ...t, status: newStatus };
      }
      return t;
    });

    if (task.status === "pending") {
      await recordTaskCompletedOnce();
    }

    await AsyncStorage.setItem("tasks", JSON.stringify(updated));
    loadTasks();
    loadStreak();
  };

  const updateTaskStatus = async (id, status) => {
    const stored = await AsyncStorage.getItem("tasks");
    const allTasks = stored ? JSON.parse(stored) : [];
    const nextTasks = await buildTasksAfterStatusChange({
      allTasks,
      id,
      status,
      tomorrow,
      cancelTaskNotification,
      scheduleTaskNotification,
    });
    if (!nextTasks) return;

    await AsyncStorage.setItem("tasks", JSON.stringify(nextTasks));
    /* istanbul ignore else -- seul le statut « snoozed » est envoyé depuis l’UI */
    if (status === "snoozed") {
      await recordSnoozeOnce();
    }
    loadTasks();
  };

  const deleteTask = async (id) => {
    const stored = await AsyncStorage.getItem("tasks");
    let allTasks = stored ? JSON.parse(stored) : [];
    const task = allTasks.find((t) => t.id === id);
    if (task?.notificationId) {
      await cancelTaskNotification(task.notificationId);
    }
    const filtered = allTasks.filter((t) => t.id !== id);
    await AsyncStorage.setItem("tasks", JSON.stringify(filtered));

    loadTasks();
  };

  const deleteTomorrowTask = async (taskId) => {
    const stored = await AsyncStorage.getItem("tasks");
    let allTasks = stored ? JSON.parse(stored) : [];
    const task = allTasks.find((t) => t.id === taskId);

    if (task?.notificationId) {
      await cancelTaskNotification(task.notificationId);
    }

    allTasks = allTasks.filter((t) => t.id !== taskId);
    await AsyncStorage.setItem("tasks", JSON.stringify(allTasks));
    loadTasks();
  };

  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  };

  const allTasksDone =
    tasks.length > 0 &&
    tasks.every((t) => t.status === "done") &&
    tasks.every((t) => (t.snoozeCount || 0) === 0);

  const loadStreak = async () => {
    const allTasksData = await getStoredTasks();
    const stats = computeStats(allTasksData);
    setCurrentStreak(stats.currentStreak);
  };

  const todayTotal = tasks.length;
  const todayDone = tasks.filter((t) => t.status === "done").length;
  const progressPct =
    todayTotal === 0 ? 0 : Math.round((todayDone / todayTotal) * 100);
  const todayCollapsedItems =
    allTasksDone && tasks.length > 0
      ? tasks
      : tasks.filter((t) => t.status !== "done");

  const renderItem = ({ item }) => (
    <TaskItem
      task={item}
      onDone={(t) => {
        if (!allTasksDone) {
          toggleTaskDone(t);
        }
      }}
      onSnooze={(t) => {
        if (!allTasksDone && t.status !== "done")
          updateTaskStatus(t.id, "snoozed");
      }}
      onDelete={(t) => {
        if (!allTasksDone && t.status !== "done") deleteTask(t.id);
      }}
      onEdit={(t) => {
        if (!allTasksDone && t.status !== "done")
          navigation.navigate("Nouvelle Tâche", { task: t });
      }}
    />
  );

  const renderTomorrowItem = (item) => (
    <TomorrowTaskItem
      item={item}
      onDelete={deleteTomorrowTask}
      onEdit={(task) => navigation.navigate("Nouvelle Tâche", { task })}
    />
  );

  useEffect(() => {
    injectTutorialTasks(loadTasks);
  }, []);

  useEffect(() => {
    loadStreak();
    if (isFocused) {
      loadTasks();
      loadStreak();
    }
  }, [isFocused]);

  useEffect(() => {
    const todayTasks = tasks.filter((t) => {
      const d = new Date(t.dueDate);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });
    syncStreak(todayTasks).then(setStreak);
  }, [tasks]);

  useEffect(() => {
    const init = async () => {
      await abandonOutdatedTasks();
      await loadTasks();
    };

    init();
  }, []);

  /**
   * Section vide = toujours repliée ; pas de toggle tant qu’il n’y a aucune tâche.
   * Passage 0 → >0 : on déplie (tutoriel, chargement persistant, première tâche).
   */
  useEffect(() => {
    const n = tasks.length;
    const prev = prevTodayCountRef.current;

    /* istanbul ignore else -- ouverture auto 0→N : effets async (tutoriel / loadTasks) */
    if (n === 0) {
      setSectionOpenToday(false);
    } else if (prev === 0) {
      setSectionOpenToday(true);
    }
    prevTodayCountRef.current = n;
  }, [tasks.length]);

  useEffect(() => {
    const n = tomorrowTasks.length;
    const prev = prevTomorrowCountRef.current;

    /* istanbul ignore else -- id. section demain (snooze / ajouts) */
    if (n === 0) {
      setSectionOpenTomorrow(false);
    } else if (prev === 0) {
      setSectionOpenTomorrow(true);
    }
    prevTomorrowCountRef.current = n;
  }, [tomorrowTasks.length]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        streak > 0 && (
          <View style={styles.flameContainer}>
            <Image
              source={require("../assets/Flamme_A_demain.png")}
              style={styles.flameLogo}
              resizeMode="contain"
            />
            <Text style={styles.flameText}>{streak}</Text>
          </View>
        ),
    });
  }, [navigation, streak]);

  useLayoutEffect(() => {
    if (allTasksDone) {
      setAnimationDone(false);
    }
  }, [allTasksDone]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../assets/Logo_Header.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.side}>
            {currentStreak > 0 && (
              <View style={styles.inline}>
                <View style={styles.flameContainer}>
                  <Image
                    source={require("../assets/Flamme_A_demain.png")}
                    style={styles.flameLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.flameText}>{currentStreak}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {allTasksDone && !animationDone && (
          <View
            pointerEvents="none"
            style={[
              styles.lottieContainer,
              { top: 0, transform: [{ scaleY: -1 }] },
            ]}
          >
            <LottieView
              source={require("../assets/celebration.json")}
              autoPlay
              loop={false}
              style={{ width: 500, height: 500 }}
              onAnimationFinish={() => setAnimationDone(true)}
            />
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          {/* Progression du jour */}
          <View style={styles.progressCard}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressTitle}>{t("home.progressTitle")}</Text>
              <Text style={styles.progressFraction}>
                {todayDone} / {todayTotal}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={["#0894FF", "#C959DD", "#FF2E54", "#FF9004"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${progressPct}%` }]}
              />
            </View>
          </View>

          {/* Section Aujourd'hui — tap : déplier / replier (désactivé si aucune tâche) */}
          <View style={[styles.sectionHeaderWithLine, styles.sectionHeaderFirst]}>
            <TouchableOpacity
              style={[
                styles.sectionTitleTap,
                tasks.length === 0 && styles.sectionHeaderDisabled,
              ]}
              onPress={() =>
                tasks.length > 0 && setSectionOpenToday((o) => !o)
              }
              disabled={tasks.length === 0}
              activeOpacity={tasks.length === 0 ? 1 : 0.7}
              testID="home-section-today-header"
              accessibilityRole="button"
              accessibilityState={{ disabled: tasks.length === 0 }}
              accessibilityLabel={
                tasks.length === 0
                  ? t("home.a11y.todayNone")
                  : sectionOpenToday
                    ? t("home.a11y.todayCollapse")
                    : t("home.a11y.todayExpand")
              }
            >
              <Text style={styles.sectionHeading}>{t("home.today")}</Text>
              <Ionicons
                name="chevron-down"
                size={22}
                color="#6B7280"
                style={{
                  transform: [
                    { rotate: sectionOpenToday ? "0deg" : "180deg" },
                  ],
                }}
              />
            </TouchableOpacity>
            <View style={styles.sectionHeaderLineWrapToday}>
              <View style={styles.sectionHeaderLine} />
            </View>
          </View>
          {sectionOpenToday ? (
            tasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t("home.emptyToday")}</Text>
              </View>
            ) : (
              tasks.map((item) => (
                <View key={item.id}>{renderItem({ item })}</View>
              ))
            )
          ) : (
            <CollapsedDeckPreview
              variant="today"
              items={todayCollapsedItems}
              emptyText={t("home.emptyToday")}
              onPress={
                tasks.length > 0
                  ? () => setSectionOpenToday(true)
                  : undefined
              }
              accessibilityLabel={t("home.a11y.expandTodayDeck")}
            />
          )}

          {/* Section À demain — tap : déplier / replier */}
          <View style={styles.tomorrowHeader}>
            <TouchableOpacity
              style={[
                styles.sectionTitleTap,
                tomorrowTasks.length === 0 && styles.sectionHeaderDisabled,
              ]}
              onPress={() =>
                tomorrowTasks.length > 0 &&
                setSectionOpenTomorrow((o) => !o)
              }
              disabled={tomorrowTasks.length === 0}
              activeOpacity={tomorrowTasks.length === 0 ? 1 : 0.7}
              testID="home-section-tomorrow-header"
              accessibilityRole="button"
              accessibilityState={{ disabled: tomorrowTasks.length === 0 }}
              accessibilityLabel={
                tomorrowTasks.length === 0
                  ? t("home.a11y.tomorrowNone")
                  : sectionOpenTomorrow
                    ? t("home.a11y.tomorrowCollapse")
                    : t("home.a11y.tomorrowExpand")
              }
            >
              <Text style={styles.sectionHeading}>{t("home.tomorrow")}</Text>
              <Ionicons
                name="chevron-down"
                size={22}
                color="#6B7280"
                style={{
                  transform: [
                    { rotate: sectionOpenTomorrow ? "0deg" : "180deg" },
                  ],
                }}
              />
            </TouchableOpacity>
            <View style={styles.sectionHeaderLineWrapTomorrow}>
              <View style={styles.sectionHeaderLine} />
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("Nouvelle Tâche")}
              style={styles.sectionAddBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              testID="icon-add-tomorrow"
              accessibilityLabel={t("home.a11y.addTomorrow")}
              accessibilityRole="button"
            >
              <Ionicons name="add" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {sectionOpenTomorrow ? (
            tomorrowTasks.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t("home.emptyTomorrow")}</Text>
              </View>
            ) : (
              tomorrowTasks.map((item) => (
                <View key={item.id}>{renderTomorrowItem(item)}</View>
              ))
            )
          ) : (
            <CollapsedDeckPreview
              variant="tomorrow"
              items={tomorrowTasks}
              emptyText={t("home.emptyTomorrow")}
              onPress={
                tomorrowTasks.length > 0
                  ? () => setSectionOpenTomorrow(true)
                  : undefined
              }
              accessibilityLabel={t("home.a11y.expandTomorrowDeck")}
            />
          )}
        </ScrollView>

        {allTasksDone && !animationDone && (
          <View
            pointerEvents="none"
            style={[styles.lottieContainer, { top: "55%" }]}
          >
            <LottieView
              source={require("../assets/celebration.json")}
              autoPlay
              loop={false}
              style={{ width: 500, height: 500 }}
              onAnimationFinish={() => setAnimationDone(true)}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

/* istanbul ignore next -- deux branches OS : rechargement module dans HomeScreen.module.android.test */
const SAFE_AREA_TOP_PADDING =
  Platform.OS === "android" ? StatusBar.currentHeight : 0;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: SAFE_AREA_TOP_PADDING,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingTop: 5,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  logo: {
    width: 160,
    height: 40,
    marginRight: 8,
  },
  side: {
    minWidth: 80,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  progressCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  progressFraction: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
  },
  progressTrack: {
    height: 10,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
    minWidth: 0,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  sectionHeaderWithLine: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionHeaderFirst: {
    marginTop: 8,
  },
  sectionTitleTap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionHeaderDisabled: {
    opacity: 0.55,
  },
  /** Prolonge la ligne jusqu’au bord droit de l’écran (compense paddingHorizontal du conteneur) */
  sectionHeaderLineWrapToday: {
    flex: 1,
    marginLeft: 12,
    marginRight: -20,
    justifyContent: "center",
  },
  /** Ligne du chevron jusqu’au bouton + (marge à droite = air avant le +) */
  sectionHeaderLineWrapTomorrow: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
    justifyContent: "center",
  },
  sectionHeaderLine: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    minHeight: 1,
    backgroundColor: "#D1D5DB",
  },
  tomorrowHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
    gap: 0,
  },
  sectionAddBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF2E54",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#fff",
  },
  emptyText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#999",
    textAlign: "center",
  },
  lottieContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  inline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  flameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  flameLogo: {
    width: 30,
    height: 30,
  },
  flameText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
