import React, { useRef } from "react";
import { StyleSheet, View, Text, Platform, Animated, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MessageSquare, FolderOpen, User } from "lucide-react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Shadows } from "./src/components/Theme";
import { ChatScreen } from "./src/screens/ChatScreen";
import { DocumentsScreen } from "./src/screens/DocumentsScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

const Tab = createBottomTabNavigator();

const TABS = [
  { name: "Sohbet", label: "Sohbet", Icon: MessageSquare },
  { name: "Belgelerim", label: "Belgelerim", Icon: FolderOpen },
  { name: "Profilim", label: "Profilim", Icon: User },
];

// Single tab item with its own animation ref
function TabItem({ route, isFocused, onPress }: { route: any; isFocused: boolean; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];
  const Icon = tab.Icon;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={styles.tabItem}>
      <Animated.View style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}>
        {isFocused ? (
          <LinearGradient
            colors={Colors.gradientPrimary as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tabActiveIcon}
          >
            <Icon size={18} color="#fff" />
          </LinearGradient>
        ) : (
          <View style={styles.tabInactiveIcon}>
            <Icon size={18} color={Colors.mutedForeground} />
          </View>
        )}
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>{tab.label}</Text>
        {isFocused && <View style={styles.tabDot} />}
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      {state.routes.map((route, index) => (
        <TabItem
          key={route.name}
          route={route}
          isFocused={state.index === index}
          onPress={() => {
            if (state.index !== index) navigation.navigate(route.name);
          }}
        />
      ))}
    </View>
  );
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Sohbet"
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Sohbet" component={ChatScreen} />
        <Tab.Screen name="Belgelerim" component={DocumentsScreen} />
        <Tab.Screen name="Profilim" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    paddingHorizontal: 8,
    ...Shadows.md,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabInner: {
    alignItems: "center",
    gap: 3,
    minWidth: 56,
  },
  tabActiveIcon: {
    width: 42,
    height: 36,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  tabInactiveIcon: {
    width: 42,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.mutedForeground,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: "700",
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
});
