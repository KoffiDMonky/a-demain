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
import { getStoredTasks } from "../utils/storage";
import {
  scheduleTaskNotification,
  cancelTaskNotification,
  ensureNotificationPermission,
} from "../utils/notificationHelper";
import DateTimePicker from "@react-native-community/datetimepicker";
import TimePicker from "./../components/TimePicker";

const NewTaskScreen = () => {
  const [text, setText] = useState("");
  const navigation = useNavigation();
  const [enableReminder, setEnableReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState(
    new Date(new Date().setHours(8, 0, 0, 0))
  );

  const route = useRoute();
  const editingTask = route.params?.task;

  const addTask = async () => {
    if (text.trim().length === 0) {
      Alert.alert("Oups", "Tu dois écrire quelque chose !");
      return;
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(reminderTime.getHours(), reminderTime.getMinutes(), 0, 0);

    let allTasks = await getStoredTasks();
    let taskToSave;

    if (editingTask) {
      allTasks = allTasks.map((t) =>
        t.id === editingTask.id
          ? { ...t, text: text.trim(), dueDate: tomorrow }
          : t
      );
      taskToSave = allTasks.find((t) => t.id === editingTask.id);
    } else {
      taskToSave = {
        id: uuid.v4(),
        text: text.trim(),
        createdAt: new Date(),
        dueDate: tomorrow,
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      };
      allTasks.push(taskToSave);
    }

    if (enableReminder) {
      const ok = await ensureNotificationPermission();
      if (ok) {
        if (taskToSave.notificationId) {
          await cancelTaskNotification(taskToSave.notificationId);
        }
        const id = await scheduleTaskNotification(taskToSave);
        taskToSave.notificationId = id;
      }
    } else if (taskToSave.notificationId) {
      await cancelTaskNotification(taskToSave.notificationId);
      taskToSave.notificationId = null;
    }

    await AsyncStorage.setItem("tasks", JSON.stringify(allTasks));

    if (editingTask) {
      navigation.goBack();
    } else {
      navigation.navigate("Retour", { screen: "Demain" });
    }
  };

  useEffect(() => {
    if (editingTask) {
      setText(editingTask.text);
      setReminderTime(new Date(editingTask.dueDate));
      setEnableReminder(!!editingTask.notificationId);
    }
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          <Text style={styles.label}>
            {editingTask ? "Que dois-tu faire ?" : "Que veux-tu faire demain ?"}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Appeler Mamie, ranger le bureau..."
            value={text}
            onChangeText={setText}
            multiline
          />
          <View style={styles.reminderRow}>
            <Text style={styles.label}>Activer un rappel</Text>
            <Switch
              value={enableReminder}
              onValueChange={setEnableReminder}
              thumbColor={enableReminder ? "#FF2E54" : "#ccc"}
              trackColor={{ false: "#ddd", true: "#FFCDD2" }}
              ios_backgroundColor="#ccc"
            />
          </View>

          {enableReminder && (
            <>
              <TimePicker
                value={reminderTime}
                onChange={(event, selectedDate) => {
                  if (selectedDate) setReminderTime(selectedDate);
                }}
              />
            </>
          )}

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
  reminderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  timeButtonText: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 16,
  },
});
