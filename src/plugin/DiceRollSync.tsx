import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useRef } from "react";
import { useDiceRollStore } from "../dice/store";
import { getPluginId } from "./getPluginId";
import { isRollFresh, PlayerRecentRoll } from "../controls/globalHistoryStore";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { DiceCounts } from "../controls/store";

const getRoomId = (): string => {
  try {
    if (OBR.isAvailable && OBR.room?.id) {
      return OBR.room.id;
    }
  } catch {
    // ignore
  }
  return "default";
};

const getStorageKey = (roomId: string) => `dicelite-player-history-${roomId}`;

const loadPlayerHistory = (roomId: string): PlayerRecentRoll[] => {
  try {
    const raw = localStorage.getItem(getStorageKey(roomId));
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list.filter((r) => r && isRollFresh(r.timestamp) && (!r.roomId || r.roomId === roomId));
      }
    }
  } catch {
    // ignore
  }
  return [];
};

const savePlayerHistory = (roomId: string, rolls: PlayerRecentRoll[]) => {
  try {
    localStorage.setItem(getStorageKey(roomId), JSON.stringify(rolls));
  } catch {
    // ignore
  }
};

/**
 * Synchronizes local dice rolls with Owlbear Rodeo player metadata.
 * Distributed architecture: Each player exposes their last 5 fresh rolls (<=60m)
 * directly in their own player.metadata, scoped strictly to the current room.
 * Keeping room metadata (16kB limit) at 0 bytes.
 */
export function DiceRollSync() {
  const prevRollId = useRef<string | null>(null);

  useEffect(() => {
    if (!OBR.isAvailable) return;

    // On startup, restore fresh rolls (<= 60 min) for THIS ROOM ONLY and publish to player.metadata
    OBR.onReady(() => {
      const roomId = getRoomId();
      const existing = loadPlayerHistory(roomId).sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));
      OBR.player.setMetadata({
        [getPluginId("player_history")]: existing,
      });
    });

    return useDiceRollStore.subscribe((state) => {
      const roll = state.roll;
      const rollId = roll?.recentRollId || null;

      if (rollId !== prevRollId.current) {
        prevRollId.current = rollId;

        if (roll) {
          const values = roll.hidden ? undefined : state.rollValues;
          const rollPayload = roll.hidden ? { ...roll, hidden: true } : roll;

          // If the roll is public and has an evaluation, record into personal history for THIS room
          let updatedHistory: PlayerRecentRoll[] | undefined;
          if (!roll.hidden && state.evaluation) {
            const counts: Partial<DiceCounts> = {};
            const parsedDice = getDieFromDice(roll);
            for (const die of parsedDice) {
              counts[die.type] = (counts[die.type] || 0) + 1;
            }

            const roomId = getRoomId();
            const compactRoll: PlayerRecentRoll = {
              id: rollId || performance.now().toString(),
              roomId,
              name: roll.name,
              counts,
              bonus: roll.bonus || 0,
              advantage: null,
              result: state.evaluation.total,
              timestamp: roll.timestamp || Date.now(),
              isCrit: state.evaluation.crit20Ids.size > 0,
              isFumble: state.evaluation.fumble1Ids.size > 0,
            };

            let current = loadPlayerHistory(roomId).filter((r) => r.id !== compactRoll.id && isRollFresh(r.timestamp));
            current.push(compactRoll);
            current.sort((a, b) => a.timestamp - b.timestamp || a.id.localeCompare(b.id));
            if (current.length > 5) {
              current = current.slice(current.length - 5);
            }
            savePlayerHistory(roomId, current);
            updatedHistory = current;
          }

          OBR.player.setMetadata({
            [getPluginId("roll")]: rollPayload,
            [getPluginId("rollValues")]: values,
            ...(updatedHistory ? { [getPluginId("player_history")]: updatedHistory } : {}),
          });
        } else {
          // Clear active roll visuals, but preserve room-specific player_history
          OBR.player.setMetadata({
            [getPluginId("roll")]: null,
            [getPluginId("rollValues")]: null,
          });
        }
      }
    });
  }, []);

  return null;
}
