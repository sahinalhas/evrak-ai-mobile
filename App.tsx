import React from "react";
import { StyleSheet, View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MessageSquare, FolderOpen, User } from "lucide-react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Colors } from "./src/components/Theme";
import { ChatScreen } from "./src/screens/ChatScreen";
import { DocumentsScreen } from "./src/screens/DocumentsScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  const insets = useSafeAreaInsets();
  const baseHeight = Platform.OS === "ios" ? 88 : 64;
  const tabBarStyleComputed = {
    ...styles.tabBar,
    height: baseHeight + insets.bottom,
    paddingBottom: insets.bottom ? insets.bottom + (Platform.OS === "ios" ? 12 : 8) : Platform.OS === "ios" ? 28 : 10,
  };

  const tabLabelStyleComputed = {
    ...styles.tabLabel,
    marginBottom: Platform.OS === "ios" ? 0 : Math.min(insets.bottom, 8),
  };

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Sohbet"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: true,
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.mutedForeground,
          tabBarLabelStyle: tabLabelStyleComputed,
          tabBarStyle: tabBarStyleComputed,
          tabBarHideOnKeyboard: true,
          tabBarIcon: ({ color, size, focused }) => {
            const iconSize = focused ? 20 : 18;
            switch (route.name) {
              case "Sohbet":
                return <MessageSquare size={iconSize} color={color} />;
              case "Belgelerim":
                return <FolderOpen size={iconSize} color={color} />;
              case "Profilim":
                return <User size={iconSize} color={color} />;
              default:
                return null;
            }
          },
        })}
      >
        <Tab.Screen name="Sohbet" component={ChatScreen} />
        <Tab.Screen name="Belgelerim" component={DocumentsScreen} />
        <Tab.Screen name="Profilim" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_600SemiBold, Inter_700Bold });
  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Platform.OS === "ios" ? 88 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
    elevation: 8,
    shadowColor: Colors.foreground,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },
});
