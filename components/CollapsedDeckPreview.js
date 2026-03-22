import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AnimatedCheckbox from "./AnimatedCheckbox";

/** Aligné sur TaskItem / TomorrowTaskItem — styles.cardFace */
const CARD = {
  radius: 14,
  bg: "#FFFFFF",
  bgBack: "#F3F4F6",
  border: "#E5E7EB",
  shadowColor: "#0F172A",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
};

/** Décalage vertical entre chaque carte */
const STEP_PX = 8;
/** Chaque carte sous la première est resserrée de N px à gauche et à droite (perspective / pyramide) */
const PERSPECTIVE_INSET = 5;
const MAX_LAYERS = 4;
const CARD_HEIGHT = 56;

/**
 * Section repliée : pile de cartes alignée sur l’UI ouverte.
 * @param {'today' | 'tomorrow'} variant — icône 1re carte : checkbox (auj.) ou sablier (demain)
 */
export default function CollapsedDeckPreview({
  items,
  emptyText,
  variant = "tomorrow",
  onPress,
  accessibilityLabel = "Déplier la section",
}) {
  if (!items || items.length === 0) {
    const emptyBlock = (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyPeekText}>{emptyText}</Text>
        </View>
      </View>
    );
    return wrapPressable(emptyBlock, onPress, accessibilityLabel);
  }

  const slice = items.slice(0, MAX_LAYERS);
  const stackHeight = CARD_HEIGHT + (slice.length - 1) * STEP_PX + 6;

  const deck = (
    <View style={[styles.deckOuter, { minHeight: stackHeight }]}>
      {slice.map((item, index) => {
        const isFront = index === 0;
        return (
          <View
            key={item.id}
            style={[
              styles.layer,
              {
                top: index * STEP_PX,
                left: index * PERSPECTIVE_INSET,
                right: index * PERSPECTIVE_INSET,
                zIndex: MAX_LAYERS - index,
                backgroundColor: isFront ? CARD.bg : CARD.bgBack,
                borderColor: isFront ? CARD.border : "#E8ECF0",
              },
              cardLayerShadow(index),
            ]}
          >
            {isFront ? (
              <View style={styles.frontRow}>
                {variant === "tomorrow" ? (
                  <LinearGradient
                    colors={["#0894FF", "#C959DD", "#FF2E54", "#FF9004"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientIcon}
                  >
                    <Ionicons name="hourglass" size={16} color="#fff" />
                  </LinearGradient>
                ) : (
                  <AnimatedCheckbox active={false} />
                )}
                <Text
                  style={styles.deckFrontText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {item.text}
                </Text>
                {items.length > MAX_LAYERS ? (
                  <View style={styles.badgeMore}>
                    <Text style={styles.badgeMoreText}>
                      +{items.length - MAX_LAYERS}
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.backPlaceholder}>
                <View style={styles.backShimmer} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  return wrapPressable(deck, onPress, accessibilityLabel);
}

function wrapPressable(node, onPress, accessibilityLabel) {
  if (!onPress) return node;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {node}
    </Pressable>
  );
}

function cardLayerShadow(depth) {
  if (depth === 0) {
    return {
      shadowOpacity: CARD.shadowOpacity,
      elevation: CARD.elevation,
    };
  }
  const fade = 1 - depth * 0.22;
  return {
    shadowOpacity: CARD.shadowOpacity * 0.32 * fade,
    shadowRadius: 5,
    elevation: Math.max(1, CARD.elevation - depth),
  };
}

const styles = StyleSheet.create({
  deckOuter: {
    width: "100%",
    marginBottom: 12,
    position: "relative",
  },
  /** largeur gérée par left/right (perspective) + top pour l’empilement */
  layer: {
    position: "absolute",
    height: CARD_HEIGHT,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: CARD.radius,
    borderWidth: 1,
    shadowColor: CARD.shadowColor,
    shadowOffset: CARD.shadowOffset,
    shadowRadius: CARD.shadowRadius,
    shadowOpacity: CARD.shadowOpacity,
    elevation: CARD.elevation,
    justifyContent: "center",
  },
  frontRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 4,
  },
  gradientIcon: {
    width: 24,
    height: 24,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  deckFrontText: {
    flex: 1,
    fontSize: 16,
    color: "#333333",
    fontWeight: "400",
  },
  backPlaceholder: {
    flex: 1,
    justifyContent: "center",
  },
  backShimmer: {
    height: 8,
    width: "42%",
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  badgeMore: {
    marginLeft: 4,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeMoreText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },
  emptyWrap: {
    marginBottom: 12,
  },
  emptyCard: {
    borderRadius: CARD.radius,
    backgroundColor: CARD.bg,
    borderWidth: 1,
    borderColor: CARD.border,
    borderStyle: "dashed",
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: "center",
    shadowColor: CARD.shadowColor,
    shadowOffset: CARD.shadowOffset,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyPeekText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#9CA3AF",
    textAlign: "center",
  },
});
