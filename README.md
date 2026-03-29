# 🌅 À Demain — Ton compagnon quotidien anti-procrastination

[![Made with Expo](https://img.shields.io/badge/Made%20with-Expo-1B1F23?style=for-the-badge&logo=expo)](https://expo.dev/@agenorhouessou/a-demain)
[![React Native](https://img.shields.io/badge/React%20Native-2025-blue.svg?style=for-the-badge&logo=react)](https://reactnative.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Platform: iOS & Android](https://img.shields.io/badge/platform-iOS%20%7C%20Android-brightgreen?style=for-the-badge&logo=apple&logoColor=white)]()

---

**À Demain** est une application mobile minimaliste conçue pour t’aider à accomplir les tâches qui comptent *aujourd’hui*, en t’encourageant doucement, un jour après l’autre.  
Chaque journée réussie te rapproche de ton objectif, et une belle flamme 🔥 suit ta série de jours productifs.

---

## ✨ Fonctionnalités principales

- ✅ **Gestion des tâches journalières**
- 🔁 **Tâches d’aujourd’hui et de demain** sur l’onglet Accueil (barre d’avancement ; tâches en cartes ; repli/dépli par section avec illusion de pile)
- 🔥 **Système de série (streak)** avec animation de flamme
- 📊 **Statistiques** : progression, pourcentage de rappels, record de série, etc.
- 🕒 **Notification quotidienne** pour te rappeler tes tâches du jour
- 🎉 **Animation de célébration** lorsque toutes les tâches du jour sont complétées
- 🧘 **Interface simple et fluide**, pensée pour la concentration

---

## 🧪 Prototype

Cette version est une **première version fonctionnelle (MVP)**.  
Elle est publiée via **Expo** et testable facilement :

📱 Tester l'app : [expo.dev/a-demain](https://expo.dev/@agenorhouessou/a-demain)  
*(ou scanner le QR code depuis l'app Expo Go)*

### Publier une mise à jour (Expo Go sans `expo start`)

Le projet est configuré pour **EAS Update** (`updates.url` + `runtimeVersion` dans `app.json`).  
Après un `eas update`, le bundle JS est servi par Expo : tu peux ouvrir le projet dans **Expo Go** depuis [ta page projet](https://expo.dev/accounts/agenorhouessou/projects/a-demain) sans serveur local.

1. **Connexion** (une fois) : `npx eas-cli login`
2. **Publier** sur le canal `preview` (aligné avec `eas.json`) :
   ```bash
   npm run eas:update:preview -- --message "Description de la version"
   ```
   Ou production : `npm run eas:update:production -- --message "…"`
3. Sur le téléphone : **Expo Go** → onglet **Projets** / lien depuis **expo.dev** → ouvre **À Demain** ; l’app télécharge la dernière mise à jour du canal correspondant.

> **Note :** `runtimeVersion` dans `app.json` doit rester compatible avec la version d’**Expo Go** (SDK). Après une montée de version Expo, incrémente `version` / `runtimeVersion` si besoin. Si tu ajoutes du code natif non supporté par Expo Go, il faudra un build **EAS Build** (dev client ou store), pas seulement `eas update`.

### Build Android APK (EAS Build)

Un **APK** installable (test / partage interne) est produit avec le profil **`preview`** de `eas.json` (`buildType: apk`, canal `preview`).

1. Connexion (une fois) : `npx eas-cli login`
2. Lancer le build sur les serveurs Expo :
   ```bash
   npm run eas:build:android:apk
   ```
   Équivalent direct : `eas build --platform android --profile preview`
3. Suivre le lien affiché dans le terminal ou ouvrir [expo.dev](https://expo.dev) → **Builds** : télécharger l’**APK** une fois le build terminé.

**APK « production »** (même canal `production` que les mises à jour OTA, build release en APK — pas le `.aab` Play Store) :

```bash
npm run eas:build:android:apk:production
```

Équivalent : `eas build --platform android --profile production-apk`

> Le profil **`production`** (sans suffixe) génère un **Android App Bundle** (`.aab`) pour le Play Store. Le profil **`production-apk`** reprend `autoIncrement` + canal `production` avec `buildType: apk` pour installation directe.

### Google Play Store — fichier à importer

La **Play Console** attend un **App Bundle** (fichier **`.aab`**), pas un APK. Si tu vois *« Importez un app bundle valide »*, c’est en général que tu as importé un **`.apk`** (profil `preview` ou `production-apk`).

1. Générer le bon artefact :
   ```bash
   npm run eas:build:android:play
   ```
   (équivalent : `eas build --platform android --profile production`)
2. Télécharger le **`.aab`** depuis [expo.dev → ton projet → Builds](https://expo.dev).
3. Dans la Play Console : **Production** (ou test interne) → **Créer une nouvelle version** → importer ce **`.aab`**.

Ensuite tu peux automatiser l’envoi avec `eas submit --platform android --latest` (compte Google Play lié).

---

## 🧪 Tests automatisés

Voir **[README_TESTS.md](./README_TESTS.md)** (Jest, React Native Testing Library, structure `__tests__/`, commandes).

---

## 🛠️ Stack technique

- **React Native** via **Expo**
- **AsyncStorage** pour la persistance des données
- **Lottie** pour les animations
- **react-native-gesture-handler** pour les actions swipe
- **expo-notifications** pour la notification quotidienne

---

## 📂 Organisation du code

a-demain/ ├── components/ # TaskItem, CollapsedDeckPreview, TomorrowTaskItem… ├── screens/ # HomeScreen (aujourd’hui + demain), StatsScreen… ├── utils/ # storage.js, notificationHelper.js… ├── assets/ # Animations, images └── App.js # Entrée principale


---

## 🚧 Fonctionnalités prévues

- [ ] Tâches récurrentes
- [ ] Statut "snoozed" avec limite personnalisée
- [ ] Partage de série / motivation avec amis
- [ ] Mode focus (sans distraction)
- [ ] Export des données

---

## 👨‍💻 Auteur

Développé par **Agénor Houessou**  
🧠 Idée, design & code  
📍 Pontivy, Bretagne

---

## 📜 Licence

Ce projet est open-source et disponible sous la licence MIT.
