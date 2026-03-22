/**
 * Icônes onglets — logique extraite de App.js (RootTabs / Tab.Navigator)
 */
import { getTabBarIconName } from "../../utils/tabBarIcons";

describe("getTabBarIconName", () => {
  describe("Accueil", () => {
    it("focused", () => {
      expect(getTabBarIconName("Accueil", true, "ios")).toBe("home");
    });
    it("non focused", () => {
      expect(getTabBarIconName("Accueil", false, "android")).toBe("home-outline");
    });
  });

  describe("Stats", () => {
    it("focused", () => {
      expect(getTabBarIconName("Stats", true, "android")).toBe("bar-chart");
    });
    it("non focused", () => {
      expect(getTabBarIconName("Stats", false, "android")).toBe("bar-chart-outline");
    });
  });

  describe("Confidentialité", () => {
    it("iOS focused", () => {
      expect(getTabBarIconName("Confidentialité", true, "ios")).toBe(
        "information-circle"
      );
    });
    it("iOS non focused", () => {
      expect(getTabBarIconName("Confidentialité", false, "ios")).toBe(
        "information-circle-outline"
      );
    });
    it("Android : pas d’icône dédiée (onglet absent de l’UI)", () => {
      expect(getTabBarIconName("Confidentialité", true, "android")).toBeUndefined();
    });
  });

  it("route inconnue → undefined", () => {
    expect(getTabBarIconName("Inconnu", true, "ios")).toBeUndefined();
  });
});
