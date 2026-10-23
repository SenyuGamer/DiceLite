import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { DiceType, ALL_DICE_TYPES } from "../types/DiceType";
import { Die } from "../types/Die";
import { Dice } from "../types/Dice";
import { generateDiceId } from "../helpers/generateDiceId";
import { detectDamageType } from "../utils/damageTypes";
import { RollDamageComponent } from "../types/RollDamageComponent";

export type Advantage =
  | "SUPER_DISADVANTAGE"
  | "DISADVANTAGE"
  | "ADVANTAGE"
  | "SUPER_ADVANTAGE"
  | null;

export type RollMode = "CHECK" | "DAMAGE";
export type DiceCounts = Record<DiceType, number>;

export const defaultDiceCounts: DiceCounts = {
  D4: 0,
  D6: 0,
  D8: 0,
  D10: 0,
  D12: 0,
  D20: 0,
  D100: 0,
};

interface DiceControlsState {
  diceCounts: DiceCounts;
  diceBonus: number;
  diceAdvantage: Advantage;
  diceHidden: boolean;
  blessActive: boolean;
  blessCount: number;
  rollMode: RollMode;
  isDamageRoll: boolean;

  incrementDieCount: (type: DiceType) => void;
  decrementDieCount: (type: DiceType) => void;
  resetDiceCounts: () => void;
  resetAll: () => void;
  setDiceCounts: (counts: Partial<DiceCounts>) => void;
  setDiceAdvantage: (advantage: Advantage) => void;
  setDiceBonus: (bonus: number) => void;
  toggleDiceHidden: () => void;
  setRollMode: (mode: RollMode) => void;
  toggleDamageRoll: () => void;
  setBlessActive: (active: boolean) => void;
  setBlessCount: (count: number) => void;
}

export const useDiceControlsStore = create<DiceControlsState>()(
  immer((set) => ({
    diceCounts: { ...defaultDiceCounts },
    diceBonus: 0,
    diceAdvantage: null,
    diceHidden: false,
    blessActive: false,
    blessCount: 1,
    rollMode: "CHECK",
    isDamageRoll: false,

    incrementDieCount(type) {
      set((state) => {
        state.diceCounts[type] = (state.diceCounts[type] || 0) + 1;
      });
    },

    decrementDieCount(type) {
      set((state) => {
        if (state.diceCounts[type] > 0) {
          state.diceCounts[type] -= 1;
        }
      });
    },

    resetDiceCounts() {
      set((state) => {
        state.diceCounts = { ...defaultDiceCounts };
      });
    },

    resetAll() {
      set((state) => {
        state.diceCounts = { ...defaultDiceCounts };
        state.diceBonus = 0;
        state.diceAdvantage = null;
        state.blessActive = false;
        state.blessCount = 1;
        state.rollMode = "CHECK";
      });
    },

    setDiceCounts(counts) {
      set((state) => {
        for (const type of ALL_DICE_TYPES) {
          state.diceCounts[type] = counts[type] || 0;
        }
      });
    },

    setDiceAdvantage(advantage) {
      set((state) => {
        state.diceAdvantage = advantage;
      });
    },

    setDiceBonus(bonus) {
      set((state) => {
        state.diceBonus = bonus;
      });
    },

    toggleDiceHidden() {
      set((state) => {
        state.diceHidden = !state.diceHidden;
      });
    },

    setRollMode(mode) {
      set((state) => {
        state.rollMode = mode;
        state.isDamageRoll = mode === "DAMAGE";
      });
    },

    toggleDamageRoll() {
      set((state) => {
        const nextMode = state.rollMode === "DAMAGE" ? "CHECK" : "DAMAGE";
        state.rollMode = nextMode;
        state.isDamageRoll = nextMode === "DAMAGE";
      });
    },

    setBlessActive(active) {
      set((state) => {
        state.blessActive = active;
      });
    },

    setBlessCount(count) {
      set((state) => {
        state.blessCount = count;
      });
    },
  }))
);

/**
 * Converts counts, advantage, and bless state into the DiceRoll tree structure
 */
