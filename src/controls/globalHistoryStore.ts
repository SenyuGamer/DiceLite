import create from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { Advantage, DiceCounts } from "./store";

export const MAX_ROLL_AGE_MS = 60 * 60 * 1000; // 60 minutos

export const isRollFresh = (timestamp: number): boolean => {
  if (!timestamp) return false;
  const now = Date.now();
  // Válido si fue en los últimos 60 minutos (permitiendo un margen de 2 minutos por desfase horario de reloj)
  return now - timestamp <= MAX_ROLL_AGE_MS && timestamp <= now + 2 * 60 * 1000;
};

export interface PlayerRecentRoll {
  id: string;
  roomId?: string; // ID único de la mesa en Owlbear Rodeo
  name?: string;
  counts: Partial<DiceCounts>;
  bonus: number;
  advantage: Advantage;
  result?: number;
  timestamp: number;
  isCrit?: boolean;
  isFumble?: boolean;
}

export interface GlobalRoll extends PlayerRecentRoll {
  playerName: string;
  playerColor: string;
}

interface GlobalHistoryState {
  currentRoomId: string | null;
  globalRolls: GlobalRoll[];
  setCurrentRoomId: (id: string | null) => void;
  pushGlobalRoll: (roll: GlobalRoll) => void;
  updateGlobalRollResult: (id: string, result: number) => void;
  pruneExpiredRolls: () => void;
  clearGlobalHistory: () => void;
}

export const useGlobalHistoryStore = create<GlobalHistoryState>()(
  persist(
    immer((set) => ({
      currentRoomId: null,
      globalRolls: [],

      setCurrentRoomId(id) {
        set((state) => {
          state.currentRoomId = id;
        });
      },

      pushGlobalRoll(roll) {
        if (!isRollFresh(roll.timestamp)) return;

        set((state) => {
          // Limpiar tiradas mayores a 60 minutos
          state.globalRolls = state.globalRolls.filter((r) => isRollFresh(r.timestamp));

          const existingIndex = state.globalRolls.findIndex((r) => r.id === roll.id);
          if (existingIndex >= 0) {
            // Actualizar si ya existe preservando el timestamp original si el nuevo no es válido
            state.globalRolls[existingIndex] = {
              ...state.globalRolls[existingIndex],
              ...roll,
              roomId: roll.roomId || state.globalRolls[existingIndex].roomId,
              timestamp: roll.timestamp || state.globalRolls[existingIndex].timestamp,
            };
          } else {
            // Mantener un máximo de 50 tiradas recientes en almacenamiento
            if (state.globalRolls.length >= 50) {
              state.globalRolls.splice(0, state.globalRolls.length - 49);
            }
            state.globalRolls.push(roll);
          }

          // Orden cronológico estricto garantizado
          state.globalRolls.sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));
        });
      },

      updateGlobalRollResult(id, result) {
        set((state) => {
          const roll = state.globalRolls.find((r) => r.id === id);
          if (roll) {
            roll.result = result;
          }
        });
      },

      pruneExpiredRolls() {
        set((state) => {
          state.globalRolls = state.globalRolls.filter((r) => isRollFresh(r.timestamp));
        });
      },

      clearGlobalHistory() {
        set((state) => {
          if (state.currentRoomId) {
            state.globalRolls = state.globalRolls.filter((r) => r.roomId && r.roomId !== state.currentRoomId);
          } else {
            state.globalRolls = [];
          }
        });
      },
    })),
    {
      name: "dicelite-global-history",
    }
  )
);
