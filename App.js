import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import TeamsScreen from './src/screens/TeamsScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import RulesScreen from './src/screens/RulesScreen';
import StandingsScreen from './src/screens/StandingsScreen';
import PlayerStatsScreen from './src/screens/PlayerStatsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              Teams: focused ? 'people' : 'people-outline',
              Schedule: focused ? 'calendar' : 'calendar-outline',
              Rules: focused ? 'document-text' : 'document-text-outline',
              Standings: focused ? 'podium' : 'podium-outline',
              Matchups: focused ? 'tennisball' : 'tennisball-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#667eea',
          tabBarInactiveTintColor: '#718096',
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e2e8f0',
            paddingBottom: 4,
          },
          headerStyle: { backgroundColor: '#667eea' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        })}
      >
        <Tab.Screen
          name="Teams"
          component={TeamsScreen}
          options={{ title: 'Teams', headerTitle: '🏆 KOC Season 2 – Teams' }}
        />
        <Tab.Screen
          name="Schedule"
          component={ScheduleScreen}
          options={{ title: 'Schedule', headerTitle: '📅 Schedule' }}
        />
        <Tab.Screen
          name="Rules"
          component={RulesScreen}
          options={{ title: 'Rules', headerTitle: '📋 Rules' }}
        />
        <Tab.Screen
          name="Standings"
          component={StandingsScreen}
          options={{ title: 'Standings', headerTitle: '📊 Standings' }}
        />
        <Tab.Screen
          name="Matchups"
          component={PlayerStatsScreen}
          options={{ title: 'Matchups', headerTitle: '🎾 Player Matchups' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
