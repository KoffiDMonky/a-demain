import React from "react";
import { useRef } from "react";
import { Text, StyleSheet, TouchableOpacity, View, Alert } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { RectButton } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import AnimatedCheckbox from "./../components/AnimatedCheckbox.js"; // adapte le chemin si besoin

const TaskItem = ({ task, onDone, onSnooze, onDelete, onEdit }) => {
  const swipeableRef = useRef(null);

  const renderLeftActions = () => (
    <RectButton style={styles.leftAction} onPress={() => onSnooze(task)}>
      <Ionicons name="time-outline" size={24} color="#fff" />
    </RectButton>
  );

  const renderRightActions = () => (
    <RectButton style={styles.rightAction} onPress={() => onDelete(task)}>
      <Ionicons name="trash-outline" size={24} color="#fff" />
    </RectButton>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={
        task.status !== "done" ? renderLeftActions : undefined
      }
      renderRightActions={
        task.status !== "done" ? renderRightActions : undefined
      }
      enabled={task.status !== "done"}
    >
      <TouchableOpacity
        style={[styles.task, task.status === "done" && styles.taskDone]}
        onPress={() => onDone(task)}
        onLongPress={() => {
          if (task.status !== "done") onEdit(task);
        }}
        activeOpacity={0.8}
      >
        <AnimatedCheckbox active={task.status === "done"} />
        <Text
          style={[
            styles.taskText,
            task.status === "done" && styles.taskTextDone,
          ]}
        >
          {task.text}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );
  
};

export default TaskItem;

const styles = StyleSheet.create({
  task: {
    padding: 12,
    flexDirection: "row",
    gap: 10,
    minHeight: 55,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  taskText: {
    fontSize: 16,
    color: "#333",
    width: "95%",
    marginTop: 5,
  },
  taskTextDone: {
    textDecorationLine: "line-through",
    color: "#888",
  },
  leftAction: {
    backgroundColor: "#0894FF",
    justifyContent: "center",
    alignItems: "center",
    width: 60,
    marginBottom: 10,
  },
  rightAction: {
    backgroundColor: "#FF2E54",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    marginBottom: 10,
  },
  checkbox: {
    borderRadius: 30,
    borderColor: "#4CAF50",
    borderWidth: 2,
    width: 25,
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#4CAF50",
  },
});
