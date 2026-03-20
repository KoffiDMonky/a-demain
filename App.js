import React, { useEffect } from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider } from "react-native-safe-area-context";

import HomeScreen from "./screens/HomeScreen";
import TomorrowScreen from "./screens/TomorrowScreen";
import StatsScreen from "./screens/StatsScreen";
import NewTaskScreen from "./screens/NewTaskScreen";
import PrivacyPolicyScreen from "./screens/PrivacyPolicyScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "./utils/notificationHelper";
import { ensureNotificationPermission } from "./utils/notificationHelper";
import { getTabBarIconName } from "./utils/tabBarIcons";

// import {
//   useFonts,
//   DancingScript_400Regular,
//   DancingScript_700Bold,
// } from '@expo-google-fonts/dancing-script';
//import AppLoading from 'expo-app-loading'; // ou SplashScreen si tu utilises Expo SDK 50+

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack pour l'ajout de tâche (exporté pour tests d’intégration navigation)
export function RootTabs() {
  const isIOS = Platform.OS === "ios";
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getTabBarIconName(route.name, focused);
          if (!iconName) return null;
          return (
            <Ionicons
              name={iconName}
              size={size}
              color={focused ? "#FF2E54" : "black"}
            />
          );
        },
        tabBarActiveTintColor: "#FF2E54",
        tabBarInactiveTintColor: "black",
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Demain" component={TomorrowScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      {isIOS &&
        <Tab.Screen name="Confidentialité" component={PrivacyPolicyScreen} />}
    </Tab.Navigator>
  );
}

export default function App() {
  // let [fontsLoaded] = useFonts({
  //   DancingScript_400Regular,
  //   DancingScript_700Bold,
  // });

  // if (!fontsLoaded) {
  //   return null;
  // }

  // useEffect(() => {
  //   // 1) Vérifier l’état actuel
  //   Notifications.getPermissionsAsync()
  //     .then(({ status }) => {
  //       if (status !== 'granted') {
  //         // 2) Demander la permission
  //         return Notifications.requestPermissionsAsync();
  //       }
  //       return { status };
  //     })
  //     .then(({ status }) => {
  //       if (status !== 'granted') {
  //         Alert.alert(
  //           "Notifications désactivées",
  //           "Activez-les dans les réglages pour recevoir les rappels matinaux."
  //         );
  //       }
  //     });
  // }, []);

  useEffect(() => {
    ensureNotificationPermission();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Retour"
              component={RootTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Nouvelle Tâche" component={NewTaskScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
