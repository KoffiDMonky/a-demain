/**
 * Le StyleSheet de HomeScreen lit Platform.OS au chargement du module.
 * Recharger le module avec Platform.OS = android couvre la branche paddingTop.
 */
import { Platform } from "react-native";

describe("HomeScreen (module sous Android)", () => {
  const os = Platform.OS;

  afterEach(() => {
    Platform.OS = os;
    jest.resetModules();
  });

  it("charge HomeScreen avec Platform.OS android (const safe area)", () => {
    Platform.OS = "android";
    jest.resetModules();
    require("../../screens/HomeScreen");
  });
});
