import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TasksScreen } from '../screens/TasksScreen';
import { FocusScreen } from '../screens/FocusScreen';
import { RewardsScreen } from '../screens/RewardsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MainTabParamList } from '../types';
import { useAchievementStore } from '../store/useAchievementStore';
import { useTaskStore } from '../store/useTaskStore';
import { useUserStore } from '../store/useUserStore';
import { AchievementToast } from '../components/shared/AchievementToast';
import { XPFlyOut } from '../components/shared/XPFlyOut';

const Tab = createBottomTabNavigator<MainTabParamList>();

// ─── Center Focus Button ──────────────────────────────────────────────────────

function FocusTabButton({ onPress, accessibilityState }: any) {
  const focused = accessibilityState?.selected;
  const glow = Platform.OS === 'web'
    ? { boxShadow: focused ? `0 0 20px 8px ${colors.primary.glow}` : `0 0 12px 4px rgba(183,109,255,0.25)` }
    : {};

  return (
    <Pressable onPress={onPress} style={styles.focusBtnWrapper}>
      <View style={[
        styles.focusBtn,
        { backgroundColor: focused ? colors.primary.container : colors.bg.surface },
        glow,
      ]}>
        <Ionicons name="timer-outline" size={26} color={focused ? colors.black : colors.primary.default} />
      </View>
      <AText style={[styles.focusLabel, { color: focused ? colors.primary.default : colors.text.faint }]}>
        Focus
      </AText>
    </Pressable>
  );
}

// ─── Tab bar label ────────────────────────────────────────────────────────────

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <AText style={[styles.tabLabel, { color: focused ? colors.primary.default : colors.text.faint }]}>
      {label}
    </AText>
  );
}

// ─── Navigator ────────────────────────────────────────────────────────────────

export function MainNavigator() {
  const { pendingUnlockQueue, dequeueUnlock } = useAchievementStore();
  const { resetDailyTasks } = useTaskStore();
  const { profile, addXP, checkAndUpdateStreak } = useUserStore();
  const [showLoginBonus, setShowLoginBonus] = useState(false);

  useEffect(() => {
    resetDailyTasks();
    const today = new Date().toISOString().split('T')[0];
    if (profile.lastActiveDate !== today) {
      checkAndUpdateStreak();
      addXP(25);
      setShowLoginBonus(true);
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor:   colors.primary.default,
        tabBarInactiveTintColor: colors.text.faint,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={focused ? colors.primary.default : colors.text.faint} />
              <TabLabel label="Home" focused={focused} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Tasks"
        component={TasksScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Ionicons name={focused ? 'list' : 'list-outline'} size={22} color={focused ? colors.primary.default : colors.text.faint} />
              <TabLabel label="Quests" focused={focused} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Focus"
        component={FocusScreen}
        options={{
          tabBarButton: (props) => <FocusTabButton {...props} />,
        }}
      />
      <Tab.Screen
        name="Rewards"
        component={RewardsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Ionicons name={focused ? 'ribbon' : 'ribbon-outline'} size={22} color={focused ? colors.primary.default : colors.text.faint} />
              <TabLabel label="Rewards" focused={focused} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabItem}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={focused ? colors.primary.default : colors.text.faint} />
              <TabLabel label="Profile" focused={focused} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
      <AchievementToast
        achievement={pendingUnlockQueue[0] ?? null}
        onHide={dequeueUnlock}
      />
      <XPFlyOut xp={25} color="#fbbf24" visible={showLoginBonus} onHide={() => setShowLoginBonus(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor:   colors.bg.surface,
    borderTopWidth:    1,
    borderTopColor:    colors.border.subtle,
    height:            72,
    paddingBottom:     8,
    paddingTop:        8,
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

  // Center Focus button
  focusBtnWrapper: {
    alignItems:     'center',
    justifyContent: 'flex-end',
    paddingBottom:  4,
    marginTop:      -18,
  },
  focusBtn: {
    width:        60,
    height:       60,
    borderRadius: 30,
    borderWidth:  1,
    borderColor:  colors.primary.default + '50',
    alignItems:   'center',
    justifyContent: 'center',
  },
  focusLabel: {
    fontFamily:    fontFamily.medium,
    fontSize:      9,
    letterSpacing: 0.5,
    marginTop:     4,
  },
});
