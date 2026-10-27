import { Random, MersenneTwister19937 } from "random-js";
import { DiceType, getDiceMax } from "../types/DiceType";
import { Dice, isDice } from "../types/Dice";
import { Die, isDie } from "../types/Die";
import { DiceRoll } from "../types/DiceRoll";
import { getDieFromDice } from "./getDieFromDice";
import { useSettingsStore } from "../controls/settingsStore";

// Initialize mathematically unbiased Mersenne Twister engine from random-js
const mtEngine = MersenneTwister19937.autoSeed();
const randomJs = new Random(mtEngine);

/**
 * Cryptographically secure random integer with zero-modulo-bias rejection sampling
 */
export function cryptoRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  // Maximum multiple of range that fits in a 32-bit unsigned integer (2^32 = 4294967296)
  const maxValid = Math.floor(4294967296 / range) * range;
  const array = new Uint32Array(1);
  let rand = 0;
  do {
    window.crypto.getRandomValues(array);
    rand = array[0];
  } while (rand >= maxValid);
  return min + (rand % range);
}

/**
 * Pure mathematical random integer using Mersenne Twister 19937 (random-js)
 */
export function mersenneRandomInt(min: number, max: number): number {
  return randomJs.integer(min, max);
}

/**
 * Backward compatibility alias
 */
export function secureRandomInt(min: number, max: number): number {
  return cryptoRandomInt(min, max);
}

/**
 * Karmic / Fair Roll Tracker (Inspired by Baldur's Gate 3 Karmic Dice)
 * Prevents frustrating streaks of consecutive low rolls without inflating high rolls.
 */
class KarmicStreakTracker {
  private lowStreak = 0;

  public rollWithKarmicProtection(min: number, max: number): number {
    // Only apply streak protection to d20 (the main action/test die)
    if (max < 20) {
      return randomJs.integer(min, max);
    }

    const midpoint = Math.floor(max / 2); // 10 for d20

    // If player has suffered 2 consecutive low rolls (<= midpoint)
    if (this.lowStreak >= 2) {
      // Roll 2 candidates using random-js and pick the best (soft advantage under the hood)
      const c1 = randomJs.integer(min, max);
      const c2 = randomJs.integer(min, max);
      const candidate = Math.max(c1, c2);

      if (candidate > midpoint) {
        this.lowStreak = 0;
        return candidate;
      } else {
        // If 3 consecutive failures happened, guarantee an above-average roll on the 4th
        if (this.lowStreak >= 3) {
          this.lowStreak = 0;
          return randomJs.integer(midpoint + 1, max);
        }
        this.lowStreak++;
        return candidate;
      }
    }

    const val = randomJs.integer(min, max);
    if (val <= midpoint) {
      this.lowStreak++;
    } else {
      this.lowStreak = 0;
    }
    return val;
  }

  public reset(): void {
    this.lowStreak = 0;
  }
}

export const karmicTracker = new KarmicStreakTracker();

/**
 * Roll a die based on its type using the Karmic fair algorithm (random-js)
 */
export function rollDie(type: DiceType): number {
  const max = type === "D100" ? 100 : getDiceMax(type);
  return karmicTracker.rollWithKarmicProtection(1, max);
}

export interface EvaluationResult {
  total: number;
  rollValues: Record<string, number>;
  discardedDieIds: Set<string>;
  crit20Ids: Set<string>;
  fumble1Ids: Set<string>;
}

/**
 * Calculates final total and tracks which dice were kept or discarded (advantage/disadvantage)
 */
export function evaluateDiceRoll(
  diceRoll: DiceRoll,
  rollValues: Record<string, number>
): EvaluationResult {
  const discardedDieIds = new Set<string>();
  const crit20Ids = new Set<string>();
  const fumble1Ids = new Set<string>();

  const settings = useSettingsStore.getState();
  const isDamage = Boolean(diceRoll.isDamage);
  const allowCrits = !(isDamage && settings.ignoreCritOnDamage) && settings.preset !== "NONE";

  function resolveItem(item: Die | Dice): number {
    if (isDie(item)) {
      return rollValues[item.id] ?? 0;
    }

    if (isDice(item)) {
      const childResults: { dieId?: string; val: number }[] = [];
      for (const sub of item.dice) {
        if (isDie(sub)) {
          const val = rollValues[sub.id] ?? 0;
          childResults.push({ dieId: sub.id, val });
        } else if (isDice(sub)) {
          const val = resolveItem(sub);
          childResults.push({ val });
        }
      }

      if (childResults.length === 0) return 0;

      if (item.combination === "HIGHEST") {
        let maxVal = -Infinity;
        let bestIndex = 0;
        childResults.forEach((res, idx) => {
          if (res.val > maxVal) {
            maxVal = res.val;
            bestIndex = idx;
          }
        });
        childResults.forEach((res, idx) => {
          if (idx !== bestIndex && res.dieId) {
            discardedDieIds.add(res.dieId);
          }
        });
        return maxVal;
      }

      if (item.combination === "LOWEST") {
        let minVal = Infinity;
        let bestIndex = 0;
        childResults.forEach((res, idx) => {
          if (res.val < minVal) {
            minVal = res.val;
            bestIndex = idx;
          }
        });
        childResults.forEach((res, idx) => {
          if (idx !== bestIndex && res.dieId) {
            discardedDieIds.add(res.dieId);
          }
        });
        return minVal;
      }

      // Default SUM
      return childResults.reduce((acc, curr) => acc + curr.val, 0);
    }

    return 0;
  }

  let baseSum = 0;
  for (const item of diceRoll.dice) {
    baseSum += resolveItem(item);
  }

  const total = baseSum + (diceRoll.bonus || 0);

  // Check criticals & fumbles according to system settings ONLY on active/kept dice
  if (allowCrits) {
    const allDice = getDieFromDice(diceRoll);
    const diceById = new Map(allDice.map((d) => [d.id, d]));

    for (const [id, value] of Object.entries(rollValues)) {
      // Discarded dice from advantage / disadvantage must NOT trigger crits or fumbles
      if (discardedDieIds.has(id)) {
        continue;
      }

      const die = diceById.get(id);
      // Only evaluate the designated test die (e.g. D20 for D&D, D10 for Cyberpunk, D12 for Daggerheart)
      if (die && die.type === settings.criticalDieType && !die.isBless) {
        if (value >= settings.critMin && value <= settings.critMax) {
          crit20Ids.add(id);
        }
        if (value >= settings.fumbleMin && value <= settings.fumbleMax) {
          fumble1Ids.add(id);
        }
      }
    }
  }

  return {
    total,
    rollValues,
    discardedDieIds,
    crit20Ids,
    fumble1Ids,
  };
}
