import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { Advantage, DiceCounts } from "./store";
import { RollDamageComponent } from "../types/RollDamageComponent";

export interface RecentRoll {
  id: string;
  name?: string;
  counts: Partial<DiceCounts>;
  bonus: number;
  advantage: Advantage;
  result?: number;
  timestamp: number;
  isDamage?: boolean;
  damageType?: string;
  damageTypes?: string[];
  damageComponents?: RollDamageComponent[];
}

interface DiceHistoryState {
  recentRolls: RecentRoll[];
  pushRecentRoll: (roll: RecentRoll) => void;
  updateRecentRollResult: (id: string, result: number) => void;
  removeRecentRoll: (index: number) => void;
  clearHistory: () => void;
}

export const useDiceHistoryStore = create<DiceHistoryState>()(
  immer((set) => ({
    recentRolls: [],
    pushRecentRoll(roll) {
      set((state) => {
        if (state.recentRolls.length >= 20) {
          state.recentRolls.shift();
        }
        state.recentRolls.push(roll);
      });
    },
    updateRecentRollResult(id, result) {
      set((state) => {
        const roll = state.recentRolls.find((r) => r.id === id);
        if (roll) {
          roll.result = result;
        }
      });
    },
    removeRecentRoll(index) {
      set((state) => {
        state.recentRolls.splice(index, 1);
      });
    },
    clearHistory() {
      set((state) => {
        state.recentRolls = [];
      });
    },
  }))
);
