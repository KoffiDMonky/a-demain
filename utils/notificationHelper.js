import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fonction pour annuler l'ancienne notification
export async function cancelPreviousReminder() {
  const storedId = await AsyncStorage.getItem('dailyReminderId');
  if (storedId) {
    await Notifications.cancelScheduledNotificationAsync(storedId);
    await AsyncStorage.removeItem('dailyReminderId');
  }
}

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

  if (tasksForTomorrow && tasksForTomorrow.length > 0) {
    const lines = tasksForTomorrow.slice(0, 5).map((t) => `• ${t.text}`);
    body = ["Tes tâches du jour :", ...lines].join("\n");

    if (tasksForTomorrow.length > 5) {
      body += `\n...et ${tasksForTomorrow.length - 5} autres`;
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

  await AsyncStorage.setItem('dailyReminderId', id);
}
