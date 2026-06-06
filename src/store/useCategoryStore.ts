import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CategoryConfig {
  id:        string;
  name:      string;
  color:     string;
  icon:      string;
  isDefault: boolean;
}

export const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { id: 'work',     name: 'Work',     color: '#ddb7ff', icon: 'briefcase-outline', isDefault: true },
  { id: 'health',   name: 'Health',   color: '#adc6ff', icon: 'fitness-outline',   isDefault: true },
  { id: 'learning', name: 'Learning', color: '#10B981', icon: 'book-outline',      isDefault: true },
  { id: 'personal', name: 'Personal', color: '#f59e0b', icon: 'person-outline',    isDefault: true },
];

export const ICON_OPTIONS: string[] = [
  'briefcase-outline', 'fitness-outline', 'book-outline', 'person-outline',
  'code-slash-outline', 'musical-notes-outline', 'home-outline', 'car-outline',
  'wallet-outline', 'heart-outline', 'game-controller-outline', 'restaurant-outline',
  'medkit-outline', 'school-outline', 'trophy-outline', 'leaf-outline',
  'rocket-outline', 'brush-outline', 'camera-outline', 'globe-outline',
];

export const COLOR_OPTIONS: string[] = [
  '#ddb7ff', '#adc6ff', '#10B981', '#f59e0b',
  '#ef4444', '#3b82f6', '#ec4899', '#14b8a6',
  '#f97316', '#8b5cf6', '#06b6d4', '#84cc16',
];

interface CategoryState {
  categories:     CategoryConfig[];
  addCategory:    (cat: Omit<CategoryConfig, 'id' | 'isDefault'>) => void;
  deleteCategory: (id: string) => void;
  getCategory:    (id: string) => CategoryConfig | undefined;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      categories: DEFAULT_CATEGORIES,

      addCategory: (cat) => {
        const id = cat.name.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now().toString(36);
        set((state) => ({ categories: [...state.categories, { ...cat, id, isDefault: false }] }));
      },

      deleteCategory: (id) => {
        set((state) => {
          const filtered = state.categories.filter((c) => c.id !== id);
          return { categories: filtered.length > 0 ? filtered : state.categories };
        });
      },

      getCategory: (id) => get().categories.find((c) => c.id === id),
    }),
    {
      name:       'aetheros-categories',
      storage:    createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ categories: state.categories }),
    }
  )
);
