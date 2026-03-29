import React from "react";
import {
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { t } from "../i18n";

const PrivacyPolicyScreen = () => {
  const openURL = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error(t("privacy.consoleOpenUrlFailed"), err)
    );
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          paddingTop:
            Platform.OS === "android" ? StatusBar.currentHeight : 0,
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{t("privacy.title")}</Text>

        <Text style={styles.sectionTitle}>{t("privacy.s1.title")}</Text>
        <Text style={styles.paragraph}>
          {t("privacy.s1.before")}
          <Text style={styles.bold}>{t("app.brand")}</Text>
          {t("privacy.s1.after")}
        </Text>

        <Text style={styles.sectionTitle}>{t("privacy.s2.title")}</Text>
        <Text style={styles.paragraph}>{t("privacy.s2.body")}</Text>

        <Text style={styles.sectionTitle}>{t("privacy.s3.title")}</Text>
        <Text style={styles.paragraph}>{t("privacy.s3.body")}</Text>

        <Text style={styles.sectionTitle}>{t("privacy.s4.title")}</Text>
        <Text style={styles.paragraph}>{t("privacy.s4.body")}</Text>

        <TouchableOpacity
          onPress={() => openURL("https://ademain.agenorhouessou.fr/privacy")}
        >
          <Text style={styles.link}>{t("privacy.linkFullPolicy")}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{t("privacy.legalTitle")}</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>{t("privacy.legalLabelAppName")}</Text>{" "}
          {t("app.brand")}
          {"\n"}
          <Text style={styles.bold}>{t("privacy.legalLabelEditor")}</Text>{" "}
          Agénor Houessou{"\n"}
          <Text style={styles.bold}>{t("privacy.legalLabelEmail")}</Text>{" "}
          agenorhouessou@hotmail.fr{"\n"}
          <Text style={styles.bold}>{t("privacy.legalLabelTech")}</Text>{" "}
          {t("privacy.legalTechValue")}
        </Text>

        <TouchableOpacity
          onPress={() => openURL("https://ademain.agenorhouessou.fr/terms")}
        >
          <Text style={styles.link}>{t("privacy.linkTerms")}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t("privacy.ipTitle")}</Text>
        <Text style={styles.paragraph}>{t("privacy.ipBody")}</Text>

        <Text style={styles.sectionTitle}>{t("privacy.contactTitle")}</Text>
        <Text style={styles.paragraph}>{t("privacy.contactBody")}</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 16,
    color: "#FF2E54",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
    color: "#333",
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
  },
  bold: {
    fontWeight: "bold",
  },
  link: {
    fontSize: 16,
    color: "#FF2E54",
    textDecorationLine: "underline",
  },
});
