/**
 * Tests de non-régression - NewTaskScreen (rendu + interactions)
 */
import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react-native";
import { KeyboardAvoidingView, Platform, Switch } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NewTaskScreen from "../../screens/NewTaskScreen";

const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ goBack: mockGoBack, navigate: mockNavigate }),
  useRoute: () => ({ params: undefined }),
}));

jest.mock("../../utils/notificationHelper", () => ({
  scheduleTaskNotification: jest.fn(() => Promise.resolve("notif-id")),
  cancelTaskNotification: jest.fn(() => Promise.resolve()),
  ensureNotificationPermission: jest.fn(() => Promise.resolve(true)),
}));

jest.mock("react-native-uuid", () => ({ v4: () => "uuid-123" }));

// Mock manuel __mocks__/@react-native-community/datetimepicker.js (triggers iOS + Android)
jest.mock("@react-native-community/datetimepicker");

describe("NewTaskScreen", () => {
  const previousOS = Platform.OS;

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  afterEach(() => {
    Platform.OS = previousOS;
  });

  describe("rendu (création)", () => {
    it("affiche le label pour une nouvelle tâche", () => {
      render(<NewTaskScreen />);
      expect(screen.getByText("Que veux-tu faire demain ?")).toBeOnTheScreen();
    });

    it("affiche le placeholder du champ texte", () => {
      render(<NewTaskScreen />);
      expect(
        screen.getByPlaceholderText(
          "Ex: Appeler Mamie, ranger le bureau..."
        )
      ).toBeOnTheScreen();
    });

    it("affiche le bouton Ajouter la tâche", () => {
      render(<NewTaskScreen />);
      expect(screen.getByText("Ajouter la tâche")).toBeOnTheScreen();
    });

    it("affiche le switch Activer un rappel", () => {
      render(<NewTaskScreen />);
      expect(screen.getByText("Activer un rappel")).toBeOnTheScreen();
    });
  });

  describe("interactions (création)", () => {
    it("met à jour le champ texte quand on saisit", () => {
      render(<NewTaskScreen />);
      const input = screen.getByPlaceholderText(
        "Ex: Appeler Mamie, ranger le bureau..."
      );
      fireEvent.changeText(input, "Appeler Mamie");
      expect(input.props.value).toBe("Appeler Mamie");
    });

    it("affiche une alerte et ne navigue pas si on valide avec champ vide", () => {
      const alertSpy = jest.spyOn(require("react-native").Alert, "alert");
      render(<NewTaskScreen />);
      fireEvent.press(screen.getByText("Ajouter la tâche"));
      expect(alertSpy).toHaveBeenCalledWith(
        "Oups",
        "Tu dois écrire quelque chose !"
      );
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(mockGoBack).not.toHaveBeenCalled();
      alertSpy.mockRestore();
    });

    it("sauvegarde la tâche et navigue vers Accueil après ajout", async () => {
      render(<NewTaskScreen />);
      const input = screen.getByPlaceholderText(
        "Ex: Appeler Mamie, ranger le bureau..."
      );
      fireEvent.changeText(input, "Nouvelle tâche");
      fireEvent.press(screen.getByText("Ajouter la tâche"));

      await screen.findByText("Ajouter la tâche"); // attendre que l’async soit traitée

      const stored = await AsyncStorage.getItem("tasks");
      const tasks = JSON.parse(stored || "[]");
      expect(tasks).toHaveLength(1);
      expect(tasks[0].text).toBe("Nouvelle tâche");
      expect(tasks[0].status).toBe("pending");
      expect(mockNavigate).toHaveBeenCalledWith("Retour", {
        screen: "Accueil",
      });
    });
  });

  describe("rendu (édition)", () => {
    it("affiche le mode édition quand route.params.task est fourni", () => {
      jest.spyOn(require("@react-navigation/native"), "useRoute").mockReturnValue({
        params: {
          task: {
            id: "edit-1",
            text: "Tâche à modifier",
            dueDate: new Date().toISOString(),
            notificationId: null,
          },
        },
      });

      render(<NewTaskScreen />);
      expect(screen.getByText("Que dois-tu faire ?")).toBeOnTheScreen();
      expect(screen.getByDisplayValue("Tâche à modifier")).toBeOnTheScreen();
      expect(screen.getByText("Modifier la tâche")).toBeOnTheScreen();

      jest.restoreAllMocks();
    });
  });

  describe("branches (rappel, édition, notification)", () => {
    it("affiche le TimePicker quand le switch rappel est activé", () => {
      render(<NewTaskScreen />);
      const switchEl = screen.getByRole("switch");
      fireEvent(switchEl, "valueChange", true);
      expect(screen.getByText(/Rappel à/)).toBeOnTheScreen();
    });

    it("TimePicker onChange sans date (Android dismiss) : ne plante pas (branche !selectedDate)", () => {
      const { DateTimePickerAndroid } = require("@react-native-community/datetimepicker");
      Platform.OS = "android";
      const { UNSAFE_root } = render(<NewTaskScreen />);
      // Sur Android, getByRole("switch") ne résout pas toujours AndroidSwitch
      fireEvent(UNSAFE_root.findByType(Switch), "valueChange", true);
      fireEvent.press(screen.getByText(/Rappel à/));
      expect(DateTimePickerAndroid.open).toHaveBeenCalled();
      const { onChange } = DateTimePickerAndroid.open.mock.calls[0][0];
      expect(() => onChange({ type: "dismissed" }, undefined)).not.toThrow();
    });

    it("KeyboardAvoidingView : behavior padding sur iOS, height sur Android", () => {
      Platform.OS = "ios";
      const { UNSAFE_root: rootIos } = render(<NewTaskScreen />);
      expect(
        rootIos.findByType(KeyboardAvoidingView).props.behavior
      ).toBe("padding");

      Platform.OS = "android";
      const { UNSAFE_root: rootAndroid } = render(<NewTaskScreen />);
      expect(
        rootAndroid.findByType(KeyboardAvoidingView).props.behavior
      ).toBe("height");
    });

    it("en édition, sauvegarde et appelle goBack (pas navigate)", async () => {
      const taskToEdit = {
        id: "edit-1",
        text: "Texte initial",
        dueDate: new Date().toISOString(),
        notificationId: null,
      };
      await AsyncStorage.setItem("tasks", JSON.stringify([taskToEdit]));

      jest.spyOn(require("@react-navigation/native"), "useRoute").mockReturnValue({
        params: { task: taskToEdit },
      });

      render(<NewTaskScreen />);
      fireEvent.press(screen.getByText("Modifier la tâche"));

      await screen.findByText("Modifier la tâche");

      expect(mockGoBack).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalledWith("Retour", expect.anything());
      jest.restoreAllMocks();
    });

    it("avec rappel activé, appelle ensureNotificationPermission et scheduleTaskNotification à l'ajout", async () => {
      const notificationHelper = require("../../utils/notificationHelper");
      render(<NewTaskScreen />);
      fireEvent.changeText(
        screen.getByPlaceholderText("Ex: Appeler Mamie, ranger le bureau..."),
        "Tâche avec rappel"
      );
      const switchEl = screen.getByRole("switch");
      fireEvent(switchEl, "valueChange", true);
      fireEvent.press(screen.getByText("Ajouter la tâche"));

      await screen.findByText("Ajouter la tâche");

      expect(notificationHelper.ensureNotificationPermission).toHaveBeenCalled();
      expect(notificationHelper.scheduleTaskNotification).toHaveBeenCalled();
    });

    it("annule la notification si le rappel est désactivé à l’enregistrement (édition)", async () => {
      const notificationHelper = require("../../utils/notificationHelper");
      const taskToEdit = {
        id: "edit-notif",
        text: "Avec rappel avant",
        dueDate: new Date().toISOString(),
        notificationId: "existing-notif-id",
      };
      await AsyncStorage.setItem("tasks", JSON.stringify([taskToEdit]));

      jest.spyOn(require("@react-navigation/native"), "useRoute").mockReturnValue({
        params: { task: taskToEdit },
      });

      render(<NewTaskScreen />);
      const switchEl = screen.getByRole("switch");
      fireEvent(switchEl, "valueChange", false);
      fireEvent.press(screen.getByText("Modifier la tâche"));

      await waitFor(() => {
        expect(notificationHelper.cancelTaskNotification).toHaveBeenCalledWith("existing-notif-id");
      });

      const stored = JSON.parse((await AsyncStorage.getItem("tasks")) || "[]");
      expect(stored[0].notificationId).toBeNull();
      jest.restoreAllMocks();
    });

    it("en édition avec rappel actif, annule l’ancienne notif puis reprogramme", async () => {
      const notificationHelper = require("../../utils/notificationHelper");
      const taskToEdit = {
        id: "edit-resched",
        text: "Reschedule",
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        notificationId: "old-notif",
      };
      await AsyncStorage.setItem("tasks", JSON.stringify([taskToEdit]));

      jest.spyOn(require("@react-navigation/native"), "useRoute").mockReturnValue({
        params: { task: taskToEdit },
      });

      render(<NewTaskScreen />);
      fireEvent.press(screen.getByText("Modifier la tâche"));

      await waitFor(() => {
        expect(notificationHelper.cancelTaskNotification).toHaveBeenCalledWith("old-notif");
        expect(notificationHelper.scheduleTaskNotification).toHaveBeenCalled();
      });
      jest.restoreAllMocks();
    });
  });
});
