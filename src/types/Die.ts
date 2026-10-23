import { DiceType } from "./DiceType";

export interface Die {
  id: string;
  type: DiceType;
  isBless?: boolean;
  color?: string;
  fillColor?: string;
  damageType?: string;
  damageTypeKey?: string;
}

export function isDie(item: any): item is Die {
  return typeof item === "object" && item !== null && "type" in item && "id" in item;
}
