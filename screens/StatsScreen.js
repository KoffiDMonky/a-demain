import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { computeStats } from "../utils/storage";
import { getStreakData } from "../utils/streak";
import {
  getAchievementMeta,
  buildAchievementContext,
  syncAchievementsWithContext,
} from "../utils/achievements";
import { t, MOTIVATION_MESSAGE_COUNT } from "../i18n";

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

  const [streak, setStreak] = useState(0);
  const [achievements, setAchievements] = useState([]);

  const isFocused = useIsFocused();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Chargement des stats quand l'écran est focus
  useEffect(() => {
    if (isFocused) {
      loadStats();
    }
  }, [isFocused]);

  // Animation de la barre de progression
  useEffect(() => {
    const percentage =
      stats.todayTotal > 0 ? (stats.todayDone / stats.todayTotal) * 100 : 0;
    const animation = Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 700,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [stats.todayDone, stats.todayTotal]);

  // Après le chargement, animation d'apparition des blocs
  useEffect(() => {
    const animation = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [stats]);

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

    const streakData = await getStreakData();
    setStreak(streakData.streak || 0);

    const meta = await getAchievementMeta();
    const ctx = buildAchievementContext({
      tasks,
      computedStats: computed,
      streakUi: streakData.streak || 0,
      meta,
      todayTotal: todayTasks.length,
      todayDone,
    });
    const badgeList = await syncAchievementsWithContext(ctx);
    setAchievements(badgeList);
  };

  const getMotivationalMessage = () => {
    const index = Math.floor(Math.random() * MOTIVATION_MESSAGE_COUNT);
    return t(`stats.motivation.${index}`);
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight : 0,
        },
      ]}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../assets/Logo_Header.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.titleWrapper}></View>
          <View style={styles.side}>
            <View style={styles.inline}>
              {streak > 0 && (
                <View style={styles.flameContainer}>
                  {/* <Text style={styles.flameIcon}>🔥</Text> */}
                  <Image
                    source={require("../assets/Flamme_A_demain.png")}
                    style={styles.flameLogo}
                    resizeMode="contain"
                  />
                  <Text style={styles.flameText}>{streak}</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.fap}
                testID="stats-screen-add"
                onPress={() => navigation.navigate("Nouvelle Tâche")}
              >
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* <Text style={styles.title}>Statistiques</Text> */}

        {stats.todayTotal > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressTitle}>{t("stats.progressTitle")}</Text>
              <Text style={styles.progressFraction}>
                {stats.todayDone} / {stats.todayTotal}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
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
        )}

        <View style={styles.grid}>
          <StatItem label={t("stats.labelCreated")} value={stats.totalTasks} />
          <StatItem
            label={t("stats.labelCompleted")}
            value={stats.completedTasks}
          />
          {/* <StatItem label="Snoozes" value={stats.totalSnoozes} /> */}
          <StatItem
            label={t("stats.labelProcrastination")}
            value={`${stats.snoozePercentage} %`}
          />
          {/* <StatItem label="Record de série" value={stats.bestStreak} /> */}
          <StatItem
            label={t("stats.labelStreak")}
            value={stats.currentStreak}
          />
        </View>

        <LinearGradient
          colors={["#0894FF10", "#FF2E5410"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.motivation}
        >
          <Text style={styles.message}>{getMotivationalMessage()}</Text>
        </LinearGradient>

        <Text style={styles.sectionTitle}>{t("stats.successTitle")}</Text>
        <Text style={styles.sectionHint}>{t("stats.successHint")}</Text>
        <View style={styles.badgesGrid}>
          {achievements.map((a) => (
            <View
              key={a.id}
              style={[
                styles.badgeCard,
                !a.unlocked && styles.badgeCardLocked,
              ]}
            >
              {a.unlocked ? (
                <LinearGradient
                  colors={["#0894FF20", "#C959DD20", "#FF2E5420", "#FF900420"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.badgeIconGradient}
                >
                  <Ionicons name={a.icon} size={26} color="#FF2E54" />
                </LinearGradient>
              ) : (
                <View style={[styles.badgeIconWrap, styles.badgeIconWrapLocked]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={26}
                    color="#bbb"
                  />
                </View>
              )}
              <Text
                style={[styles.badgeTitle, !a.unlocked && styles.badgeTextLocked]}
                numberOfLines={2}
              >
                {a.title}
              </Text>
              <Text
                style={[
                  styles.badgeDesc,
                  !a.unlocked && styles.badgeTextLocked,
                ]}
                numberOfLines={3}
              >
                {a.unlocked ? a.description : t("stats.badgeHidden")}
              </Text>
            </View>
          ))}
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  container: {
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
  progressCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
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
    overflow: "hidden",
    minWidth: 0,
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 6,
    color: "#333",
  },
  sectionHint: {
    fontSize: 13,
    color: "#888",
    marginBottom: 14,
    lineHeight: 18,
  },
  badgesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 20,
  },
  badgeCard: {
    width: "48%",
    backgroundColor: "#fafafa",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    minHeight: 130,
  },
  badgeCardLocked: {
    backgroundColor: "#f5f5f5",
    borderColor: "#e8e8e8",
  },
  badgeIconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    overflow: "hidden",
  },
  badgeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  badgeIconWrapLocked: {
    backgroundColor: "#e0e0e0",
  },
  badgeTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  badgeTextLocked: {
    color: "#aaa",
  },
});
