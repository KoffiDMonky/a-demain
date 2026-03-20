/**
 * Logique extraite de HomeScreen : mise à jour d'une tâche (snooze ou autre statut).
 * Permet de tester la branche « simple changement de statut » (non snooze).
 */
export async function buildTasksAfterStatusChange({
  allTasks,
  id,
  status,
  tomorrow,
  cancelTaskNotification,
  scheduleTaskNotification,
}) {
  let target = allTasks.find((t) => t.id === id);
  if (!target) return null;

  if (status === "snoozed") {
    const newDate = tomorrow();
    const old = new Date(target.dueDate);
    newDate.setHours(old.getHours(), old.getMinutes(), 0, 0);

    if (target.notificationId) {
      await cancelTaskNotification(target.notificationId);
      const idNotif = await scheduleTaskNotification({
        text: target.text,
        dueDate: newDate,
      });
      target = { ...target, notificationId: idNotif };
    }

    target = {
      ...target,
      status,
      snoozeCount: target.snoozeCount + 1,
      dueDate: newDate,
    };
  } else {
    target = { ...target, status };
  }

  return allTasks.map((t) => (t.id === id ? target : t));
}
