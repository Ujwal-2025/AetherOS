import React, { useState } from 'react';
import { View, Modal, Pressable, StyleSheet, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily, fontSize } from '../../theme';
import { AText } from '../ui/AText';
import { useCategoryStore, ICON_OPTIONS, COLOR_OPTIONS } from '../../store/useCategoryStore';

interface Props {
  visible:  boolean;
  onClose:  () => void;
}

export function ManageCategoriesModal({ visible, onClose }: Props) {
  const { categories, addCategory, deleteCategory } = useCategoryStore();

  const [newName,  setNewName]  = useState('');
  const [newColor, setNewColor] = useState(COLOR_OPTIONS[0]);
  const [newIcon,  setNewIcon]  = useState(ICON_OPTIONS[0]);

  function handleAdd() {
    if (!newName.trim()) return;
    addCategory({ name: newName.trim(), color: newColor, icon: newIcon });
    setNewName('');
    setNewColor(COLOR_OPTIONS[0]);
    setNewIcon(ICON_OPTIONS[0]);
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <AText variant="subheading" weight="bold">Manage Categories</AText>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.text.muted} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Existing categories */}
          <AText variant="label" color="muted" uppercase style={styles.sectionLabel}>Your Categories</AText>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.catRow}>
              <View style={[styles.catIcon, { backgroundColor: cat.color + '18', borderColor: cat.color + '35' }]}>
                <Ionicons name={cat.icon as keyof typeof Ionicons.glyphMap} size={18} color={cat.color} />
              </View>
              <AText variant="body" weight="semiBold" style={styles.catName}>{cat.name}</AText>
              <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
              <Pressable
                onPress={() => deleteCategory(cat.id)}
                style={styles.deleteBtn}
                disabled={categories.length <= 1}
              >
                <Ionicons name="trash-outline" size={16} color={categories.length <= 1 ? colors.text.faint : colors.danger.default} />
              </Pressable>
            </View>
          ))}

          {/* Add new */}
          <View style={styles.divider} />
          <AText variant="label" color="muted" uppercase style={styles.sectionLabel}>Add New Category</AText>

          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={setNewName}
            placeholder="Category name…"
            placeholderTextColor={colors.text.faint}
            maxLength={20}
          />

          {/* Color picker */}
          <AText variant="label" color="muted" style={styles.pickerLabel}>Color</AText>
          <View style={styles.colorGrid}>
            {COLOR_OPTIONS.map((c) => (
              <Pressable
                key={c}
                style={[styles.colorSwatch, { backgroundColor: c }, newColor === c && styles.colorSwatchActive]}
                onPress={() => setNewColor(c)}
              >
                {newColor === c && <Ionicons name="checkmark" size={14} color="#000" />}
              </Pressable>
            ))}
          </View>

          {/* Icon picker */}
          <AText variant="label" color="muted" style={styles.pickerLabel}>Icon</AText>
          <View style={styles.iconGrid}>
            {ICON_OPTIONS.map((ic) => (
              <Pressable
                key={ic}
                style={[styles.iconOption, newIcon === ic && { borderColor: newColor, backgroundColor: newColor + '18' }]}
                onPress={() => setNewIcon(ic)}
              >
                <Ionicons name={ic as keyof typeof Ionicons.glyphMap} size={20} color={newIcon === ic ? newColor : colors.text.muted} />
              </Pressable>
            ))}
          </View>

          {/* Preview + Save */}
          <View style={styles.previewRow}>
            <View style={[styles.previewChip, { borderColor: newColor + '50', backgroundColor: newColor + '15' }]}>
              <Ionicons name={newIcon as keyof typeof Ionicons.glyphMap} size={14} color={newColor} />
              <AText style={{ color: newColor, fontFamily: fontFamily.semiBold, fontSize: 13 }}>
                {newName.trim() || 'Preview'}
              </AText>
            </View>
            <Pressable
              style={[styles.addBtn, { opacity: newName.trim() ? 1 : 0.4 }]}
              onPress={handleAdd}
              disabled={!newName.trim()}
            >
              <AText style={styles.addBtnText}>Add Category</AText>
            </Pressable>
          </View>

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg.surface },
  handleBar:    { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border.strong, alignSelf: 'center', marginTop: spacing[3] },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  closeBtn:     { width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.bg.elevated, alignItems: 'center', justifyContent: 'center' },
  scroll:       { flex: 1 },
  scrollContent:{ padding: spacing[5], gap: spacing[4] },
  sectionLabel: { letterSpacing: 2, fontSize: 10, marginBottom: spacing[2] },
  catRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing[3], backgroundColor: colors.bg.elevated, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, padding: spacing[3] },
  catIcon:      { width: 36, height: 36, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  catName:      { flex: 1, color: colors.text.primary },
  colorDot:     { width: 10, height: 10, borderRadius: 5 },
  deleteBtn:    { padding: spacing[2] },
  divider:      { height: 1, backgroundColor: colors.border.subtle, marginVertical: spacing[2] },
  pickerLabel:  { fontSize: 11, letterSpacing: 1, marginBottom: spacing[2] },
  input:        { backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius.md, padding: spacing[4], color: colors.text.primary, fontFamily: fontFamily.regular, fontSize: fontSize.base },
  colorGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  colorSwatch:  { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  colorSwatchActive: { borderColor: colors.white, transform: [{ scale: 1.1 }] },
  iconGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  iconOption:   { width: 48, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.elevated },
  previewRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[2] },
  previewChip:  { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1 },
  addBtn:       { backgroundColor: colors.primary.container, paddingHorizontal: spacing[5], paddingVertical: spacing[3], borderRadius: radius.full },
  addBtnText:   { fontFamily: fontFamily.semiBold, fontSize: 14, color: colors.white },
});
