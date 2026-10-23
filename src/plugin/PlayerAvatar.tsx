import React, { useMemo } from "react";
import { Player } from "@owlbear-rodeo/sdk";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOffRounded";
import { getPluginId } from "./getPluginId";
import { DiceRoll } from "../types/DiceRoll";
import { evaluateDiceRoll } from "../helpers/diceMath";

interface PlayerAvatarProps {
  player: Player;
  onSelect: () => void;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, onSelect }) => {
  const roll = player.metadata[getPluginId("roll")] as DiceRoll | undefined;
  const rollValues = player.metadata[getPluginId("rollValues")] as Record<string, number> | undefined;

  const evaluation = useMemo(() => {
    if (!roll || !rollValues) return null;
    return evaluateDiceRoll(roll, rollValues);
  }, [roll, rollValues]);

  const isHidden = roll?.hidden;
  const badgeContent = isHidden ? (
    <VisibilityOffIcon sx={{ fontSize: 10 }} />
  ) : evaluation ? (
    evaluation.total
  ) : null;

  const isCrit = evaluation?.crit20Ids && evaluation.crit20Ids.size > 0;
  const isFumble = evaluation?.fumble1Ids && evaluation.fumble1Ids.size > 0;

  return (
    <Tooltip
      title={
        isHidden
          ? `${player.name} (Oculta)`
          : evaluation
          ? `${player.name}: ${evaluation.total}`
          : player.name
      }
      placement="right"
      enterDelay={350}
      arrow
    >
      <Stack alignItems="center" spacing={0.3} my={0.4}>
        <Badge
          badgeContent={badgeContent}
          color={isCrit ? "warning" : isFumble ? "error" : "primary"}
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{
            "& .MuiBadge-badge": {
              fontSize: "0.68rem",
              fontWeight: 900,
              height: 18,
              minWidth: 18,
              px: 0.5,
              border: "1.5px solid #0f172a",
              boxShadow: "0 2px 6px rgba(0,0,0,0.6)",
              bgcolor: isCrit ? "#eab308" : isFumble ? "#ef4444" : "#3b82f6",
              color: isCrit ? "#0f172a" : "#ffffff",
            },
          }}
        >
          <IconButton
            onClick={onSelect}
            sx={{
              p: 0.3,
              borderRadius: "50%",
              border: `2px solid ${player.color || "#6366f1"}`,
              transition: "transform 0.15s ease",
              "&:hover": {
                transform: "scale(1.12)",
                boxShadow: `0 0 10px ${player.color || "#6366f1"}`,
              },
            }}
          >
            <Avatar
              sx={{
                bgcolor: player.color || "#6366f1",
                color: "#ffffff",
                width: 30,
                height: 30,
                fontSize: "0.8rem",
                fontWeight: 800,
              }}
            >
              {player.name ? player.name[0].toUpperCase() : "?"}
            </Avatar>
          </IconButton>
        </Badge>
        <Typography
          variant="caption"
          sx={{
            fontSize: "0.6rem",
            color: "rgba(255, 255, 255, 0.7)",
            maxWidth: 44,
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.1,
          }}
        >
          {player.name}
        </Typography>
      </Stack>
    </Tooltip>
  );
};
