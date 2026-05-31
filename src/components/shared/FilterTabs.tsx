import React from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { AText } from '../ui/AText';

interface Tab {
  key:    string;
  label:  string;
  count?: number;
}

interface FilterTabsProps {
  tabs:      Tab[];
  activeKey: string;
  onSelect:  (key: string) => void;
}

export function FilterTabs({ tabs, activeKey, onSelect }: FilterTabsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onSelect(tab.key)}
          >
            <AText
              style={[
                styles.label,
                { color: isActive ? colors.primary.default : colors.text.muted },
              ]}
            >
              {tab.label}
            </AText>
            {tab.count !== undefined && (
              <View style={[styles.badge, isActive && styles.badgeActive]}>
                <AText style={[styles.count, { color: isActive ? colors.primary.default : colors.text.faint }]}>
                  {tab.count}
                </AText>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: {
    paddingHorizontal: spacing[5],
    paddingVertical:   spacing[3],
    gap:               spacing[2],
  },
  tab: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing[2],
    paddingHorizontal: spacing[4],
    paddingVertical:   spacing[2],
    borderRadius:      radius.full,
    borderWidth:       1,
    borderColor:       colors.border.default,
  },
  tabActive: {
    borderColor:     colors.primary.default + '50',
    backgroundColor: colors.primary.faint,
  },
  label: {
    fontFamily: fontFamily.semiBold,
    fontSize:   12,
    letterSpacing: 0.3,
  },
  badge: {
    minWidth:          16,
    height:            16,
    borderRadius:      8,
    backgroundColor:   colors.bg.elevated,
    alignItems:        'center',
    justifyContent:    'center',
    paddingHorizontal: 4,
  },
  badgeActive: { backgroundColor: colors.primary.default + '25' },
  count: { fontSize: 10, fontFamily: fontFamily.bold },
});
