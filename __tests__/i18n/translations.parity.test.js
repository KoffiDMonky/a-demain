/**
 * Parité des clés FR / EN et présence des chaînes de motivation.
 */
import fr from "../../i18n/locales/fr";
import en from "../../i18n/locales/en";
import { MOTIVATION_MESSAGE_COUNT } from "../../i18n/index.js";

describe("i18n / translations — parité fr ↔ en", () => {
  it("les objets fr et en exposent exactement les mêmes clés", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(fr).sort());
  });

  it("chaque stats.motivation.i (0 … MOTIVATION_MESSAGE_COUNT-1) est non vide dans les deux langues", () => {
    for (let i = 0; i < MOTIVATION_MESSAGE_COUNT; i++) {
      const k = `stats.motivation.${i}`;
      expect(fr[k]).toBeDefined();
      expect(en[k]).toBeDefined();
      expect(String(fr[k]).trim().length).toBeGreaterThan(0);
      expect(String(en[k]).trim().length).toBeGreaterThan(0);
    }
  });

  it("échantillon de libellés anglais attendus (régression contenu)", () => {
    expect(en["tabs.home"]).toBe("Home");
    expect(en["tabs.privacy"]).toBe("Privacy");
    expect(en["stack.newTask"]).toBe("New Task");
    expect(en["home.today"]).toBe("Today");
    expect(en["newTask.submitAdd"]).toBe("Add task");
    expect(en["stats.successTitle"]).toBe("Achievements");
    expect(en["achievement.explorer.title"]).toBe("First step");
    expect(en["notification.taskTitle"]).toBe("Don\u2019t forget 👀");
    expect(en["privacy.title"]).toBe("Privacy policy");
    expect(en["timePicker.reminderAt"]).toBe("🕒 Reminder at {time}");
  });
});
