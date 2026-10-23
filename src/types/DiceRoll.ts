import { Dice } from "./Dice";

export interface DiceRoll extends Dice {
  bonus: number;
  hidden?: boolean;
  recentRollId?: string;
  name?: string;
  characterName?: string;
  isDamage?: boolean;
  timestamp?: number;
  damageTypes?: string[];
}
