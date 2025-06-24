import React from "react";
import {
  TouchableOpacity,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Linking,
} from "react-native";

const PrivacyPolicyScreen = () => {
  const openURL = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error("Impossible d'ouvrir l'URL :", err)
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Politique de confidentialité</Text>

        <Text style={styles.sectionTitle}>1. Respect de la vie privée</Text>
        <Text style={styles.paragraph}>
          L’application <Text style={styles.bold}>À Demain</Text> respecte ta
          vie privée. Aucune donnée personnelle n’est collectée, stockée ou
          transmise à des tiers. Toutes les informations saisies (tâches,
          historiques, préférences) restent strictement locales sur ton
          appareil.
        </Text>

        <Text style={styles.sectionTitle}>2. Données stockées</Text>
        <Text style={styles.paragraph}>
          Les tâches, les séries et les statistiques sont sauvegardées
          localement sur ton téléphone à l’aide du système de stockage sécurisé
          d’Expo/React Native. Aucune donnée n’est transférée vers un serveur
          externe.
        </Text>

        <Text style={styles.sectionTitle}>3. Notifications</Text>
        <Text style={styles.paragraph}>
          L’app peut t’envoyer des rappels si tu actives les notifications. Sur
          iOS, elles sont totalement locales. Sur Android, l’envoi de
          notifications utilise le service Firebase Cloud Messaging (FCM),
          fourni par Google. Cela implique que certains identifiants techniques
          (comme le token de notification ou l’ID de l’appareil) sont transmis à
          Google pour permettre l’acheminement des notifications. Ces données ne
          sont pas utilisées par l’application À Demain à d’autres fins, ne sont
          ni collectées, ni stockées, ni revendues. Tu peux désactiver les
          notifications à tout moment dans les réglages de ton téléphone.
        </Text>

        <Text style={styles.sectionTitle}>4. Droits</Text>
        <Text style={styles.paragraph}>
          Tu peux supprimer tes données en désinstallant l’application. Aucun
          compte ni service distant n’est utilisé, tu restes maître de tes
          données.
        </Text>

        <TouchableOpacity
          onPress={() => openURL("https://ademain.agenorhouessou.fr/privacy")}
        >
          <Text style={styles.link}>📎 Voir la politique complète</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Mentions légales</Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Nom de l’application :</Text> À Demain{"\n"}
          <Text style={styles.bold}>Éditeur :</Text> Agénor Houessou{"\n"}
          <Text style={styles.bold}>E-mail :</Text> agenorhouessou@hotmail.fr
          {"\n"}
          <Text style={styles.bold}>Technologies :</Text> Expo, React Native,
          EAS
          <TouchableOpacity
            onPress={() => openURL("https://ademain.agenorhouessou.fr/terms")}
          >
            <Text style={styles.link}>📎 Voir les mentions légales</Text>
          </TouchableOpacity>
        </Text>

        <Text style={styles.sectionTitle}>Propriété intellectuelle</Text>
        <Text style={styles.paragraph}>
          Tous les contenus textuels, visuels et fonctionnels de l’app sont
          protégés par les droits d’auteur. Toute reproduction, même partielle,
          est interdite sans autorisation écrite.
        </Text>

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.paragraph}>
          Pour toute question, suggestion ou réclamation :{"\n"}
          📩 agenorhouessou@hotmail.com
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyPolicyScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
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
