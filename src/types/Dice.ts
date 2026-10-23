import { Die, isDie } from "./Die";

export interface Dice {
  dice: Array<Die | Dice>;
  combination?: "SUM" | "HIGHEST" | "LOWEST" | "NONE";
}

export function isDice(item: any): item is Dice {
  return (
    typeof item === "object" &&
    item !== null &&
    "dice" in item &&
    Array.isArray(item.dice) &&
    !isDie(item)
  );
}
