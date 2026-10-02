import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Layout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: "#08111f" },
        headerTintColor: "#fff",
        contentStyle: { backgroundColor: "#050b14" }
      }}>
        <Stack.Screen name="index" options={{ title: "Football Probability" }} />
        <Stack.Screen name="analyse" options={{ title: "Match Analysis" }} />
      </Stack>
    </>
  );
}
