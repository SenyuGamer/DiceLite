import { DiceType, getDiceMax } from "../types/DiceType";
import { Dice, isDice } from "../types/Dice";
import { Die, isDie } from "../types/Die";
import { DiceRoll } from "../types/DiceRoll";
import { getDieFromDice } from "./getDieFromDice";
import { useSettingsStore } from "../controls/settingsStore";

/**
 * Cryptographically secure random integer between min and max (inclusive)
 */
export function secureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return min + (array[0] % range);
}

/**
 * Roll a die based on its type using secure PRNG
 */
export function rollDie(type: DiceType): number {
  if (type === "D100") {
    // Return standard 1-100 or percentile
    return secureRandomInt(1, 100);
  }
  return secureRandomInt(1, getDiceMax(type));
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
