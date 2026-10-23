import { DiceType } from "./DiceType";

export interface RollDamageComponent {
  id: string;
  count: number;
  type: DiceType;
  damageType?: string;
}
