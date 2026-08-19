import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// 1. Importando todas as telas da pasta admin
import { HomeScreen } from './HomeScreen';
import { VanScreen } from './VanScreen';
import { StudentsScreen } from './StudentsScreen';
import { ApprovalsScreen } from './ApprovalsScreen';

const Tab = createBottomTabNavigator();

export function AdminDashboard() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, 
        tabBarActiveTintColor: '#2563EB', 
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Van') {
            iconName = focused ? 'bus' : 'bus-outline';
          } else if (route.name === 'Alunos') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Aprovações') {
            iconName = focused ? 'lock-closed' : 'lock-closed-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      {/* 2. Registrando as telas na ordem que vão aparecer no menu inferior */}
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Van" component={VanScreen} />
      <Tab.Screen name="Alunos" component={StudentsScreen} />
      <Tab.Screen name="Aprovações" component={ApprovalsScreen} />
    </Tab.Navigator>
  );
}