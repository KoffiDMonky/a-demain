/**
 * Comportement de t() / getAppLanguage() selon expo-localization,
 * isolé du mock global fr de jest.setup.js.
 */
import enDict from "../../i18n/locales/en";

function loadI18nWithLanguageCode(languageCode) {
  let mod;
  jest.isolateModules(() => {
    jest.doMock("expo-localization", () => ({
      getLocales: () => [
        {
          languageCode,
          languageTag: languageCode === "en" ? "en-US" : "fr-FR",
        },
      ],
    }));
    mod = require("../../i18n/index.js");
  });
  return mod;
}

describe("i18n / t() selon la locale système", () => {
  it("locale en → getAppLanguage renvoie en et t() utilise les chaînes anglaises", () => {
    const { t, getAppLanguage, MOTIVATION_MESSAGE_COUNT } =
      loadI18nWithLanguageCode("en");
    expect(getAppLanguage()).toBe("en");
    expect(t("tabs.home")).toBe("Home");
    expect(t("home.progressTitle")).toBe(enDict["home.progressTitle"]);
    expect(t("newTask.alertEmpty")).toBe("You need to enter something!");
    expect(t("tomorrow.empty")).toBe("Nothing planned for tomorrow 😌");
    expect(t("stats.motivation.0")).toMatch(/forward|matters/i);
    const mid = Math.floor(MOTIVATION_MESSAGE_COUNT / 2);
    expect(t(`stats.motivation.${mid}`)).toBeTruthy();
  });

  it("locale en → interpolation des placeholders", () => {
    const { t } = loadI18nWithLanguageCode("en");
    expect(t("timePicker.reminderAt", { time: "9:30 AM" })).toBe(
      "🕒 Reminder at 9:30 AM"
    );
  });

  it("locale fr (hors mock global) → t() reste en français", () => {
    const { t, getAppLanguage } = loadI18nWithLanguageCode("fr");
    expect(getAppLanguage()).toBe("fr");
    expect(t("tabs.home")).toBe("Accueil");
    expect(t("newTask.submitAdd")).toBe("Ajouter la tâche");
  });

  it("locale es → fallback français (non en)", () => {
    const { t, getAppLanguage } = loadI18nWithLanguageCode("es");
    expect(getAppLanguage()).toBe("fr");
    expect(t("tabs.home")).toBe("Accueil");
  });

  it("clé absente → retourne la valeur FR puis la clé", () => {
    const { t } = loadI18nWithLanguageCode("en");
    expect(t("definitely.missing.key.123")).toBe("definitely.missing.key.123");
  });
});
