/**
 * Tests de non-régression - composant TimePicker
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import TimePicker from "../../components/TimePicker";

const mockOnChange = jest.fn();

jest.mock("@react-native-community/datetimepicker");

describe("TimePicker", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("affiche le bouton avec l'heure formatée", () => {
    const value = new Date(2025, 0, 1, 8, 15);
    render(<TimePicker value={value} onChange={mockOnChange} />);
    expect(screen.getByText(/Rappel à 08:15/)).toBeOnTheScreen();
  });

  it("au press ouvre le picker sur iOS", () => {
    const value = new Date(2025, 0, 1, 8, 0);
    render(<TimePicker value={value} onChange={mockOnChange} />);
    fireEvent.press(screen.getByText(/Rappel à/));
    expect(screen.getByTestId("datetime-picker-ios")).toBeOnTheScreen();
  });

  it("appelle onChange quand une date est sélectionnée (iOS)", () => {
    const value = new Date(2025, 0, 1, 8, 0);
    render(<TimePicker value={value} onChange={mockOnChange} />);
    fireEvent.press(screen.getByText(/Rappel à/));
    const trigger = screen.getByTestId("picker-trigger-change");
    fireEvent(trigger, "touchEnd");
    expect(mockOnChange).toHaveBeenCalledWith(expect.any(Object), expect.any(Date));
  });

  it("n'appelle pas onChange si selectedDate est absent (iOS)", () => {
    mockOnChange.mockClear();
    const value = new Date(2025, 0, 1, 8, 0);
    render(<TimePicker value={value} onChange={mockOnChange} />);
    fireEvent.press(screen.getByText(/Rappel à/));
    fireEvent(screen.getByTestId("picker-trigger-no-date"), "touchEnd");
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it("sur Android appelle DateTimePickerAndroid.open au press", () => {
    const { DateTimePickerAndroid } = require("@react-native-community/datetimepicker");
    const Platform = require("react-native").Platform;
    Platform.OS = "android";
    const value = new Date(2025, 0, 1, 9, 30);
    render(<TimePicker value={value} onChange={mockOnChange} />);
    fireEvent.press(screen.getByText(/Rappel à 09:30/));
    expect(DateTimePickerAndroid.open).toHaveBeenCalledWith(
      expect.objectContaining({
        value,
        mode: "time",
        is24Hour: true,
        display: "default",
        onChange: mockOnChange,
      })
    );
    Platform.OS = "ios";
  });
});
