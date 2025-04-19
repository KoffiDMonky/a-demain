import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const scheduleDailyReminder = async (tasks) => {
  const todayKey = new Date().toISOString().split("T")[0]; // ex: "2025-04-19"
  const lastScheduled = await AsyncStorage.getItem("lastNotificationDate");

  if (lastScheduled === todayKey) {
    console.log("📆 Notification déjà planifiée aujourd'hui");
    return;
  }

  // ✍️ Construire le message avec les tâches
  let body = "Tu as des tâches à faire aujourd’hui 🧠";
  if (tasks && tasks.length > 0) {
    const lines = tasks.slice(0, 5).map((t) => `• ${t.text}`);
    body = ["Tes tâches du jour :", ...lines].join("\n");

    if (tasks.length > 5) {
      body += `\n...et ${tasks.length - 5} autres`;
    }
  }

  // 🧼 Supprime les anciennes notifications programmées
  await Notifications.cancelAllScheduledNotificationsAsync();

  // ⏰ Planifie la notification
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "À Demain ✨",
      body,
    },
    trigger: {
      hour: 8,
      minute: 0,
      repeats: false,
    },
  });

  // 🧠 Marque cette date comme planifiée
  await AsyncStorage.setItem("lastNotificationDate", todayKey);
  console.log("✅ Notification planifiée avec résumé pour", todayKey);
};
