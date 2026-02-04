import { useColorScheme } from "@/hooks/use-color-scheme";
import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#D4AF37",
        tabBarInactiveTintColor: "#C0C0C0",
        tabBarStyle: {
          backgroundColor: "#1B4D5C",
          borderTopColor: "#D4AF37",
          borderTopWidth: 2,
          height: 70,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Parlor",
          tabBarIcon: () => <Text style={{ fontSize: 28 }}>🎪</Text>,
        }}
      />
      <Tabs.Screen
        name="questionnaire"
        options={{
          title: "Divination",
          tabBarIcon: () => <Text style={{ fontSize: 28 }}>🔮</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Vault",
          tabBarIcon: () => <Text style={{ fontSize: 28 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}
