import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";
import { Advantage, DiceCounts } from "./store";
import { RollDamageComponent } from "../types/RollDamageComponent";

export type { RollDamageComponent };

export interface SavedRoll {
  id: string;
  name: string;
  group: string;
  counts: Partial<DiceCounts>;
  bonus: number;
  advantage: Advantage;
  isDamage?: boolean;
  damageType?: string;
  damageComponents?: RollDamageComponent[];
}

interface SavedRollsState {
  groups: string[];
  favoriteGroups: string[];
  groupColors: Record<string, string>;
  savedRolls: SavedRoll[];
  addRoll: (roll: Omit<SavedRoll, "id">) => void;
  removeRoll: (id: string) => void;
  editRoll: (id: string, updates: Partial<Omit<SavedRoll, "id">>) => void;
  addGroup: (name: string) => void;
  removeGroup: (name: string) => void;
  renameGroup: (oldName: string, newName: string) => void;
  toggleFavoriteGroup: (name: string) => void;
  setGroupColor: (name: string, color: string) => void;
  importRolls: (data: { groups: string[]; savedRolls: SavedRoll[]; groupColors?: Record<string, string> }) => void;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export const useSavedRollsStore = create<SavedRollsState>()(
  persist(
    immer((set) => ({
      groups: ["Ataques", "Daño", "Salvaciones"],
      favoriteGroups: ["Ataques", "Daño"],
      groupColors: {
        Ataques: "#f59e0b",
        Daño: "#ef4444",
        Salvaciones: "#3b82f6",
      },
      savedRolls: [
        {
          id: "def-1",
          name: "Espada Larga (Ataque)",
          group: "Ataques",
          counts: { D20: 1 },
          bonus: 5,
          advantage: null,
        },
        {
          id: "def-2",
          name: "Espada Larga (Daño)",
          group: "Daño",
          counts: { D8: 1 },
          bonus: 3,
          advantage: null,
          isDamage: true,
        },
      ],

      setGroupColor(name, color) {
        set((state) => {
          if (!state.groupColors) state.groupColors = {};
          state.groupColors[name] = color;
        });
      },

      addRoll(roll) {
        set((state) => {
          if (!state.groups.includes(roll.group)) {
            state.groups.push(roll.group);
          }
          state.savedRolls.push({ ...roll, id: generateId() });
        });
      },

      removeRoll(id) {
        set((state) => {
          state.savedRolls = state.savedRolls.filter((r) => r.id !== id);
        });
      },

      editRoll(id, updates) {
        set((state) => {
          const index = state.savedRolls.findIndex((r) => r.id === id);
          if (index !== -1) {
            state.savedRolls[index] = { ...state.savedRolls[index], ...updates };
          }
        });
      },

      addGroup(name) {
        set((state) => {
          if (!state.groups.includes(name)) {
            state.groups.push(name);
          }
        });
      },

      removeGroup(name) {
        set((state) => {
          state.groups = state.groups.filter((g) => g !== name);
          state.favoriteGroups = state.favoriteGroups.filter((g) => g !== name);
          state.savedRolls = state.savedRolls.filter((r) => r.group !== name);
        });
      },

      renameGroup(oldName, newName) {
        set((state) => {
          const index = state.groups.indexOf(oldName);
          if (index !== -1) {
            state.groups[index] = newName;
          }
          const favIndex = state.favoriteGroups.indexOf(oldName);
          if (favIndex !== -1) {
            state.favoriteGroups[favIndex] = newName;
          }
          if (state.groupColors?.[oldName]) {
            state.groupColors[newName] = state.groupColors[oldName];
            delete state.groupColors[oldName];
          }
          state.savedRolls.forEach((roll) => {
            if (roll.group === oldName) {
              roll.group = newName;
            }
          });
        });
      },

      toggleFavoriteGroup(name) {
        set((state) => {
          if (state.favoriteGroups.includes(name)) {
            state.favoriteGroups = state.favoriteGroups.filter((g) => g !== name);
          } else {
            state.favoriteGroups.push(name);
          }
        });
      },

      importRolls(data) {
        set((state) => {
          if (Array.isArray(data.groups)) {
            data.groups.forEach((g) => {
              if (!state.groups.includes(g)) state.groups.push(g);
            });
          }
          if (Array.isArray(data.savedRolls)) {
            data.savedRolls.forEach((r) => {
              state.savedRolls.push({ ...r, id: generateId() });
            });
          }
          if (data.groupColors) {
            state.groupColors = { ...state.groupColors, ...data.groupColors };
          }
        });
      },
    })),
    {
      name: "dicelite-saved-rolls",
    }
  )
);
