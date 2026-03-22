import React from "react";
import { useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
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
    <View style={styles.itemWrap}>
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
        <View
          style={[
            styles.cardFace,
            task.status === "done" && styles.cardFaceDone,
          ]}
        >
          <TouchableOpacity
            style={styles.task}
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
        </View>
      </Swipeable>
    </View>
  );
};

export default TaskItem;

const styles = StyleSheet.create({
  itemWrap: {
    marginBottom: 12,
  },
  /** Face de carte qui glisse — les actions swipe restent derrière (hors de cette vue) */
  cardFace: {
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardFaceDone: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  task: {
    padding: 12,
    flexDirection: "row",
    gap: 10,
    minHeight: 55,
    alignItems: "center",
    backgroundColor: "transparent",
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
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  rightAction: {
    backgroundColor: "#FF2E54",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
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
