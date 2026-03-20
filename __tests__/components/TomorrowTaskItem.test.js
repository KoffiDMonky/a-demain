/**
 * Tests de non-régression - composant TomorrowTaskItem
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import TomorrowTaskItem from "../../components/TomorrowTaskItem";

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MockLinearGradient = ({ children }) =>
    React.createElement(View, { testID: "linear-gradient" }, children);
  return { __esModule: true, LinearGradient: MockLinearGradient };
});

describe("TomorrowTaskItem", () => {
  const defaultItem = {
    id: "tomorrow-1",
    text: "Réunion demain 9h",
    dueDate: new Date(2025, 0, 2, 9, 0).toISOString(),
    status: "pending",
  };

  it("affiche le texte de la tâche", () => {
    const onDelete = jest.fn();
    const onEdit = jest.fn();

    render(
      <TomorrowTaskItem
        item={defaultItem}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText("Réunion demain 9h")).toBeOnTheScreen();
  });

  it("appelle onEdit au longPress", () => {
    const onEdit = jest.fn();
    render(
      <TomorrowTaskItem
        item={defaultItem}
        onDelete={jest.fn()}
        onEdit={onEdit}
      />
    );

    fireEvent(screen.getByText("Réunion demain 9h"), "longPress");
    expect(onEdit).toHaveBeenCalledWith(defaultItem);
  });

  it("affiche l'icône hourglass (via mock)", () => {
    render(
      <TomorrowTaskItem
        item={defaultItem}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    expect(screen.getByTestId("icon-hourglass")).toBeOnTheScreen();
  });

  it("appelle onDelete avec l'id au press du bouton supprimer (right action)", () => {
    const onDelete = jest.fn();
    render(
      <TomorrowTaskItem
        item={defaultItem}
        onDelete={onDelete}
        onEdit={jest.fn()}
      />
    );

    const deleteButton = screen.getByTestId("icon-trash-outline");
    fireEvent.press(deleteButton);
    expect(onDelete).toHaveBeenCalledWith("tomorrow-1");
  });

  it("appelle onDelete au swipe ouvert vers la droite (onSwipeableOpen)", () => {
    const onDelete = jest.fn();
    render(
      <TomorrowTaskItem
        item={defaultItem}
        onDelete={onDelete}
        onEdit={jest.fn()}
      />
    );

    fireEvent(screen.getByTestId("swipe-open-simulate"), "touchEnd");
    expect(onDelete).toHaveBeenCalledWith("tomorrow-1");
  });
});
