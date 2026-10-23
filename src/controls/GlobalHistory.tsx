import React, { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import PublicIcon from "@mui/icons-material/PublicRounded";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineRounded";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAddRounded";
import CheckIcon from "@mui/icons-material/CheckRounded";

import { useGlobalHistoryStore, GlobalRoll, isRollFresh } from "./globalHistoryStore";
import { useSavedRollsStore } from "./savedRolls";

const formatTimeAgo = (timestamp: number): string => {
  if (!timestamp) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (diffSec < 45) return "hace un momento";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin}m`;
  return "hace 1h";
};

export const GlobalHistory: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const open = Boolean(anchorEl);

  const globalRolls = useGlobalHistoryStore((state) => state.globalRolls);
  const currentRoomId = useGlobalHistoryStore((state) => state.currentRoomId);
  const clearGlobalHistory = useGlobalHistoryStore((state) => state.clearGlobalHistory);
  const addRoll = useSavedRollsStore((state) => state.addRoll);

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSaveGlobalRoll = (roll: GlobalRoll) => {
    addRoll({
      name: roll.name || `${roll.playerName} (Tirada)`,
      group: "Ataques",
      counts: roll.counts,
      bonus: roll.bonus,
      advantage: roll.advantage,
    });
    setSavedIds((prev) => [...prev, roll.id]);
  };

  const formatFormula = (roll: GlobalRoll) => {
    const parts: string[] = [];
    for (const [type, count] of Object.entries(roll.counts)) {
      if (count && count > 0) {
        parts.push(`${count}${type.toLowerCase()}`);
      }
    }
    let res = parts.join("+");
    if (roll.bonus !== 0) {
      res += roll.bonus > 0 ? `+${roll.bonus}` : `${roll.bonus}`;
    }
    return res;
  };

  // Orden cronológico estricto y aislamiento por mesa: solo tiradas de esta sala
  const freshRolls = globalRolls
    .filter((r) => isRollFresh(r.timestamp) && (!currentRoomId || !r.roomId || r.roomId === currentRoomId))
    .sort((a, b) => b.timestamp - a.timestamp || b.id.localeCompare(a.id));

  return (
    <>
      <Tooltip title="Historial de la Sala" placement="right" enterDelay={350} arrow>
        <span>
          <IconButton onClick={handleOpen} disabled={freshRolls.length === 0}>
            <PublicIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "center", horizontal: "right" }}
        transformOrigin={{ vertical: "center", horizontal: "left" }}
        PaperProps={{
          sx: {
            width: 320,
            maxHeight: 400,
            p: 1,
          },
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 1, pb: 0.8 }}>
          <Stack>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              Tiradas de la Sala
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.68rem" }}>
              Últimos 60 minutos
            </Typography>
          </Stack>
          {freshRolls.length > 0 && (
            <Tooltip title="Limpiar historial" enterDelay={300}>
              <IconButton
                size="small"
                onClick={() => {
                  clearGlobalHistory();
                  handleClose();
                }}
                sx={{ color: "text.secondary", "&:hover": { color: "#ef4444" } }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
        <Divider sx={{ mb: 1 }} />

        {freshRolls.length === 0 ? (
          <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: "block", textAlign: "center" }}>
            Aún no hay tiradas en los últimos 60 minutos
          </Typography>
        ) : (
          freshRolls.map((roll) => {
            const isSaved = savedIds.includes(roll.id);
            return (
              <MenuItem
                key={roll.id}
                disableRipple
                sx={{
                  cursor: "default",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  borderRadius: 2,
                  mb: 0.8,
                  p: 1,
                  bgcolor: "rgba(30, 41, 59, 0.4)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} width="100%">
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: roll.playerColor || "#f59e0b",
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="caption" sx={{ fontWeight: "bold", maxWidth: 100 }} noWrap>
                    {roll.playerName}
                  </Typography>
                  {roll.name && (
                    <Typography variant="caption" sx={{ color: "primary.main", maxWidth: 90 }} noWrap>
                      · {roll.name}
                    </Typography>
                  )}
                  <Box sx={{ flexGrow: 1 }} />
                  {roll.result !== undefined && (
                    <Chip
                      size="small"
                      label={roll.result}
                      sx={{
                        fontWeight: "bold",
                        height: 20,
                        bgcolor: roll.isCrit ? "#eab308" : roll.isFumble ? "#ef4444" : "rgba(255, 255, 255, 0.15)",
                        color: roll.isCrit ? "#0f172a" : "white",
                      }}
                    />
                  )}
                </Stack>
                <Stack direction="row" justifyContent="space-between" width="100%" sx={{ pl: 2.2, pt: 0.3 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatFormula(roll)}{" "}
                    {roll.advantage
                      ? `(${
                          roll.advantage === "SUPER_ADVANTAGE"
                            ? "S-Vent"
                            : roll.advantage === "ADVANTAGE"
                            ? "Vent"
                            : roll.advantage === "SUPER_DISADVANTAGE"
                            ? "S-Desv"
                            : "Desv"
                        })`
                      : ""}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: "0.65rem", color: "text.disabled" }}>
                    {formatTimeAgo(roll.timestamp)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="flex-end" width="100%" sx={{ pt: 0.5 }}>
                  <Button
                    size="small"
                    startIcon={
                      isSaved ? (
                        <CheckIcon sx={{ fontSize: "13px !important" }} />
                      ) : (
                        <BookmarkAddIcon sx={{ fontSize: "13px !important" }} />
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isSaved) handleSaveGlobalRoll(roll);
                    }}
                    disabled={isSaved}
                    sx={{
                      fontSize: "0.65rem",
                      fontWeight: 800,
                      py: 0.15,
                      px: 0.8,
                      textTransform: "none",
                      borderRadius: 1.5,
                      color: isSaved ? "#4ade80 !important" : "#38bdf8",
                      bgcolor: isSaved ? "rgba(74, 222, 128, 0.15) !important" : "rgba(56, 189, 248, 0.12)",
                      border: `1px solid ${isSaved ? "rgba(74, 222, 128, 0.4)" : "rgba(56, 189, 248, 0.35)"}`,
                      "&:hover": {
                        bgcolor: "rgba(56, 189, 248, 0.25)",
                      },
                    }}
                  >
                    {isSaved ? "Guardada" : "Guardar tirada"}
                  </Button>
                </Stack>
              </MenuItem>
            );
          })
        )}
      </Menu>
    </>
  );
};
