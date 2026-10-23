import React, { useMemo } from "react";
import { Player } from "@owlbear-rodeo/sdk";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CloseIcon from "@mui/icons-material/CloseRounded";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOffRounded";
import { getPluginId } from "./getPluginId";
import { DiceRoll } from "../types/DiceRoll";
import { evaluateDiceRoll } from "../helpers/diceMath";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { DiceSvg } from "../components/dice/DiceSvg";

interface PlayerTrayDialogProps {
  player: Player | null;
  onClose: () => void;
}

export const PlayerTrayDialog: React.FC<PlayerTrayDialogProps> = ({ player, onClose }) => {
  const open = Boolean(player);

  const roll = player?.metadata[getPluginId("roll")] as DiceRoll | undefined;
  const rollValues = player?.metadata[getPluginId("rollValues")] as Record<string, number> | undefined;

  const evaluation = useMemo(() => {
    if (!roll || !rollValues) return null;
    return evaluateDiceRoll(roll, rollValues);
  }, [roll, rollValues]);

  const diceList = useMemo(() => {
    if (!roll) return [];
    return getDieFromDice(roll);
  }, [roll]);

  const formula = useMemo(() => {
    if (!roll) return "";
    const counts: Record<string, number> = {};
    for (const d of diceList) {
      if (!d.isBless) {
        counts[d.type] = (counts[d.type] || 0) + 1;
      }
    }
    const parts = Object.entries(counts).map(([type, count]) => `${count}${type.toLowerCase()}`);
    let res = parts.join(" + ");
    if (roll.bonus) {
      res += roll.bonus > 0 ? ` + ${roll.bonus}` : ` - ${Math.abs(roll.bonus)}`;
    }
    return res;
  }, [roll, diceList]);

  const isCrit = evaluation?.crit20Ids && evaluation.crit20Ids.size > 0;
  const isFumble = evaluation?.fumble1Ids && evaluation.fumble1Ids.size > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            sx={{
              bgcolor: player?.color || "#6366f1",
              color: "#ffffff",
              width: 34,
              height: 34,
              fontWeight: 800,
            }}
          >
            {player?.name ? player.name[0].toUpperCase() : "?"}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {player?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Tirada más reciente
            </Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1, pb: 3 }}>
        {!roll ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body2" color="text.secondary">
              Este jugador aún no ha lanzado dados en esta sesión.
            </Typography>
          </Box>
        ) : roll.hidden ? (
          <Stack alignItems="center" py={4} spacing={1}>
            <VisibilityOffIcon sx={{ fontSize: 40, color: "text.secondary" }} />
            <Typography variant="body1" sx={{ fontWeight: 700 }}>
              Tirada Secreta
            </Typography>
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Esta tirada fue enviada de forma oculta al director de juego.
            </Typography>
          </Stack>
        ) : evaluation && rollValues ? (
          <Stack spacing={2} alignItems="center">
            {/* Header / Big Total */}
            <Stack alignItems="center" spacing={0.5}>
              {roll.name && (
                <Chip
                  label={roll.name}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    bgcolor: "rgba(245, 158, 11, 0.2)",
                    color: "#f59e0b",
                    border: "1px solid rgba(245, 158, 11, 0.4)",
                  }}
                />
              )}
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  color: isCrit ? "#facc15" : isFumble ? "#f87171" : "#f8fafc",
                  textShadow: isCrit
                    ? "0 0 20px rgba(250, 204, 21, 0.6)"
                    : isFumble
                    ? "0 0 20px rgba(239, 68, 68, 0.6)"
                    : "0 2px 10px rgba(0,0,0,0.5)",
                }}
              >
                {evaluation.total}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {formula}
              </Typography>
            </Stack>

            {/* 2D Dice Mat Preview */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                justifyContent: "center",
                alignItems: "center",
                p: 2,
                borderRadius: 3,
                bgcolor: "rgba(15, 23, 42, 0.6)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                width: "100%",
                maxHeight: 260,
                overflowY: "auto",
              }}
            >
              {diceList.map((die) => {
                const val = rollValues[die.id];
                const isDieCrit = evaluation.crit20Ids.has(die.id);
                const isDieFumble = evaluation.fumble1Ids.has(die.id);
                const isDiscarded = evaluation.discardedDieIds.has(die.id);
                const isBless = Boolean(die.isBless);

                return (
                  <DiceSvg
                    key={die.id}
                    type={die.type}
                    value={val}
                    size={52}
                    isCrit={isDieCrit}
                    isFumble={isDieFumble}
                    isDiscarded={isDiscarded}
                    isBless={isBless}
                  />
                );
              })}
            </Box>
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
