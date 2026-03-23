/**
 * Logique de statut des tâches (HomeScreen) — branche snooze + branche simple.
 */
import { buildTasksAfterStatusChange } from "../../utils/applyHomeTaskStatus";

describe("buildTasksAfterStatusChange", () => {
  const tomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  };

  it("retourne null si l’id est inconnu", async () => {
    const out = await buildTasksAfterStatusChange({
      allTasks: [{ id: "1", text: "x", dueDate: new Date().toISOString(), status: "pending", snoozeCount: 0 }],
      id: "missing",
      status: "done",
      tomorrow,
      cancelTaskNotification: jest.fn(),
      scheduleTaskNotification: jest.fn(),
    });
    expect(out).toBeNull();
  });

  it("met seulement à jour le statut (branche non snooze)", async () => {
    const today = new Date();
    today.setHours(9, 30, 0, 0);
    const tasks = [
      {
        id: "t1",
        text: "Rappel",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
    ];
    const out = await buildTasksAfterStatusChange({
      allTasks: tasks,
      id: "t1",
      status: "done",
      tomorrow,
      cancelTaskNotification: jest.fn(),
      scheduleTaskNotification: jest.fn(),
    });
    expect(out).toHaveLength(1);
    expect(out[0].status).toBe("done");
    expect(out[0].snoozeCount).toBe(0);
  });

  it("ne modifie que la tâche ciblée dans le map (autres lignes inchangées)", async () => {
    const d = new Date("2025-06-01T12:00:00.000Z");
    const tasks = [
      {
        id: "a",
        text: "A",
        dueDate: d.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
      {
        id: "b",
        text: "B",
        dueDate: d.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: null,
      },
      {
        id: "c",
        text: "C",
        dueDate: d.toISOString(),
        status: "done",
        snoozeCount: 0,
        notificationId: null,
      },
    ];
    const out = await buildTasksAfterStatusChange({
      allTasks: tasks,
      id: "b",
      status: "abandoned",
      tomorrow,
      cancelTaskNotification: jest.fn(),
      scheduleTaskNotification: jest.fn(),
    });
    expect(out).toHaveLength(3);
    expect(out[0]).toEqual(tasks[0]);
    expect(out[1]).toEqual({ ...tasks[1], status: "abandoned" });
    expect(out[2]).toEqual(tasks[2]);
  });

  it("snooze : annule et replanifie la notif quand notificationId est défini", async () => {
    const today = new Date();
    today.setHours(14, 15, 0, 0);
    const cancel = jest.fn(() => Promise.resolve());
    const schedule = jest.fn(() => Promise.resolve("new-notif-id"));
    const tasks = [
      {
        id: "sn1",
        text: "Avec rappel",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 0,
        notificationId: "old-id",
      },
    ];
    const out = await buildTasksAfterStatusChange({
      allTasks: tasks,
      id: "sn1",
      status: "snoozed",
      tomorrow,
      cancelTaskNotification: cancel,
      scheduleTaskNotification: schedule,
    });
    expect(cancel).toHaveBeenCalledWith("old-id");
    expect(schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        text: "Avec rappel",
        dueDate: expect.any(Date),
      })
    );
    expect(out[0].notificationId).toBe("new-notif-id");
    expect(out[0].status).toBe("snoozed");
    expect(out[0].snoozeCount).toBe(1);
  });

  it("snooze sans notificationId : ne touche pas aux helpers de notif", async () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    const cancel = jest.fn();
    const schedule = jest.fn();
    const tasks = [
      {
        id: "sn2",
        text: "Sans rappel",
        dueDate: today.toISOString(),
        status: "pending",
        snoozeCount: 1,
        notificationId: null,
      },
    ];
    const out = await buildTasksAfterStatusChange({
      allTasks: tasks,
      id: "sn2",
      status: "snoozed",
      tomorrow,
      cancelTaskNotification: cancel,
      scheduleTaskNotification: schedule,
    });
    expect(cancel).not.toHaveBeenCalled();
    expect(schedule).not.toHaveBeenCalled();
    expect(out[0].status).toBe("snoozed");
    expect(out[0].snoozeCount).toBe(2);
  });

  it("snooze : map préserve les autres tâches telles quelles", async () => {
    const today = new Date("2025-06-02T08:00:00.000Z");
    const other = {
      id: "other",
      text: "Autre",
      dueDate: today.toISOString(),
      status: "pending",
      snoozeCount: 0,
      notificationId: null,
    };
    const toSnooze = {
      id: "snz",
      text: "Reporter",
      dueDate: today.toISOString(),
      status: "pending",
      snoozeCount: 0,
      notificationId: null,
    };
    const tasks = [other, toSnooze];
    const out = await buildTasksAfterStatusChange({
      allTasks: tasks,
      id: "snz",
      status: "snoozed",
      tomorrow,
      cancelTaskNotification: jest.fn(),
      scheduleTaskNotification: jest.fn(),
    });
    expect(out[0]).toEqual(other);
    expect(out[1].id).toBe("snz");
    expect(out[1].status).toBe("snoozed");
    expect(out[1].snoozeCount).toBe(1);
  });
});
