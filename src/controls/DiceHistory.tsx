import React, { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import HistoryIcon from "@mui/icons-material/HistoryRounded";
import ReplayIcon from "@mui/icons-material/ReplayRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import BookmarkAddIcon from "@mui/icons-material/BookmarkAddRounded";
import CheckIcon from "@mui/icons-material/CheckRounded";

import { useDiceHistoryStore, RecentRoll } from "./history";
import { useDiceRollStore } from "../dice/store";
import { useDiceControlsStore, getDiceToRoll } from "./store";
import { useSavedRollsStore } from "./savedRolls";

export const DiceHistory: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const open = Boolean(anchorEl);

  const recentRolls = useDiceHistoryStore((state) => state.recentRolls);
  const removeRoll = useDiceHistoryStore((state) => state.removeRecentRoll);
  const clearHistory = useDiceHistoryStore((state) => state.clearHistory);
  const startRoll = useDiceRollStore((state) => state.startRoll);
  const hidden = useDiceControlsStore((state) => state.diceHidden);
  const addRoll = useSavedRollsStore((state) => state.addRoll);

  const handleOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleRelaunch = (roll: RecentRoll) => {
    const dice = getDiceToRoll(
      roll.counts,
      roll.advantage,
      false,
      0,
      roll.damageType,
      roll.damageComponents
    );
    const timestamp = Date.now();
    startRoll({
      dice,
      bonus: roll.bonus,
      hidden,
      name: roll.name,
      isDamage: roll.isDamage,
      damageTypes: roll.damageTypes || (roll.damageType ? [roll.damageType] : undefined),
      recentRollId: `${timestamp}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp,
    });
    handleClose();
  };

  const handleSaveRoll = (roll: RecentRoll) => {
    addRoll({
      name: roll.name || "Tirada Guardada",
      group: roll.isDamage ? "Daño" : "Ataques",
      counts: roll.counts,
      bonus: roll.bonus,
      advantage: roll.advantage,
      isDamage: roll.isDamage,
      damageType: roll.damageType,
      damageComponents: roll.damageComponents,
    });
    setSavedIds((prev) => [...prev, roll.id]);
  };

  const formatFormula = (roll: RecentRoll) => {
    if (roll.damageComponents && roll.damageComponents.length > 0) {
      const parts = roll.damageComponents
        .filter((c) => c.count > 0)
        .map((c) => {
          const typeStr = `${c.count}${c.type.toLowerCase()}`;
          return c.damageType ? `${typeStr} ${c.damageType}` : typeStr;
        });
      let res = parts.join(" + ");
      if (roll.bonus !== 0) {
        res += roll.bonus > 0 ? ` + ${roll.bonus}` : ` - ${Math.abs(roll.bonus)}`;
      }
      if (roll.advantage === "SUPER_ADVANTAGE") res += " (Superventaja)";
      else if (roll.advantage === "ADVANTAGE") res += " (Ventaja)";
      else if (roll.advantage === "SUPER_DISADVANTAGE") res += " (Superdesventaja)";
      else if (roll.advantage === "DISADVANTAGE") res += " (Desventaja)";
      return res || "0";
    }

    const parts: string[] = [];
    for (const [type, count] of Object.entries(roll.counts)) {
      if (count && count > 0) {
        parts.push(`${count}${type.toLowerCase()}`);
      }
    }
    let res = parts.join(" + ");
    if (roll.bonus !== 0) {
      res += roll.bonus > 0 ? ` + ${roll.bonus}` : ` - ${Math.abs(roll.bonus)}`;
    }
    if (roll.advantage === "SUPER_ADVANTAGE") res += " (Superventaja)";
    else if (roll.advantage === "ADVANTAGE") res += " (Ventaja)";
    else if (roll.advantage === "SUPER_DISADVANTAGE") res += " (Superdesventaja)";
    else if (roll.advantage === "DISADVANTAGE") res += " (Desventaja)";
    return res || "0";
  };

  return (
    <>
      <Tooltip title="Historial Personal" placement="right" enterDelay={350} arrow>
        <span>
          <IconButton onClick={handleOpen} disabled={recentRolls.length === 0}>
            <HistoryIcon fontSize="small" />
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
            maxHeight: 440,
            p: 1.2,
            bgcolor: "#0b0f19",
            backgroundImage: "none",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: 2.5,
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.8)",
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" px={0.8} pb={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#f8fafc" }}>
            Tiradas Recientes
          </Typography>
          <Tooltip title="Limpiar historial">
            <IconButton size="small" onClick={clearHistory} sx={{ color: "text.secondary", "&:hover": { color: "#ef4444" } }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        <Divider sx={{ mb: 1, borderColor: "rgba(255, 255, 255, 0.08)" }} />

        {recentRolls.length === 0 ? (
          <Typography variant="caption" color="text.secondary" sx={{ p: 2, display: "block", textAlign: "center" }}>
            No hay tiradas recientes
          </Typography>
        ) : (
          recentRolls
            .slice()
            .reverse()
            .map((roll, idx) => {
              const originalIndex = recentRolls.length - 1 - idx;
              const isSaved = savedIds.includes(roll.id);

              return (
                <Box
                  key={roll.id || idx}
                  sx={{
                    borderRadius: 2,
                    mb: 0.8,
                    p: 1,
                    bgcolor: "rgba(30, 41, 59, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      bgcolor: "rgba(30, 41, 59, 0.8)",
                      borderColor: "rgba(255, 255, 255, 0.14)",
                    },
                  }}
                >
                  {/* Row 1: Roll Name, formula and optional result */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Stack sx={{ overflow: "hidden", minWidth: 0, flexGrow: 1 }}>
                      {roll.name && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.78rem",
                            color: "#f8fafc",
                            lineHeight: 1.2,
                          }}
                          noWrap
                        >
                          {roll.name}
                        </Typography>
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          mt: 0.2,
                        }}
                        noWrap
                      >
                        {formatFormula(roll)}
                      </Typography>
                    </Stack>

                    {roll.result !== undefined && (
                      <Chip
                        size="small"
                        label={roll.result}
                        sx={{
                          fontWeight: 900,
                          height: 20,
                          fontSize: "0.72rem",
                          bgcolor: "rgba(245, 158, 11, 0.2)",
                          color: "#f59e0b",
                          border: "1px solid rgba(245, 158, 11, 0.4)",
                          flexShrink: 0,
                        }}
                      />
                    )}
                  </Stack>

                  {/* Row 2: Action Buttons including "Guardar tirada" */}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={0.8}
                    pt={0.6}
                    sx={{ borderTop: "1px solid rgba(255, 255, 255, 0.05)" }}
                  >
                    <Button
                      size="small"
                      startIcon={
                        isSaved ? (
                          <CheckIcon sx={{ fontSize: "14px !important" }} />
                        ) : (
                          <BookmarkAddIcon sx={{ fontSize: "14px !important" }} />
                        )
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSaved) handleSaveRoll(roll);
                      }}
                      disabled={isSaved}
                      sx={{
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        py: 0.2,
                        px: 0.9,
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

                    <Stack direction="row" spacing={0.4} alignItems="center">
                      <Tooltip title="Volver a lanzar">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRelaunch(roll);
                          }}
                          sx={{
                            p: 0.4,
                            color: "#f59e0b",
                            "&:hover": { bgcolor: "rgba(245, 158, 11, 0.2)" },
                          }}
                        >
                          <ReplayIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar del historial">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRoll(originalIndex);
                          }}
                          sx={{
                            p: 0.4,
                            color: "text.secondary",
                            "&:hover": { color: "#ef4444", bgcolor: "rgba(239, 68, 68, 0.2)" },
                          }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Box>
              );
            })
        )}
      </Menu>
    </>
  );
};
