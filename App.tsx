import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 1. Importando todas as telas que criamos
import { LoginScreen } from './src/screens/LoginScreen';
import { AdminDashboard } from './src/screens/admin/AdminDashboard';
import { StudentDashboard } from './src/screens/StudentDashboard'; // <-- Faltava essa importação!

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        
        {/* 2. Avisando o mapa que essa tela existe! */}
        <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}