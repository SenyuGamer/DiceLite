import OBR, { Player } from "@owlbear-rodeo/sdk";
import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Slide from "@mui/material/Slide";
import { getPluginId } from "./getPluginId";
import { DiceRoll } from "../types/DiceRoll";
import { evaluateDiceRoll } from "../helpers/diceMath";
import { getDieFromDice } from "../helpers/getDieFromDice";

interface RollToast {
  id: string;
  playerName: string;
  playerColor: string;
  rollName?: string;
  formula: string;
  total: number;
  isCrit: boolean;
  isFumble: boolean;
}

export const PartyRollToasts: React.FC = () => {
  const [toasts, setToasts] = useState<RollToast[]>([]);
  const knownRollsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!OBR.isAvailable) return;

    const handlePlayers = async (players: Player[]) => {
      const myId = OBR.player.id;

      for (const player of players) {
        // Only show toasts for OTHER players (the rolling player already sees their own roll in the main window)
        if (player.id === myId) continue;

        const roll = player.metadata[getPluginId("roll")] as DiceRoll | undefined;
        const rollValues = player.metadata[getPluginId("rollValues")] as Record<string, number> | undefined;

        if (roll && roll.recentRollId && !roll.hidden && rollValues) {
          if (!knownRollsRef.current.has(roll.recentRollId)) {
            knownRollsRef.current.add(roll.recentRollId);

            const evaluation = evaluateDiceRoll(roll, rollValues);
            const dice = getDieFromDice(roll);

            // Group dice counts for formula display
            const counts: Record<string, number> = {};
            for (const d of dice) {
              counts[d.type] = (counts[d.type] || 0) + 1;
            }
            const parts = Object.entries(counts).map(([type, count]) => `${count}${type.toLowerCase()}`);
            let formula = parts.join("+");
            if (roll.bonus) {
              formula += roll.bonus > 0 ? `+${roll.bonus}` : `${roll.bonus}`;
            }

            const newToast: RollToast = {
              id: roll.recentRollId,
              playerName: player.name,
              playerColor: player.color || "#f59e0b",
              rollName: roll.name,
              formula,
              total: evaluation.total,
              isCrit: evaluation.crit20Ids.size > 0,
              isFumble: evaluation.fumble1Ids.size > 0,
            };

            setToasts((prev) => [...prev, newToast]);

            // Auto dismiss after 4.5 seconds
            setTimeout(() => {
              setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
            }, 4500);
          }
        }
      }
    };

    const unsub = OBR.party.onChange(handlePlayers);
    OBR.party.getPlayers().then(handlePlayers);

    return () => unsub();
  }, []);

  // Resize popover iframe to fit active toasts
  useEffect(() => {
    if (!OBR.isAvailable) return;

    if (toasts.length === 0) {
      OBR.popover.setWidth(getPluginId("popover"), 0);
      OBR.popover.setHeight(getPluginId("popover"), 0);
    } else {
      OBR.popover.setWidth(getPluginId("popover"), 320);
      OBR.popover.setHeight(getPluginId("popover"), Math.min(480, toasts.length * 80 + 20));
    }
  }, [toasts.length]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 1,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <Slide key={toast.id} direction="left" in mountOnEnter unmountOnExit>
          <Box
            onClick={() => removeToast(toast.id)}
            sx={{
              pointerEvents: "all",
              cursor: "pointer",
              width: 290,
              p: 1.5,
              borderRadius: 3,
              backgroundColor: "rgba(15, 23, 42, 0.92)",
              backdropFilter: "blur(12px)",
              border: toast.isCrit
                ? "1px solid #eab308"
                : toast.isFumble
                ? "1px solid #ef4444"
                : "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: toast.isCrit
                ? "0 8px 24px rgba(234, 179, 8, 0.35)"
                : toast.isFumble
                ? "0 8px 24px rgba(239, 68, 68, 0.35)"
                : "0 8px 24px rgba(0, 0, 0, 0.5)",
              transition: "transform 0.15s ease",
              "&:hover": { transform: "scale(1.02)" },
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Player Avatar Circle */}
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  bgcolor: toast.playerColor,
                  color: "#0f172a",
                  fontWeight: 900,
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              >
                {toast.playerName.charAt(0).toUpperCase()}
              </Box>

              {/* Player Info & Formula */}
              <Stack sx={{ flexGrow: 1, overflow: "hidden" }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: "#f8fafc" }} noWrap>
                  {toast.playerName}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                  {toast.rollName ? `${toast.rollName} (${toast.formula})` : toast.formula}
                </Typography>
              </Stack>

              {/* Total Chip */}
              <Chip
                label={toast.total}
                sx={{
                  fontWeight: 900,
                  fontSize: "1rem",
                  px: 0.5,
                  bgcolor: toast.isCrit
                    ? "#eab308"
                    : toast.isFumble
                    ? "#ef4444"
                    : "rgba(245, 158, 11, 0.2)",
                  color: toast.isCrit ? "#0f172a" : toast.isFumble ? "white" : "#f59e0b",
                  border: "1px solid",
                  borderColor: toast.isCrit ? "#ca8a04" : toast.isFumble ? "#dc2626" : "#f59e0b",
                }}
              />
            </Stack>
          </Box>
        </Slide>
      ))}
    </Box>
  );
};
