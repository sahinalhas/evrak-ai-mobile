import React, { useRef } from "react";
import { StyleSheet, View, Text, Animated, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator, BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { MessageSquare, FolderOpen, User } from "lucide-react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
  { name: "Sohbet",   label: "Sohbet",    Icon: MessageSquare },
  { name: "Belgeler", label: "Belgeler",   Icon: FolderOpen },
  { name: "Profil",   label: "Profil",     Icon: User },
];

function TabItem({ route, focused, onPress }: {
  route: any; focused: boolean; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const tab = TABS.find(t => t.name === route.name) ?? TABS[0];
  const Icon = tab.Icon;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 60, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 300, friction: 8, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1} style={s.tabItem}>
      <Animated.View style={[s.tabInner, { transform: [{ scale }] }]}>
        <View style={[s.iconWrap, focused && s.iconWrapActive]}>
          <Icon
            size={20}
            color={focused ? Colors.accent : Colors.label3}
            strokeWidth={focused ? 2.2 : 1.6}
          />
        </View>
        <Text style={[s.tabLabel, focused && s.tabLabelActive]}>
          {tab.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.tabBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={s.tabBorderTop} />
      {state.routes.map((route, i) => (
        <TabItem
          key={route.name}
          route={route}
          focused={state.index === i}
          onPress={() => { if (state.index !== i) navigation.navigate(route.name); }}
        />
      ))}
    </View>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Sohbet"
          tabBar={props => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Sohbet"   component={ChatScreen} />
          <Tab.Screen name="Belgeler" component={DocumentsScreen} />
          <Tab.Screen name="Profil"   component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabBorderTop: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
  },
  tabItem:  { flex: 1, alignItems: "center" },
  tabInner: { alignItems: "center", gap: 4, paddingVertical: 2 },
  iconWrap: {
    width: 48, height: 32,
    borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: Colors.accentLight,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: Colors.label3,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: Colors.accent,
    fontWeight: "600",
  },
});
