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
  { name: "Sohbet",    label: "Sohbet",    Icon: MessageSquare },
  { name: "Belgeler",  label: "Belgelerim", Icon: FolderOpen },
  { name: "Profilim",  label: "Profil",    Icon: User },
];

function TabItem({
  route,
  isFocused,
  onPress,
}: {
  route: any;
  isFocused: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];
  const Icon = tab.Icon;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 60, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 260, friction: 8, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={1}
      style={styles.tabItem}
    >
      <Animated.View style={[styles.tabInner, { transform: [{ scale }] }]}>
        <View style={[styles.tabIconWrap, isFocused && styles.tabIconWrapActive]}>
          <Icon
            size={20}
            color={isFocused ? Colors.primary : Colors.labelTertiary}
            strokeWidth={isFocused ? 2.2 : 1.6}
          />
        </View>
        <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
          {tab.label}
        </Text>
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
      <NavigationContainer>
        <Tab.Navigator
          initialRouteName="Sohbet"
          tabBar={(props) => <CustomTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Sohbet" component={ChatScreen} />
          <Tab.Screen name="Belgeler" component={DocumentsScreen} />
          <Tab.Screen name="Profilim" component={ProfileScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: Colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.separator,
    paddingTop: 8,
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
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 12,
  },
  tabIconWrap: {
    width: 48,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tabIconWrapActive: {
    backgroundColor: Colors.accentLight,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.labelTertiary,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    color: Colors.primary,
  },
});
