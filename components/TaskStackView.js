import React from "react";
import { View, Text, StyleSheet } from "react-native";

const CARD_OFFSET = 14;
const MAX_VISIBLE = 6;

/**
 * Affiche une pile de cartes (léger décalage vertical + échelle) — UX type “deck”.
 */
export default function TaskStackView({ items, renderCard, emptyText }) {
  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  const visible = items.slice(0, MAX_VISIBLE);
  const hiddenCount = items.length - visible.length;
  const stackHeight =
    56 + Math.max(0, visible.length - 1) * CARD_OFFSET + (hiddenCount > 0 ? 28 : 8);

  return (
    <View style={[styles.stackOuter, { minHeight: stackHeight }]}>
      {visible.map((item, index) => (
        <View
          key={item.id}
          style={[
            styles.cardLayer,
            {
              top: index * CARD_OFFSET,
              zIndex: visible.length - index,
              transform: [{ scale: 1 - index * 0.025 }],
            },
          ]}
        >
          <View style={styles.cardShadow}>{renderCard({ item, index })}</View>
        </View>
      ))}
      {hiddenCount > 0 ? (
        <Text style={styles.moreHint}>+{hiddenCount} autre(s)</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stackOuter: {
    width: "100%",
    marginBottom: 16,
    position: "relative",
  },
  cardLayer: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  cardShadow: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  emptyWrap: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    fontStyle: "italic",
    color: "#999",
    textAlign: "center",
  },
  moreHint: {
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
});
