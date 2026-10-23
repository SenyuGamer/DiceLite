import OBR, { Player } from "@owlbear-rodeo/sdk";
import { useEffect, useRef } from "react";
import {
  useGlobalHistoryStore,
  GlobalRoll,
  PlayerRecentRoll,
  isRollFresh,
} from "../controls/globalHistoryStore";
import { getPluginId } from "./getPluginId";
import { DiceRoll } from "../types/DiceRoll";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { evaluateDiceRoll } from "../helpers/diceMath";
import { DiceCounts } from "../controls/store";

const HISTORY_KEY = getPluginId("global_history");

export function GlobalHistorySync({ readOnly = false }: { readOnly?: boolean }) {
  const pushGlobalRoll = useGlobalHistoryStore((state) => state.pushGlobalRoll);
  const pruneExpiredRolls = useGlobalHistoryStore((state) => state.pruneExpiredRolls);
  const setCurrentRoomId = useGlobalHistoryStore((state) => state.setCurrentRoomId);
  const knownRolls = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if (!OBR.isAvailable) return;

    let unsubParty: (() => void) | undefined;
    let unsubPlayer: (() => void) | undefined;
    let pruneInterval: ReturnType<typeof setInterval> | undefined;

    OBR.onReady(async () => {
      const currentRoomId = OBR.room?.id || "default";
      setCurrentRoomId(currentRoomId);

      // 1. One-time legacy cleanup: If room metadata has old stored history from older versions,
      // import any fresh rolls once and delete the key from room metadata to free up the 16kB room limit.
      try {
        const meta = await OBR.room.getMetadata();
        if (meta && meta[HISTORY_KEY]) {
          const oldHistory = meta[HISTORY_KEY] as GlobalRoll[];
          if (Array.isArray(oldHistory)) {
            for (const roll of oldHistory) {
              if (roll && roll.id && isRollFresh(roll.timestamp) && !knownRolls.current[roll.id]) {
                knownRolls.current[roll.id] = true;
                pushGlobalRoll({ ...roll, roomId: currentRoomId });
              }
            }
          }
          if (!readOnly) {
            await OBR.room.setMetadata({ [HISTORY_KEY]: undefined });
          }
        }
      } catch {
        // Ignore if room metadata cannot be read/set
      }

      function handlePlayersChange(players: Player[]) {
        for (const player of players) {
          // A) Distributed History: Read each player's exposed recent rolls from their player.metadata
          // STRICT ROOM ISOLATION: Only ingest rolls that belong to THIS room (roomId === currentRoomId)
          const playerHistory = player.metadata[getPluginId("player_history")] as PlayerRecentRoll[] | undefined;
          if (Array.isArray(playerHistory)) {
            for (const roll of playerHistory) {
              if (roll && roll.id && isRollFresh(roll.timestamp)) {
                // Ignore rolls from other rooms
                if (roll.roomId && roll.roomId !== currentRoomId) continue;

                pushGlobalRoll({
                  id: roll.id,
                  roomId: currentRoomId,
                  playerName: player.name,
                  playerColor: player.color,
                  name: roll.name,
                  counts: roll.counts || {},
                  bonus: roll.bonus || 0,
                  advantage: roll.advantage || null,
                  result: roll.result,
                  timestamp: roll.timestamp,
                  isCrit: roll.isCrit,
                  isFumble: roll.isFumble,
                });
              }
            }
          }

          // B) Live Roll: If a player is actively rolling right now in this room, capture it immediately
          const liveRoll = player.metadata[getPluginId("roll")] as DiceRoll | undefined;
          const liveRollValues = player.metadata[getPluginId("rollValues")] as Record<string, number> | undefined;

          if (liveRoll && liveRoll.recentRollId && !liveRoll.hidden && liveRollValues) {
            if (!knownRolls.current[liveRoll.recentRollId]) {
              knownRolls.current[liveRoll.recentRollId] = true;

              const counts: Partial<DiceCounts> = {};
              const parsedDice = getDieFromDice(liveRoll);
              for (const die of parsedDice) {
                counts[die.type] = (counts[die.type] || 0) + 1;
              }

              const evaluation = evaluateDiceRoll(liveRoll, liveRollValues);

              const newRoll: GlobalRoll = {
                id: liveRoll.recentRollId,
                roomId: currentRoomId,
                playerName: player.name,
                playerColor: player.color,
                name: liveRoll.name,
                counts,
                bonus: liveRoll.bonus || 0,
                advantage: null,
                result: evaluation.total,
                timestamp: liveRoll.timestamp || Date.now(),
                isCrit: evaluation.crit20Ids.size > 0,
                isFumble: evaluation.fumble1Ids.size > 0,
              };

              pushGlobalRoll(newRoll);
            }
          }
        }
      }

      // Sync in real-time via party events (0 bytes of Room metadata used)
      unsubParty = OBR.party.onChange(handlePlayersChange);
      unsubPlayer = OBR.player.onChange((player) => handlePlayersChange([player]));

      // Fetch current party players on mount
      try {
        const currentPlayers = await OBR.party.getPlayers();
        handlePlayersChange(currentPlayers);
      } catch {
        // ignore
      }

      // Periodically prune rolls older than 60 minutes
      pruneInterval = setInterval(() => {
        pruneExpiredRolls();
      }, 60 * 1000);
    });

    return () => {
      unsubParty?.();
      unsubPlayer?.();
      if (pruneInterval) clearInterval(pruneInterval);
    };
  }, [pushGlobalRoll, pruneExpiredRolls, readOnly]);

  return null;
}
