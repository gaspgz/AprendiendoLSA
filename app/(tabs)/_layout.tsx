import CustomTabBar from "@/components/CustomTabBar";
import { Tabs } from "expo-router";
import { View } from "react-native";

// Este backgroundColor le da color a la status bar (arriba) y al
// home indicator (abajo) en iOS — hereda del padre más cercano
export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "#C8D3F5" }}>
      <Tabs
        tabBar={() => <CustomTabBar />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="senas" options={{ title: "Señas" }} />
        <Tabs.Screen name="perfil" options={{ title: "Perfil" }} />
      </Tabs>
    </View>
  );
}
