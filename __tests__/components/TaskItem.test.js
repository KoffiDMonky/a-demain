/**
 * Tests de non-régression - composant TaskItem
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import TaskItem from "../../components/TaskItem";

jest.mock("../../components/AnimatedCheckbox", () => {
  const { View } = require("react-native");
  return function MockCheckbox({ active }) {
    return <View testID={active ? "checkbox-done" : "checkbox-pending"} />;
  };
});

describe("TaskItem", () => {
  const defaultTask = {
    id: "task-1",
    text: "Faire les courses",
    status: "pending",
    snoozeCount: 0,
    dueDate: new Date().toISOString(),
  };

  it("affiche le texte de la tâche", () => {
    const onDone = jest.fn();
    const onSnooze = jest.fn();
    const onDelete = jest.fn();
    const onEdit = jest.fn();

    render(
      <TaskItem
        task={defaultTask}
        onDone={onDone}
        onSnooze={onSnooze}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    );

    expect(screen.getByText("Faire les courses")).toBeOnTheScreen();
  });

  it("appelle onDone au press quand la tâche est pending", () => {
    const onDone = jest.fn();
    render(
      <TaskItem
        task={defaultTask}
        onDone={onDone}
        onSnooze={jest.fn()}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    fireEvent.press(screen.getByText("Faire les courses"));
    expect(onDone).toHaveBeenCalledWith(defaultTask);
  });

  it("appelle onEdit au longPress quand la tâche est pending", () => {
    const onEdit = jest.fn();
    render(
      <TaskItem
        task={defaultTask}
        onDone={jest.fn()}
        onSnooze={jest.fn()}
        onDelete={jest.fn()}
        onEdit={onEdit}
      />
    );

    fireEvent(screen.getByText("Faire les courses"), "longPress");
    expect(onEdit).toHaveBeenCalledWith(defaultTask);
  });

  it("n'appelle pas onEdit au longPress quand la tâche est done", () => {
    const onEdit = jest.fn();
    const doneTask = { ...defaultTask, status: "done" };

    render(
      <TaskItem
        task={doneTask}
        onDone={jest.fn()}
        onSnooze={jest.fn()}
        onDelete={jest.fn()}
        onEdit={onEdit}
      />
    );

    fireEvent(screen.getByText("Faire les courses"), "longPress");
    expect(onEdit).not.toHaveBeenCalled();
  });
});
