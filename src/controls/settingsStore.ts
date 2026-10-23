import create from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { DiceType } from "../types/DiceType";

export type GameSystemPreset =
  | "D20" // D&D 5e, Pathfinder (Crítico: 20 a 20, Pifia: 1 a 1)
  | "D10" // Cyberpunk, Storyteller (Crítico: 10 a 10, Pifia: 1 a 1)
  | "D12" // Daggerheart (Crítico: 12 a 12, Pifia: 1 a 1)
  | "D100" // Call of Cthulhu (Crítico: 1 a 5, Pifia: 96 a 100)
  | "D6" // Year Zero, Shadowrun (Crítico: 6 a 6, Pifia: 1 a 1)
  | "CUSTOM" // Configuración manual libre de rangos
  | "NONE"; // Desactivar detección

export interface SettingsState {
  preset: GameSystemPreset;
  criticalDieType: DiceType;
  critMin: number;
  critMax: number;
  fumbleMin: number;
  fumbleMax: number;
  ignoreCritOnDamage: boolean; // Ignorar si la tirada es de daño
  enableSuperAdvantage: boolean; // Habilitar 3 dados en ventaja/desventaja (desactivado por defecto)
  setPreset: (preset: GameSystemPreset) => void;
  setCriticalDieType: (type: DiceType) => void;
  setCritRange: (min: number, max: number) => void;
  setFumbleRange: (min: number, max: number) => void;
  setIgnoreCritOnDamage: (val: boolean) => void;
  setEnableSuperAdvantage: (val: boolean) => void;
}

const PRESET_CONFIGS: Record<
  GameSystemPreset,
  {
    die: DiceType;
    critMin: number;
    critMax: number;
    fumbleMin: number;
    fumbleMax: number;
  }
> = {
  D20: { die: "D20", critMin: 20, critMax: 20, fumbleMin: 1, fumbleMax: 1 },
  D10: { die: "D10", critMin: 10, critMax: 10, fumbleMin: 1, fumbleMax: 1 },
  D12: { die: "D12", critMin: 12, critMax: 12, fumbleMin: 1, fumbleMax: 1 },
  D100: { die: "D100", critMin: 1, critMax: 5, fumbleMin: 96, fumbleMax: 100 },
  D6: { die: "D6", critMin: 6, critMax: 6, fumbleMin: 1, fumbleMax: 1 },
  CUSTOM: { die: "D20", critMin: 20, critMax: 20, fumbleMin: 1, fumbleMax: 1 },
  NONE: { die: "D20", critMin: 99999, critMax: -99999, fumbleMin: 99999, fumbleMax: -99999 },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    immer((set) => ({
      preset: "D20",
      criticalDieType: "D20",
      critMin: 20,
      critMax: 20,
      fumbleMin: 1,
      fumbleMax: 1,
      ignoreCritOnDamage: true,
      enableSuperAdvantage: false,

      setPreset(preset) {
        set((state) => {
          state.preset = preset;
          if (preset in PRESET_CONFIGS) {
            const cfg = PRESET_CONFIGS[preset];
            state.criticalDieType = cfg.die;
            state.critMin = cfg.critMin;
            state.critMax = cfg.critMax;
            state.fumbleMin = cfg.fumbleMin;
            state.fumbleMax = cfg.fumbleMax;
          }
        });
      },

      setCriticalDieType(type) {
        set((state) => {
          state.criticalDieType = type;
          state.preset = "CUSTOM";
        });
      },

      setCritRange(min, max) {
        set((state) => {
          state.critMin = min;
          state.critMax = max;
          state.preset = "CUSTOM";
        });
      },

      setFumbleRange(min, max) {
        set((state) => {
          state.fumbleMin = min;
          state.fumbleMax = max;
          state.preset = "CUSTOM";
        });
      },

      setIgnoreCritOnDamage(val) {
        set((state) => {
          state.ignoreCritOnDamage = val;
        });
      },

      setEnableSuperAdvantage(val) {
        set((state) => {
          state.enableSuperAdvantage = val;
        });
      },
    })),
    {
      name: "dicelite-settings",
    }
  )
);
