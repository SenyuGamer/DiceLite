export type DiceType = "D4" | "D6" | "D8" | "D10" | "D12" | "D20" | "D100";

export const ALL_DICE_TYPES: DiceType[] = [
  "D4",
  "D6",
  "D8",
  "D10",
  "D12",
  "D20",
  "D100",
];

export function getDiceMax(type: DiceType): number {
  switch (type) {
    case "D4":
      return 4;
    case "D6":
      return 6;
    case "D8":
      return 8;
    case "D10":
      return 10;
    case "D12":
      return 12;
    case "D20":
      return 20;
    case "D100":
      return 100;
  }
}
