import { Tabs } from "expo-router"
import MaterialIcons from '@expo/vector-icons/MaterialIcons'

export default function StudentTabsLayout() {
  // AuthGate already handles authentication and role checking
  // No need for additional checks here

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#6200ee",
        tabBarInactiveTintColor: "#666",
        headerShown: true,
        headerStyle: {
          backgroundColor: "#6200ee",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: "Home",
          headerTitle: "FitFlow - Student",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="workouts" 
        options={{ 
          title: "Workouts",
          headerTitle: "My Workouts",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="fitness-center" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="exercises" 
        options={{ 
          title: "Exercises",
          headerTitle: "Exercises",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="list" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="notifications" 
        options={{ 
          title: "Notifications",
          headerTitle: "Notifications",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="notifications" size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: "Profile",
          headerTitle: "My Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }} 
      />
    </Tabs>
  )
}