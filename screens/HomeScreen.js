import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Easing,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import TaskItem from "./../components/TaskItem.js";
import LottieView from "lottie-react-native";
import { computeStats, getStoredTasks, isSameDay, abandonOutdatedTasks } from "../utils/storage";
import { syncStreak } from "../utils/streak";
import { scheduleDailyReminder, ensureNotificationPermission } from "./../utils/notificationHelper.js";

const HomeScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState([]);
  const [tomorrowTasks, setTomorrowTasks] = useState([]);
  const [animationDone, setAnimationDone] = useState(false);
  const isFocused = useIsFocused();
  const flameScale = useRef(new Animated.Value(1)).current;
  const [currentStreak, setCurrentStreak] = useState(0);
  const [streak, setStreak] = useState(0);

  const injectTutorialTasks = async (onInjected) => {
    const existing = await AsyncStorage.getItem("tasks");
    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed.length > 0) return;
    }

    const now = new Date();
    const today = new Date(now.setHours(6, 0, 0, 0));

    const tutorialTasks = [
      {
        id: "tutorial-1",
        text: "Ajouter une tâche pour demain 📅",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tutorial-2",
        text: "Rester appuyé sur une tâche pour l’éditer ✏️",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tutorial-5",
        text: "Appuie sur la tâche pour la cocher ✅",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tutorial-3",
        text: "Glisse une tâche vers la droite pour la reporter à demain ➡️",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tutorial-4",
        text: "Glisse une tâche vers la gauche pour la supprimer ⬅️",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tutorial-7",
        text: "Supprimer les tâches prévues demain 🗑️",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: "tutorial-6",
        text: "Termine toutes les tâches 🎉",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        createdAt: new Date().toISOString(),
      },
    ];

    await AsyncStorage.setItem("tasks", JSON.stringify(tutorialTasks));

    if (onInjected) {
      onInjected(); // recharge la liste après injection
    }
  };

  const loadTasks = async () => {
    const tasks = await getStoredTasks();
    const today = new Date();
    const todayTasks = tasks.filter(
      (t) => isSameDay(new Date(t.dueDate), today) && t.status !== "abandoned"
    );

    const tmwDate = new Date();
    tmwDate.setDate(today.getDate() + 1);
    const tmw = tasks.filter((t) => isSameDay(new Date(t.dueDate), tmwDate) && t.status !== "abandoned");

    setTasks(todayTasks);
    setTomorrowTasks(tmw);

    // ✅ Calcule et stocke le streak à partir de toutes les tâches
    const stats = computeStats(tasks);
    setCurrentStreak(stats.currentStreak);
    await AsyncStorage.setItem(
      "streaks",
      JSON.stringify({
        currentStreak: stats.currentStreak,
        bestStreak: stats.bestStreak,
      })
    );

    const ok = await ensureNotificationPermission();

    // 🔥 Reprogrammer la notification du lendemain
    if(ok)
      await scheduleDailyReminder(tmw);
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

    await AsyncStorage.setItem("tasks", JSON.stringify(updated));
    loadTasks(); // 🔁 ça recharge tout + met à jour le streak
    loadStreak();
  };

  const updateTaskStatus = async (id, status) => {
    const stored = await AsyncStorage.getItem("tasks");
    const allTasks = stored ? JSON.parse(stored) : [];
    const updated = allTasks.map((t) =>
      t.id === id
        ? {
            ...t,
            status,
            snoozeCount:
              status === "snoozed" ? t.snoozeCount + 1 : t.snoozeCount,
            dueDate: status === "snoozed" ? tomorrow() : t.dueDate,
          }
        : t
    );
    await AsyncStorage.setItem("tasks", JSON.stringify(updated));
    loadTasks();

    // ✅ Si la tâche est snoozée, reprogrammer la notif du lendemain
    if (status === "snoozed") {
      const newAllTasks = await getStoredTasks();
      const tomorrowDate = tomorrow();

      const tasksForTomorrow = newAllTasks.filter(
        (t) =>
          t.dueDate && isSameDay(new Date(t.dueDate), tomorrowDate) &&
          t.status !== "abandoned"
      );

      await scheduleDailyReminder(tasksForTomorrow);
    }
  };

  const deleteTask = async (id) => {
    const stored = await AsyncStorage.getItem("tasks");
    let allTasks = stored ? JSON.parse(stored) : [];
    const filtered = allTasks.filter((t) => t.id !== id);
    await AsyncStorage.setItem("tasks", JSON.stringify(filtered));

    // Reprogrammer la notification du lendemain
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksForTomorrow = filtered.filter(
      (t) =>
        t.dueDate &&
        isSameDay(new Date(t.dueDate), tomorrow) &&
        t.status !== "abandoned"
    );

    await scheduleDailyReminder(tasksForTomorrow);

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
    // on recalcule le streak à partir de toutes les tâches stockées
    const allTasks = await getStoredTasks();
    const stats = computeStats(allTasks);
    setCurrentStreak(stats.currentStreak);
  };

  const renderItem = ({ item }) => (
    <TaskItem
      task={item}
      onDone={(t) => {
        // Autorisé : tant que toutes les tâches ne sont pas finies
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
    const todayTasks = tasks.filter(t => {
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

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        streak > 0 && (
          <View style={styles.flameContainer}>
            <Image
              source={require("../assets/Flamme_A_demain.png")}
              style={styles.flameLogo}
              resizeMode="contain"
            />
            <Text style={styles.flameText}>{streak}</Text>
          </View>
        )
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
            source={require("../assets/Logo_Header.png")} // ← adapte ce chemin selon l'endroit où tu mets le fichier
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.side}>
            <View style={styles.inline}>
              {currentStreak > 0 && (
                <View style={styles.flameContainer}>
                  {/* <Text style={styles.flameIcon}>🔥</Text> */}
                  <Image
                    source={require("../assets/Flamme_A_demain.png")} // ← adapte ce chemin selon l'endroit où tu mets le fichier
                    style={styles.flameLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.flameText}>{currentStreak}</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.fap}
                onPress={() => navigation.navigate("Nouvelle Tâche")}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Text style={styles.title}>Tes tâches du jour</Text>
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
        <View style={{ flex: 1 }}>
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ flexGrow: 1 }}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Aucune tâche pour aujourd'hui 💤
                </Text>
              </View>
            }
          />
          {/* {allTasksDone && !animationDone && (
            <View style={styles.doneOverlay} pointerEvents="none">
              <Image
                source={require("../assets/Flamme_A_demain.png")} // ← adapte ce chemin selon l'endroit où tu mets le fichier
                style={styles.streakFlame}
                resizeMode="contain"
              />
              <Text style={styles.flameCurrentStreakText}>{currentStreak}</Text>
            </View>
          )} */}
        </View>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingTop: 5,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
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

  titleWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4CAF50",
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  task: {
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginBottom: 10,
  },
  text: { fontSize: 16 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    gap: 15,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: { backgroundColor: "#4CAF50", padding: 12, borderRadius: 8 },
  buttonText: { color: "white", fontWeight: "bold" },
  empty: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#999",
    marginTop: 40,
  },
  fap: {
    backgroundColor: "#FF2E54",
    borderRadius: 30,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 30,
    marginBottom: 10,
  },
  taskDone: {
    backgroundColor: "#D0F0C0", // vert clair
    borderColor: "#4CAF50",
    borderWidth: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50, // évite de coller aux bords
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

  flameIcon: {
    fontSize: 16,
  },
  flameLogo: {
    width: 30,
    height: 30,
  },
  flameText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  doneOverlay: {
    position: "absolute",
    top: "40%", // ou ajuste à ton goût
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9,
    backgroundColor: "#fff",
    height: "100%",
  },
  doneText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  streakFlame: {
    height: 200,
    width: 200,
  },
  flameCurrentStreakText: {
    color: "#fff",
    position: "absolute",
    top: 100,
    fontSize: 60,
    fontWeight: "bold",
  },
});
