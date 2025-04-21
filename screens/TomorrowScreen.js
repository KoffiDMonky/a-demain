import React, { useEffect, useState } from "react";
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
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import TomorrowTaskItem from "../components/TomorrowTaskItem.js";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

const TomorrowScreen = ({ navigation }) => {
  const [tomorrowTasks, setTomorrowTasks] = useState([]);

  useEffect(() => {
    loadTomorrowTasks();
  }, []);

  const loadTomorrowTasks = async () => {
    const data = await AsyncStorage.getItem("tasks");
    const tasks = data ? JSON.parse(data) : [];

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filtered = tasks.filter((t) =>
      isSameDay(new Date(t.dueDate), tomorrow)
    );
    setTomorrowTasks(filtered);
  };

  const isSameDay = (d1, d2) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}h${m}`;
  };

  const deleteTask = async (taskId) => {
    const stored = await AsyncStorage.getItem("tasks");
    let tasks = stored ? JSON.parse(stored) : [];

    // Retrouver la tâche
    const task = tasks.find((t) => t.id === taskId);

    // Si elle a une notification planifiée, on l’annule
    if (task?.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(task.notificationId);
    }

    // Supprimer la tâche
    tasks = tasks.filter((t) => t.id !== taskId);
    await AsyncStorage.setItem("tasks", JSON.stringify(tasks));

    // Recharger l’affichage
    loadTomorrowTasks();
  };

  const renderItem = ({ item }) => (
    <TomorrowTaskItem
      item={item}
      onDelete={deleteTask}
      onEdit={(task) => navigation.navigate("Nouvelle Tâche", { task })}
    />
  );

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadTomorrowTasks();
    }
  }, [isFocused]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
        <Image
            source={require("../assets/Logo_Header.png")} // ← adapte ce chemin selon l'endroit où tu mets le fichier
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Tâches prévues pour demain</Text>
        <FlatList
          data={tomorrowTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ flexGrow: 1 }}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Rien de prévu pour demain 😌</Text>
            </View>
          }
        />
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("Nouvelle Tâche")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TomorrowScreen;

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 5, paddingHorizontal : 20, backgroundColor: "#fff" },
  header: {
    alignItems: "center",
    marginBottom: 10,
    justifyContent: "space-between"
  },
  logo: {
    width: 160,
    height: 40,
    marginRight: 8,
  },  
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#4CAF50",
    letterSpacing: 1,
  },

  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10
 },
  text: { fontSize: 16 },
  empty: {
    textAlign: "center",
    fontStyle: "italic",
    color: "#999",
    marginTop: 40,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    backgroundColor: "#fff", // couleur de fond souhaitée
  },
  taskRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  delete: {
    fontSize: 18,
    color: "red",
    paddingLeft: 10,
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
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#FF2E54",
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.3,
    // shadowRadius: 3,
    //elevation: 5,
  },
});
