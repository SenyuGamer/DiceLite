import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { DiceRoll } from "../types/DiceRoll";
import { Die, isDie } from "../types/Die";
import { Dice, isDice } from "../types/Dice";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { rollDie, evaluateDiceRoll, EvaluationResult } from "../helpers/diceMath";
import { generateDiceId } from "../helpers/generateDiceId";

interface DiceRollState {
  roll: DiceRoll | null;
  rollValues: Record<string, number>;
  evaluation: EvaluationResult | null;
  isRolling: boolean;
  rollingDieIds: string[];

  startRoll: (roll: DiceRoll) => void;
  clearRoll: () => void;
  reroll: (ids?: string[]) => void;
  removeDieFromRoll: (dieId: string) => void;
}

export const useDiceRollStore = create<DiceRollState>()(
  immer((set, get) => ({
    roll: null,
    rollValues: {},
    evaluation: null,
    isRolling: false,
    rollingDieIds: [],

    startRoll(roll) {
      if (!roll.timestamp) {
        roll.timestamp = Date.now();
      }
      if (!roll.recentRollId) {
        roll.recentRollId = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      }
      const dice = getDieFromDice(roll);
      const newValues: Record<string, number> = {};
      const allIds = dice.map((d) => d.id);

      for (const die of dice) {
        newValues[die.id] = rollDie(die.type);
      }

      const evaluation = evaluateDiceRoll(roll, newValues);

      set((state) => {
        state.roll = roll;
        state.rollValues = newValues;
        state.evaluation = evaluation;
        state.isRolling = true;
        state.rollingDieIds = allIds;
      });

      // Brief animation duration
      setTimeout(() => {
        set((state) => {
          state.isRolling = false;
          state.rollingDieIds = [];
        });
      }, 350);
    },

    clearRoll() {
      set((state) => {
        state.roll = null;
        state.rollValues = {};
        state.evaluation = null;
        state.isRolling = false;
        state.rollingDieIds = [];
      });
    },

    reroll(ids) {
      const currentRoll = get().roll;
      if (!currentRoll) return;

      const newValues = { ...get().rollValues };
      const allDice = getDieFromDice(currentRoll);
      const targetIds = ids && ids.length > 0 ? ids : allDice.map((d) => d.id);

      for (const die of allDice) {
        if (targetIds.includes(die.id)) {
          newValues[die.id] = rollDie(die.type);
        }
      }

      const evaluation = evaluateDiceRoll(currentRoll, newValues);

      // Update roll with a new recentRollId so sync listeners broadcast the rerolled value
      const updatedRoll: DiceRoll = {
        ...currentRoll,
        recentRollId: performance.now().toString(),
      };

      set((state) => {
        state.roll = updatedRoll;
        state.rollValues = newValues;
        state.evaluation = evaluation;
        state.isRolling = true;
        state.rollingDieIds = targetIds;
      });

      setTimeout(() => {
        set((state) => {
          state.isRolling = false;
          state.rollingDieIds = [];
        });
      }, 350);
    },

    removeDieFromRoll(dieId) {
      set((state) => {
        if (!state.roll) return;

        function filterDice(items: (Die | Dice)[]): (Die | Dice)[] {
          const res: (Die | Dice)[] = [];
          for (const item of items) {
            if (isDie(item)) {
              if (item.id !== dieId) res.push(item);
            } else if (isDice(item)) {
              const filteredSub = filterDice(item.dice);
              if (filteredSub.length > 0) {
                res.push({ ...item, dice: filteredSub });
              }
            }
          }
          return res;
        }

        const updatedDice = filterDice(state.roll.dice);
        delete state.rollValues[dieId];

        if (updatedDice.length === 0) {
          state.roll = null;
          state.rollValues = {};
          state.evaluation = null;
          state.isRolling = false;
        } else {
          state.roll.dice = updatedDice;
          state.evaluation = evaluateDiceRoll(state.roll, state.rollValues);
        }
      });
    },
  }))
);
