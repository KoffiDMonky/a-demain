/**
 * Tests - CollapsedDeckPreview (vide, defaults, pile, wrapPressable)
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import CollapsedDeckPreview from "../../components/CollapsedDeckPreview";

jest.mock("../../components/AnimatedCheckbox", () => {
  const { View } = require("react-native");
  return function MockCheckbox({ active }) {
    return <View testID={active ? "checkbox-done" : "checkbox-pending"} />;
  };
});

jest.mock("expo-linear-gradient", () => {
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children, ...props }) => (
      <View testID="linear-gradient-mock" {...props}>
        {children}
      </View>
    ),
  };
});

describe("CollapsedDeckPreview", () => {
  const oneTask = [{ id: "1", text: "Une tâche", status: "pending" }];

  it("affiche l’état vide quand items est null ou []", () => {
    const { rerender } = render(
      <CollapsedDeckPreview items={null} emptyText="Rien ici" />
    );
    expect(screen.getByText("Rien ici")).toBeOnTheScreen();

    rerender(<CollapsedDeckPreview items={[]} emptyText="Liste vide" />);
    expect(screen.getByText("Liste vide")).toBeOnTheScreen();
  });

  it("sans onPress, l’état vide n’est pas dans un bouton", () => {
    render(
      <CollapsedDeckPreview items={[]} emptyText="Pas cliquable" />
    );
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByText("Pas cliquable")).toBeOnTheScreen();
  });

  it("état vide : onPress + libellé d’accessibilité par défaut", () => {
    const onPress = jest.fn();
    render(
      <CollapsedDeckPreview
        items={[]}
        emptyText="Touche pour ouvrir"
        onPress={onPress}
      />
    );
    const btn = screen.getByRole("button", { name: "Déplier la section" });
    fireEvent.press(btn);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("état vide : onPress avec accessibilityLabel personnalisé", () => {
    const onPress = jest.fn();
    render(
      <CollapsedDeckPreview
        items={[]}
        emptyText="Hint"
        onPress={onPress}
        accessibilityLabel="Ouvrir la section test"
      />
    );
    fireEvent.press(
      screen.getByRole("button", { name: "Ouvrir la section test" })
    );
    expect(onPress).toHaveBeenCalled();
  });

  it("sans variant explicite, utilise le mode demain (dégradé sablier)", () => {
    render(
      <CollapsedDeckPreview items={oneTask} emptyText="x" />
    );
    expect(screen.getByTestId("linear-gradient-mock")).toBeOnTheScreen();
    expect(screen.getByText("Une tâche")).toBeOnTheScreen();
  });

  it("variant today : tâche pending affiche la checkbox non cochée", () => {
    render(
      <CollapsedDeckPreview
        variant="today"
        items={oneTask}
        emptyText="x"
      />
    );
    expect(screen.getByTestId("checkbox-pending")).toBeOnTheScreen();
    expect(screen.queryByTestId("linear-gradient-mock")).toBeNull();
  });

  it("variant today : tâche done sur le devant — checkbox cochée", () => {
    render(
      <CollapsedDeckPreview
        variant="today"
        items={[{ id: "d", text: "Fait", status: "done" }]}
        emptyText="x"
      />
    );
    expect(screen.getByTestId("checkbox-done")).toBeOnTheScreen();
  });

  it("affiche le badge +N quand il y a plus de 4 tâches", () => {
    const many = [1, 2, 3, 4, 5, 6].map((n) => ({
      id: `t${n}`,
      text: `Tâche ${n}`,
      status: "pending",
    }));
    render(
      <CollapsedDeckPreview variant="today" items={many} emptyText="x" />
    );
    expect(screen.getByText("+2")).toBeOnTheScreen();
  });

  it("pile sans onPress : pas de Pressable", () => {
    render(
      <CollapsedDeckPreview variant="today" items={oneTask} emptyText="x" />
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("pile avec onPress : déclenche le callback", () => {
    const onPress = jest.fn();
    render(
      <CollapsedDeckPreview
        variant="today"
        items={oneTask}
        emptyText="x"
        onPress={onPress}
        accessibilityLabel="Déplier aujourd’hui"
      />
    );
    fireEvent.press(screen.getByRole("button", { name: "Déplier aujourd’hui" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
