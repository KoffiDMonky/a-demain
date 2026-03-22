/**
 * Tests de non-régression - utils/notificationHelper.js
 */
import * as Notifications from "expo-notifications";
import {
  scheduleTaskNotification,
  cancelTaskNotification,
  ensureNotificationPermission,
} from "../../utils/notificationHelper";

jest.mock("expo-notifications", () => ({
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

describe("notificationHelper", () => {
  /** Référence conservée avant que beforeEach ne fasse clearAllMocks sur les mocks */
  let handleNotificationFromModule;
  beforeAll(() => {
    expect(Notifications.setNotificationHandler).toHaveBeenCalled();
    const cfg = Notifications.setNotificationHandler.mock.calls[0][0];
    handleNotificationFromModule = cfg.handleNotification;
    expect(handleNotificationFromModule).toEqual(expect.any(Function));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handler de notifications (effet au chargement du module)", () => {
    it("handleNotification : alerte + son en foreground, pas de badge", async () => {
      const result = await handleNotificationFromModule();

      expect(result).toEqual({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      });
    });
  });

  describe("scheduleTaskNotification", () => {
    it("retourne null si la tâche n'a pas de dueDate", async () => {
      const result = await scheduleTaskNotification({ id: "1", text: "Test" });
      expect(result).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("retourne null si la date est dans le passé ou trop proche", async () => {
      const past = new Date(Date.now() - 60000);
      const result = await scheduleTaskNotification({
        id: "1",
        text: "Test",
        dueDate: past.toISOString(),
      });
      expect(result).toBeNull();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it("programme une notification et retourne un id si la date est valide", async () => {
      const future = new Date(Date.now() + 120_000);
      Notifications.scheduleNotificationAsync.mockResolvedValue("notif-id-123");

      const result = await scheduleTaskNotification({
        id: "1",
        text: "Rappel",
        dueDate: future.toISOString(),
      });

      expect(result).toBe("notif-id-123");
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({ title: "N'oublie pas 👀", body: "Rappel" }),
          trigger: expect.objectContaining({ type: "date" }),
        })
      );
    });

    it("retourne null si scheduleNotificationAsync lève une erreur", async () => {
      const future = new Date(Date.now() + 120_000);
      const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      Notifications.scheduleNotificationAsync.mockRejectedValue(new Error("fail"));

      const result = await scheduleTaskNotification({
        id: "1",
        text: "Rappel",
        dueDate: future.toISOString(),
      });

      expect(result).toBeNull();
      errSpy.mockRestore();
    });
  });

  describe("cancelTaskNotification", () => {
    it("n'appelle pas l'API si notificationId est null", async () => {
      await cancelTaskNotification(null);
      expect(Notifications.cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    });

    it("annule la notification si notificationId est fourni", async () => {
      Notifications.cancelScheduledNotificationAsync.mockResolvedValue();

      await cancelTaskNotification("notif-id-123");

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith("notif-id-123");
    });

    it("ne lève pas si cancelScheduledNotificationAsync échoue", async () => {
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      Notifications.cancelScheduledNotificationAsync.mockRejectedValue(new Error("cancel fail"));

      await expect(cancelTaskNotification("notif-id-err")).resolves.toBeUndefined();

      warnSpy.mockRestore();
    });
  });

  describe("ensureNotificationPermission", () => {
    it("retourne true si la permission est déjà accordée", async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: "granted" });

      const result = await ensureNotificationPermission();

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it("demande la permission et retourne true si accordée", async () => {
      Notifications.getPermissionsAsync.mockResolvedValue({ status: "undetermined" });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: "granted" });

      const result = await ensureNotificationPermission();

      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it("affiche une alerte et retourne false si la permission est refusée", async () => {
      const { Alert } = require("react-native");
      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
      Notifications.getPermissionsAsync.mockResolvedValue({ status: "denied" });
      Notifications.requestPermissionsAsync.mockResolvedValue({ status: "denied" });

      const result = await ensureNotificationPermission();

      expect(result).toBe(false);
      expect(alertSpy).toHaveBeenCalledWith(
        "Notifications désactivées",
        expect.any(String)
      );
      alertSpy.mockRestore();
    });
  });
});
