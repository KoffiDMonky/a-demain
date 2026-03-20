import React, { useRef } from "react";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import Swipeable, {
  SwipeDirection,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import { RectButton } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const TomorrowTaskItem = ({ item, onDelete, onEdit }) => {
  const swipeableRef = useRef(null);

  const handleSwipeOpen = (direction) => {
    if (direction === SwipeDirection.RIGHT) {
      onDelete(item.id);
      swipeableRef.current?.close();
    }
  };

  const renderRightActions = () => (
    <RectButton style={styles.rightAction} onPress={() => onDelete(item.id)}>
      <Ionicons name="trash-outline" size={24} color="#fff" />
    </RectButton>
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
    >
      <TouchableOpacity
        style={styles.taskRow}
        onLongPress={() => onEdit(item)}
      >
        <LinearGradient
          colors={["#0894FF", "#C959DD", "#FF2E54", "#FF9004"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientCheckbox}
        >
          <Ionicons name="hourglass" size={16} color="#fff" />
        </LinearGradient>
        <Text style={styles.text}>{item.text}</Text>
      </TouchableOpacity>
    </Swipeable>
  );
};

export default TomorrowTaskItem;

const styles = StyleSheet.create({
  taskRow: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 12,
    gap: 10,
    minHeight: 55,
    alignItems: "center",
  },
  text: {
    flex: 1, // prend tout l'espace dispo
    fontSize: 16,
    marginTop: 5,
    //color: "#333",
  },
  rightAction: {
    backgroundColor: "#FF2E54",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    marginBottom: 10,
  },
  gradientCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
