import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "./screens/HomeScreen";
import TomorrowScreen from "./screens/TomorrowScreen";
import StatsScreen from "./screens/StatsScreen";
import NewTaskScreen from "./screens/NewTaskScreen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import {
  useFonts,
  DancingScript_400Regular,
  DancingScript_700Bold,
} from '@expo-google-fonts/dancing-script';
//import AppLoading from 'expo-app-loading'; // ou SplashScreen si tu utilises Expo SDK 50+


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack pour l'ajout de tâche
function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === "Accueil")
            iconName = focused ? "home" : "home-outline";
          else if (route.name === "Demain")
            iconName = focused ? "calendar" : "calendar-outline";
          else if (route.name === "Stats")
            iconName = focused ? "bar-chart" : "bar-chart-outline";
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
    </Tab.Navigator>
  );
}

export default function App() {

  let [fontsLoaded] = useFonts({
    DancingScript_400Regular,
    DancingScript_700Bold,
  });
  
  if (!fontsLoaded) {
    return null; // ou une vue temporaire si tu préfères
  }
    
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
