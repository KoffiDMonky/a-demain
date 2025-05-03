import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { computeStats } from "../utils/storage";

const StatItem = ({ label, value }) => (
  <LinearGradient
    colors={["#0894FF20", "#C959DD20", "#FF2E5420", "#FF900420"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.statItem}
  >
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </LinearGradient>
);

const StatsScreen = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalSnoozes: 0,
    snoozePercentage: 0,
    bestStreak: 0,
    currentStreak: 0,
    todayTotal: 0,
    todayDone: 0,
  });

  const isFocused = useIsFocused();
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isFocused) {
      loadStats();
      //logTasks();
    }
  }, [isFocused]);

  useEffect(() => {
    const percentage = (stats.todayDone / (stats.todayTotal || 1)) * 100;
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [stats.todayDone, stats.todayTotal]);

  const loadStats = async () => {
    const data = await AsyncStorage.getItem("tasks");
    const tasks = data ? JSON.parse(data) : [];

    const today = new Date();
    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const todayTasks = tasks.filter(
      (t) =>
        t.dueDate &&
        isSameDay(new Date(t.dueDate), today) &&
        t.status !== "abandoned"
    );
    const todayDone = todayTasks.filter((t) => t.status === "done").length;

    const computed = computeStats(tasks);
    setStats({
      ...computed,
      todayTotal: todayTasks.length,
      todayDone,
    });

    await AsyncStorage.setItem(
      "streaks",
      JSON.stringify({
        currentStreak: computed.currentStreak,
        bestStreak: computed.bestStreak,
      })
    );
  };

  const computeStats = (tasks) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const totalSnoozes = tasks.reduce(
      (acc, t) => acc + (t.snoozeCount || 0),
      0
    );
    const snoozePercentage =
      totalTasks > 0 ? ((totalSnoozes / totalTasks) * 100).toFixed(1) : 0;

    const toDateKey = (date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d.toISOString().split("T")[0];
    };

    const groupByDay = {};
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const dateKey = toDateKey(t.dueDate);
      if (!groupByDay[dateKey]) groupByDay[dateKey] = [];
      groupByDay[dateKey].push(t);
    });

    console.log("🗓️ Dates regroupées :", groupByDay);

    const sortedDays = Object.keys(groupByDay).sort();
    let lastValidDate = null;
    let currentStreak = 0;
    let bestStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const dateStr of sortedDays) {
      const thisDate = new Date(dateStr);
      if (thisDate > today) {
        console.log(`⏭️ Ignoré (futur): ${dateStr}`);
        continue;
      }

      const dayTasks = groupByDay[dateStr];
      const allDone = dayTasks.every((t) => t.status === "done");
      const anySnoozed = dayTasks.some((t) => t.snoozeCount > 0);
      const anyAbandoned = dayTasks.some((t) => t.status === "abandoned");

      console.log(
        `📆 ${dateStr} → allDone: ${allDone}, snoozed: ${anySnoozed}, abandoned: ${anyAbandoned}`
      );

      if (allDone && !anySnoozed && !anyAbandoned) {
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

    const result = {
      totalTasks,
      completedTasks,
      totalSnoozes,
      snoozePercentage,
      bestStreak,
      currentStreak,
    };

    console.log("📊 Résultat final :", result);
    return result;
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Tu avances, c’est l’essentiel 🌱",
      "Chaque petit pas compte 🚶‍♂️",
      "Demain est un nouveau départ ☀️",
      "Tu fais de ton mieux, et c’est déjà super 💪",
      "Une tâche à la fois 🧘‍♀️",
    ];
    const index = Math.floor(Math.random() * messages.length);
    return messages[index];
  };

  const logTasks = async () => {
    const data = await AsyncStorage.getItem("tasks");
    const tasks = data ? JSON.parse(data) : [];

    console.log(
      "📦 Tâches stockées :",
      tasks.map((t) => ({
        id: t.id,
        text: t.text,
        dueDate: t.dueDate,
        status: t.status,
        snoozeCount: t.snoozeCount,
      }))
    );
  };

  const handleClearTasks = async () => {
    await AsyncStorage.removeItem("tasks");
    alert("🧹 Données supprimées");
  };

  const handleSeedTasks = async () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const makeTask = (text, day) => ({
      id: Math.random().toString(36).substring(7),
      text,
      createdAt: new Date(),
      dueDate: day,
      status: "pending",
      snoozeCount: 0,
      notificationId: null,
    });

    const sample = [
      makeTask("Boire de l'eau 💧", today),
      makeTask("Lire 10 pages 📖", today),
      makeTask("Marcher 30 minutes 🚶", today),
      makeTask("Éteindre le téléphone à 22h 📵", today),
      makeTask("Appeler un ami ☎️", tomorrow),
      makeTask("Regarder un documentaire 🎬", tomorrow),
      makeTask("Préparer le repas 🍲", tomorrow),
      makeTask("Faire une sieste 😴", tomorrow),
      makeTask("Planifier la semaine 🗓️", tomorrow),
    ];

    await AsyncStorage.setItem("tasks", JSON.stringify(sample));
    alert("✨ Données de démo ajoutées");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../assets/Logo_Header.png")} // ← adapte ce chemin selon l'endroit où tu mets le fichier
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.titleWrapper}></View>
          <View style={styles.side}>
            <View style={styles.inline}>
              {stats.currentStreak > 0 && (
                <View style={styles.flameContainer}>
                  {/* <Text style={styles.flameIcon}>🔥</Text> */}
                  <Image
                    source={require("../assets/Flamme_A_demain.png")} // ← adapte ce chemin selon l'endroit où tu mets le fichier
                    style={styles.flameLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.flameText}>{stats.currentStreak}</Text>
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

        <Text style={styles.title}>Statistiques</Text>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            Tâches du jour : {stats.todayDone}/{stats.todayTotal}
          </Text>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            >
              <LinearGradient
                colors={["#0894FF", "#C959DD", "#FF2E54", "#FF9004"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </View>

        <View style={styles.grid}>
          <StatItem label="Tâches créées" value={stats.totalTasks} />
          <StatItem label="Tâches complétées" value={stats.completedTasks} />
          {/* <StatItem label="Snoozes" value={stats.totalSnoozes} /> */}
          <StatItem
            label="Procrastination (%)"
            value={`${stats.snoozePercentage} %`}
          />
          {/* <StatItem label="Record de série" value={stats.bestStreak} /> */}
          <StatItem label="Série en cours" value={stats.currentStreak} />
        </View>

        <LinearGradient
          colors={["#0894FF10", "#FF2E5410"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.motivation}
        >
          <Text style={styles.message}>{getMotivationalMessage()}</Text>
        </LinearGradient>
        {/* <TouchableOpacity onPress={loadStats} style={{ marginBottom: 20 }}>
          <Text style={{ color: "#FF2E54", textAlign: "center" }}>
            🔄 Rafraîchir les stats
          </Text>
        </TouchableOpacity> */}

        {/* <View style={{ marginTop: 30 }}>
          <TouchableOpacity
            style={[styles.devButton, { backgroundColor: "#FFCDD2" }]}
            onPress={handleClearTasks}
          >
            <Text style={styles.devButtonText}>🧹 Supprimer les données</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.devButton, { backgroundColor: "#C8E6C9" }]}
            onPress={handleSeedTasks}
          >
            <Text style={styles.devButtonText}>
              ✨ Remplir avec données propres
            </Text>
          </TouchableOpacity>
        </View> */}
      </View>
    </SafeAreaView>
  );
};

export default StatsScreen;

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
  appName: { fontSize: 32, fontWeight: "bold", letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  fap: {
    backgroundColor: "#FF2E54",
    borderRadius: 30,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  statItem: {
    width: "48%",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  statLabel: { fontSize: 14, color: "#555" },
  statValue: { fontSize: 22, fontWeight: "bold", color: "#333", marginTop: 5 },
  motivation: {
    marginTop: 15,
    padding: 20,
    borderRadius: 12,
  },
  message: {
    fontSize: 18,
    fontStyle: "italic",
    //color: "#388E3C",
    textAlign: "center",
  },
  progressContainer: { width: "100%", marginBottom: 30 },
  progressLabel: { fontSize: 16, marginBottom: 8, color: "#444" },
  progressBarBackground: {
    width: "100%",
    height: 15,
    backgroundColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 8,
    overflow: "hidden",
  },
  devButton: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: "center",
  },
  devButtonText: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#333",
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
});
