import React, { useState, useEffect } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import uuid from "react-native-uuid";
import * as Notifications from "expo-notifications";
// import { getNotificationTrigger } from "../utils/notification.js";
// import DateTimePicker from "@react-native-community/datetimepicker";

// Configure le handler pour les notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const NewTaskScreen = () => {
  const [text, setText] = useState("");
  const navigation = useNavigation();
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(
    new Date(new Date().setHours(8, 0, 0, 0))
  );

  const route = useRoute();
  const editingTask = route.params?.task;

  useEffect(() => {
    if (editingTask) {
      setText(editingTask.text);
      setReminderTime(new Date(editingTask.dueDate));
      setEnableReminder(!!editingTask.notificationId);
    }
    registerForPushNotificationsAsync();
  }, []);

  // Demande les permissions de notifications
  const registerForPushNotificationsAsync = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Erreur",
        "Désolé, les permissions de notifications sont nécessaires!"
      );
    }
  };

  const addTask = async () => {
    if (text.trim().length === 0) {
      Alert.alert("Oups", "Tu dois écrire quelque chose !");
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); //
    tomorrow.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0);

    const stored = await AsyncStorage.getItem("tasks");
    const allTasks = stored ? JSON.parse(stored) : [];

    let updatedTasks;

    if (editingTask) {
      updatedTasks = allTasks.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              text: text.trim(),
              dueDate: editingTask.dueDate,
              notificationId: null, // on peut la replanifier ensuite
            }
          : t
      );
    } else {
      const newTask = {
        id: uuid.v4(),
        text: text.trim(),
        createdAt: new Date(),
        dueDate: tomorrow,
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      };
      updatedTasks = [...allTasks, newTask];
      if (enableReminder) await scheduleNotification(newTask);
    }

    await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));

    if (editingTask) {
      navigation.goBack();
    } else {
      navigation.navigate("Retour", { screen: "Demain" });
    }
  };

  // Programme une notification avec un rappel à 8h00 demain matin
  const scheduleNotification = async (task) => {
    const timestamp = task.dueDate.getTime();

    if (timestamp <= Date.now() + 60_000) {
      console.warn("⛔ La date de notification est trop proche ou passée");
      return;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Rappel de tâche",
        body: task.text,
        sound: true,
      },
      trigger: {
        type: "date",
        timestamp,
      },
    });

    task.notificationId = notificationId;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.label}>{editingTask ? "Que dois-tu faire ?" : "Que veux-tu faire demain ?"}</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Appeler Mamie, ranger le bureau..."
            value={text}
            onChangeText={setText}
            multiline
          />
          {/* <View style={styles.reminderRow}>
            <Text style={styles.label}>Activer un rappel</Text>
            <Switch
              value={enableReminder}
              onValueChange={setEnableReminder}
              thumbColor={enableReminder ? "#FF2E54" : "#ccc"}
            />
          </View>

          {enableReminder && (
            <>
              <Text style={styles.timeButtonText}>⏰ Heure du rappel :</Text>
              <DateTimePicker
                value={reminderTime}
                mode="time"
                display="default"
                onChange={(event, selectedDate) => {
                  if (selectedDate) setReminderTime(selectedDate);
                }}
              />
            </>
          )} */}

          <TouchableOpacity style={styles.button} onPress={addTask}>
            <Text style={styles.buttonText}>
              {editingTask ? "Modifier la tâche" : "Ajouter la tâche"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default NewTaskScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    //justifyContent: "center",
   //backgroundColor: 'red'
  },
  label: { fontSize: 20, marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: "top",
  },
  button: {
    backgroundColor: "#FF2E54",
    padding: 14,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
});
