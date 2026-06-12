import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { PlannerScreen } from '../screens/PlannerScreen';
import { RoadmapScreen } from '../screens/RoadmapScreen';
import { ArenaNavigator } from './ArenaNavigator';
import { MainTabParamList } from '../types';
import { useRoadmapStore } from '../store/useRoadmapStore';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <AText style={[styles.tabLabel, { color: focused ? colors.primary.default : colors.text.faint }]}>
      {label}
    </AText>
  );
}

export function MainNavigator() {
  const insets  = useSafeAreaInsets();
  const hasPlan = useRoadmapStore((s) => s.hasPlan);

  return (
    <Tab.Navigator
      initialRouteName={hasPlan ? 'Arena' : 'Planner'}
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: 64 + insets.bottom, paddingBottom: insets.bottom }],
        tabBarActiveTintColor:   colors.primary.default,
        tabBarInactiveTintColor: colors.text.faint,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Planner"
        component={PlannerScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Ionicons name={focused ? 'map' : 'map-outline'} size={22} color={focused ? colors.primary.default : colors.text.faint} />
              <TabLabel label="Planner" focused={focused} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Roadmap"
        component={RoadmapScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Ionicons name={focused ? 'git-branch' : 'git-branch-outline'} size={22} color={focused ? colors.primary.default : colors.text.faint} />
              <TabLabel label="Roadmap" focused={focused} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Arena"
        component={ArenaNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Ionicons name={focused ? 'game-controller' : 'game-controller-outline'} size={22} color={focused ? colors.primary.default : colors.text.faint} />
              <TabLabel label="Arena" focused={focused} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.bg.surface,
    borderTopWidth:  1,
    borderTopColor:  colors.border.subtle,
    paddingTop:      8,
  },
  tabItem: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:            3,
  },
  tabLabel: {
    fontFamily:    fontFamily.medium,
    fontSize:      9,
    letterSpacing: 0.5,
  },
});
