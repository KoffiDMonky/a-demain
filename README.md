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
