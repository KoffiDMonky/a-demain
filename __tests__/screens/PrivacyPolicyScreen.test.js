/**
 * Test de non-régression - écran Politique de confidentialité
 */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import PrivacyPolicyScreen from "../../screens/PrivacyPolicyScreen";

jest.spyOn(Linking, "openURL").mockImplementation(() => Promise.resolve());

describe("PrivacyPolicyScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("affiche le titre Politique de confidentialité", () => {
    render(<PrivacyPolicyScreen />);
    expect(screen.getByText("Politique de confidentialité")).toBeOnTheScreen();
  });

  it("affiche la section Respect de la vie privée", () => {
    render(<PrivacyPolicyScreen />);
    expect(screen.getByText("1. Respect de la vie privée")).toBeOnTheScreen();
  });

  it("affiche les sections Données stockées, Notifications, Droits", () => {
    render(<PrivacyPolicyScreen />);
    expect(screen.getByText("2. Données stockées")).toBeOnTheScreen();
    expect(screen.getByText("3. Notifications")).toBeOnTheScreen();
    expect(screen.getByText("4. Droits")).toBeOnTheScreen();
  });

  it("affiche les mentions légales et le lien politique complète", () => {
    render(<PrivacyPolicyScreen />);
    expect(screen.getByText("Mentions légales")).toBeOnTheScreen();
    expect(screen.getByText(/Voir la politique complète/)).toBeOnTheScreen();
  });

  it("affiche les sections Propriété intellectuelle et Contact", () => {
    render(<PrivacyPolicyScreen />);
    expect(screen.getByText("Propriété intellectuelle")).toBeOnTheScreen();
    expect(screen.getByText("Contact")).toBeOnTheScreen();
  });

  it("appelle openURL avec l'URL politique au press du lien politique complète", () => {
    render(<PrivacyPolicyScreen />);
    fireEvent.press(screen.getByText(/Voir la politique complète/));
    expect(Linking.openURL).toHaveBeenCalledWith("https://ademain.agenorhouessou.fr/privacy");
  });

  it("appelle openURL avec l'URL mentions légales au press du lien mentions légales", () => {
    render(<PrivacyPolicyScreen />);
    fireEvent.press(screen.getByText(/Voir les mentions légales/));
    expect(Linking.openURL).toHaveBeenCalledWith("https://ademain.agenorhouessou.fr/terms");
  });

  it("journalise une erreur si openURL échoue", async () => {
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    Linking.openURL.mockRejectedValueOnce(new Error("échec ouverture"));

    render(<PrivacyPolicyScreen />);
    fireEvent.press(screen.getByText(/Voir la politique complète/));

    await waitFor(() => {
      expect(errSpy).toHaveBeenCalledWith(
        "Impossible d'ouvrir l'URL :",
        expect.any(Error)
      );
    });
    errSpy.mockRestore();
    Linking.openURL.mockImplementation(() => Promise.resolve());
  });
});
