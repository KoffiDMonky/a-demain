import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // affiche l'alerte en foreground
    shouldPlaySound: true, // joue le son si défini
    shouldSetBadge: false, // ne change pas l'icône de l'app
  }),
});

// Fonction pour programmer une notification pour demain matin à 8h
export async function scheduleDailyReminder(tasksForTomorrow = []) {
  await cancelPreviousReminder();

  const now = new Date();
  const tomorrow8h = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    8,
    0,
    0
  );

  let body = "";
  const visibleTasks = tasksForTomorrow.filter((t) => t.status !== "snoozed");
  const snoozedTasks = tasksForTomorrow.filter((t) => t.status === "snoozed");

  if (visibleTasks.length > 0) {
    const lines = visibleTasks.slice(0, 5).map((t) => `• ${t.text}`);
    body = ["Tes tâches du jour :", ...lines].join("\n");

    if (visibleTasks.length > 5) {
      body += `\n...et ${visibleTasks.length - 5} autres`;
    }

    if (snoozedTasks.length > 0) {
      body += `\n(+ ${snoozedTasks.length} tâche${
        snoozedTasks.length > 1 ? "s" : ""
      } reportée${snoozedTasks.length > 1 ? "s" : ""})`;
    }
  } else if (snoozedTasks.length > 0) {
    const lines = snoozedTasks.slice(0, 5).map((t) => `• ${t.text}`);
    body = ["Tâches reportées à aujourd'hui :", ...lines].join("\n");

    if (snoozedTasks.length > 5) {
      body += `\n...et ${snoozedTasks.length - 5} autres`;
    }
  } else {
    body = "Tu n'as pas de tâches à faire aujourd'hui. Profite-en ! 🧠";
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "À Demain 📅",
      body,
      sound: "default",
    },
    trigger: tomorrow8h,
  });

  await AsyncStorage.setItem("dailyReminderId", id);
}

// Fonction pour annuler l'ancienne notification
export async function cancelPreviousReminder() {
  const storedId = await AsyncStorage.getItem("dailyReminderId");
  if (storedId) {
    await Notifications.cancelScheduledNotificationAsync(storedId);
    await AsyncStorage.removeItem("dailyReminderId");
  }
}

export async function ensureNotificationPermission() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== "granted") {
      Alert.alert(
        "Notifications désactivées",
        "Active-les dans les réglages pour recevoir tes rappels de tâches."
      );
      return false;
    }
  }
  return true;
}