export function getDiceToRoll(
  counts: Partial<DiceCounts>,
  advantage: Advantage,
  blessActive?: boolean,
  blessCount?: number,
  damageType?: string,
  damageComponents?: RollDamageComponent[]
): (Die | Dice)[] {
  const dice: (Die | Dice)[] = [];

  if (damageComponents && damageComponents.length > 0) {
    for (const comp of damageComponents) {
      if (!comp.count || comp.count <= 0) continue;
      const damageDef = comp.damageType ? detectDamageType(comp.damageType) : null;
      const typeLabel = damageDef ? damageDef.name : comp.damageType || undefined;

      for (let i = 0; i < comp.count; i++) {
        if (advantage === null) {
          dice.push({
            id: generateDiceId(),
            type: comp.type,
            color: damageDef?.color,
            fillColor: damageDef?.fillColor,
            damageType: typeLabel,
            damageTypeKey: damageDef?.typeKey,
          });
        } else {
          const isSuper = advantage === "SUPER_ADVANTAGE" || advantage === "SUPER_DISADVANTAGE";
          const combination =
            advantage === "ADVANTAGE" || advantage === "SUPER_ADVANTAGE"
              ? "HIGHEST"
              : "LOWEST";

          const subDice: Die[] = [
            {
              id: generateDiceId(),
              type: comp.type,
              color: damageDef?.color,
              fillColor: damageDef?.fillColor,
              damageType: typeLabel,
              damageTypeKey: damageDef?.typeKey,
            },
            {
              id: generateDiceId(),
              type: comp.type,
              color: damageDef?.color,
              fillColor: damageDef?.fillColor,
              damageType: typeLabel,
              damageTypeKey: damageDef?.typeKey,
            },
          ];
          if (isSuper) {
            subDice.push({
              id: generateDiceId(),
              type: comp.type,
              color: damageDef?.color,
              fillColor: damageDef?.fillColor,
              damageType: typeLabel,
              damageTypeKey: damageDef?.typeKey,
            });
          }

          dice.push({
            dice: subDice,
            combination,
          });
        }
      }
    }
  } else {
    const damageDef = damageType ? detectDamageType(damageType) : null;
    const typeLabel = damageDef ? damageDef.name : damageType || undefined;

    for (const [typeKey, count] of Object.entries(counts)) {
      const type = typeKey as DiceType;
      const num = count || 0;

      for (let i = 0; i < num; i++) {
        if (advantage === null) {
          dice.push({
            id: generateDiceId(),
            type,
            color: damageDef?.color,
            fillColor: damageDef?.fillColor,
            damageType: typeLabel,
            damageTypeKey: damageDef?.typeKey,
          });
        } else {
          const isSuper = advantage === "SUPER_ADVANTAGE" || advantage === "SUPER_DISADVANTAGE";
          const combination =
            advantage === "ADVANTAGE" || advantage === "SUPER_ADVANTAGE"
              ? "HIGHEST"
              : "LOWEST";

          const subDice: Die[] = [
            {
              id: generateDiceId(),
              type,
              color: damageDef?.color,
              fillColor: damageDef?.fillColor,
              damageType: typeLabel,
              damageTypeKey: damageDef?.typeKey,
            },
            {
              id: generateDiceId(),
              type,
              color: damageDef?.color,
              fillColor: damageDef?.fillColor,
              damageType: typeLabel,
              damageTypeKey: damageDef?.typeKey,
            },
          ];
          if (isSuper) {
            subDice.push({
              id: generateDiceId(),
              type,
              color: damageDef?.color,
              fillColor: damageDef?.fillColor,
              damageType: typeLabel,
              damageTypeKey: damageDef?.typeKey,
            });
          }

          dice.push({
            dice: subDice,
            combination,
          });
        }
      }
    }
  }

  // Bless adds 1d4 per blessCount to attack / checks
  if (dice.length > 0 && blessActive && blessCount && blessCount > 0) {
    for (let i = 0; i < blessCount; i++) {
      dice.push({ id: generateDiceId(), type: "D4", isBless: true });
    }
  }

  return dice;
}
