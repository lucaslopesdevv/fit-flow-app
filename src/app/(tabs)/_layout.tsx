import { Slot } from "expo-router"

export default function TabsLayout() {
  // Let AuthGate handle all routing logic
  // This layout just renders the appropriate child layout
  return <Slot />
}