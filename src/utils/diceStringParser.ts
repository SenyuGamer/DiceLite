import { DiceType } from "../types/DiceType";
import { DiceCounts } from "../controls/store";

export interface ParsedDice {
  counts: Partial<DiceCounts>;
  bonus: number;
}

/**
 * Parses dice formulas like "1d20+5", "2d6-1", "1d8+2d6+4"
 */
export function parseDiceString(str: string): ParsedDice | null {
  if (!str) return null;

  const counts: Partial<DiceCounts> = {};
  let totalBonus = 0;

  // Normalize string: remove spaces
  const clean = str.replace(/\s+/g, "");

  // Match dice expressions like 2d6, +1d8, -1d4
  const diceRegex = /([+-]?\d*)d(\d+)/gi;
  let match: RegExpExecArray | null;

  let hasDice = false;

  while ((match = diceRegex.exec(clean)) !== null) {
    hasDice = true;
    let qtyStr = match[1];
    let qty = 1;
    if (qtyStr === "" || qtyStr === "+") qty = 1;
    else if (qtyStr === "-") qty = -1;
    else qty = parseInt(qtyStr, 10);

    const faces = parseInt(match[2], 10);
    const type = `D${faces}` as DiceType;

    counts[type] = (counts[type] || 0) + qty;
  }

  // Remove the dice parts to extract the remaining flat bonuses
  const withoutDice = clean.replace(/([+-]?\d*)d\d+/gi, "");
  const bonusRegex = /([+-]?\d+)/g;
  while ((match = bonusRegex.exec(withoutDice)) !== null) {
    totalBonus += parseInt(match[1], 10);
  }

  if (!hasDice && totalBonus === 0) return null;

  return {
    counts,
    bonus: totalBonus,
  };
}
