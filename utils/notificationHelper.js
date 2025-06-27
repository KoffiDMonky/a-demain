import * as Notifications from "expo-notifications";
import { Alert } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // affiche l'alerte en foreground
    shouldPlaySound: true, // joue le son si défini
    shouldSetBadge: false, // ne change pas l'icône de l'app
  }),
});

// Programme une notification locale pour une tâche
export async function scheduleTaskNotification(task) {
  if (!task?.dueDate) return null;

  const triggerDate = new Date(task.dueDate);
  const now = Date.now();

  if (triggerDate.getTime() <= now + 60_000) {
    console.warn("⛔ Notification trop proche ou passée");
    return null;
  }

  try {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "N'oublie pas 👀",
        body: task.text,
        sound: "default",
      },
      trigger: {
        type: "date",
        date: triggerDate,
      },
    });
  } catch (err) {
    console.error("Erreur scheduleNotif:", err);
    return null;
  }
}

// Annule une notification planifiée
export async function cancelTaskNotification(notificationId) {
  if (notificationId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (e) {
      console.warn("Unable to cancel notification", e);
    }
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
