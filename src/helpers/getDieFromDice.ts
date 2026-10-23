import { Dice, isDice } from "../types/Dice";
import { Die, isDie } from "../types/Die";

export function getDieFromDice(dice: Dice): Die[] {
  const result: Die[] = [];
  for (const item of dice.dice) {
    if (isDie(item)) {
      result.push(item);
    } else if (isDice(item)) {
      result.push(...getDieFromDice(item));
    }
  }
  return result;
}
