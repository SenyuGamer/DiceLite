import React, { useRef, useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Chip from "@mui/material/Chip";
import Fade from "@mui/material/Fade";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ReplayIcon from "@mui/icons-material/ReplayRounded";
import ClearIcon from "@mui/icons-material/CloseRounded";
import CasinoIcon from "@mui/icons-material/CasinoRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesomeRounded";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import AddIcon from "@mui/icons-material/AddRounded";
import RemoveIcon from "@mui/icons-material/RemoveRounded";

import { useDiceRollStore } from "../dice/store";
import { useDiceControlsStore, getDiceToRoll, RollMode, Advantage } from "../controls/store";
import { useSettingsStore } from "../controls/settingsStore";
import { DiceSvg } from "./dice/DiceSvg";
import { getDieFromDice } from "../helpers/getDieFromDice";
import { useDiceHistoryStore } from "../controls/history";
import { Die } from "../types/Die";
import { DAMAGE_TYPES, detectDamageType } from "../utils/damageTypes";

interface RolledDieItemProps {
  die: Die;
  val: number;
  size?: number;
  isCrit: boolean;
  isFumble: boolean;
  isDiscarded: boolean;
  isBless: boolean;
  isRolling: boolean;
  onReroll: () => void;
  onDelete: () => void;
}

const RolledDieItem: React.FC<RolledDieItemProps> = ({
  die,
  val,
  size = 68,
  isCrit,
  isFumble,
  isDiscarded,
  isBless,
  isRolling,
  onReroll,
  onDelete,
}) => {
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchTriggeredRef = useRef(false);

  const handleTouchStart = () => {
    touchTriggeredRef.current = false;
    touchTimerRef.current = setTimeout(() => {
      touchTriggeredRef.current = true;
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(60);
      }
      onDelete();
    }, 450);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
    // If long-press was already triggered, prevent the reroll tap
    if (touchTriggeredRef.current) {
      e.preventDefault();
    }
  };

  const handleTouchMove = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  const dieName = die.type.toLowerCase(); // e.g. "d10"
  const damageDef =
    die.damageTypeKey && DAMAGE_TYPES[die.damageTypeKey]
      ? DAMAGE_TYPES[die.damageTypeKey]
      : die.damageType
      ? detectDamageType(die.damageType)
      : null;

  const tooltipTitle = (
    <Stack spacing={0.2} alignItems="center" sx={{ px: 0.8, py: 0.4 }}>
      <Typography
        variant="body2"
        sx={{
          fontWeight: 800,
          fontSize: "0.85rem",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          gap: 0.6,
        }}
      >
        <span style={{ textTransform: "lowercase", letterSpacing: 0.5 }}>
          {dieName}
        </span>
        {damageDef ? (
          <span style={{ color: damageDef.color, fontWeight: 700 }}>
            • {damageDef.emoji} {die.damageType || damageDef.name}
          </span>
        ) : die.isBless ? (
          <span style={{ color: "#38bdf8", fontWeight: 700 }}>
            • ✨ Bless
          </span>
        ) : isDiscarded ? (
          <span style={{ color: "#94a3b8", fontWeight: 700 }}>
            • Descartado
          </span>
        ) : null}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontSize: "0.72rem",
          color: "#94a3b8",
          fontWeight: 500,
        }}
      >
        Clic para rerollear
      </Typography>
    </Stack>
  );

  return (
    <Tooltip
      title={tooltipTitle}
      arrow
      placement="top"
      enterDelay={120}
      leaveDelay={80}
      componentsProps={{
        tooltip: {
          sx: {
            pointerEvents: "none",
            bgcolor: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(4px)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            borderRadius: 2,
          },
        },
        arrow: {
          sx: {
            color: "rgba(15, 23, 42, 0.95)",
          },
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "inline-flex",
          flexDirection: "column",
          alignItems: "center",
          transition: "filter 0.15s ease",
          cursor: "pointer",
          userSelect: "none",
          "&:hover": {
            filter: "brightness(1.18)",
          },
          "&:hover .die-delete-badge": {
            opacity: 1,
            transform: "scale(1)",
          },
        }}
        onClick={(e) => {
          e.stopPropagation();
          onReroll();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onTouchCancel={handleTouchMove}
      >
        {/* Floating Delete Badge on Hover (Desktop) */}
        <Tooltip title="Eliminar dado" arrow placement="top" enterDelay={200}>
          <Box
            component="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="die-delete-badge"
            aria-label="Borrar dado"
            sx={{
              position: "absolute",
              top: -6,
              right: -6,
              width: 20,
              height: 20,
              borderRadius: "50%",
              bgcolor: "#ef4444",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid rgba(255, 255, 255, 0.6)",
              boxShadow: "0 2px 6px rgba(0, 0, 0, 0.5)",
              cursor: "pointer",
              opacity: 0,
              transform: "scale(0.7)",
              transition: "all 0.15s ease-in-out",
              zIndex: 10,
              p: 0,
              "&:hover": {
                bgcolor: "#dc2626",
                transform: "scale(1.15) !important",
              },
            }}
          >
            <ClearIcon sx={{ fontSize: 13 }} />
          </Box>
        </Tooltip>

        {/* Die SVG */}
        <DiceSvg
          type={die.type}
          value={val}
          size={size}
          isCrit={isCrit}
          isFumble={isFumble}
          isDiscarded={isDiscarded}
          isBless={isBless}
          color={die.color}
          fillColor={die.fillColor}
          rolling={isRolling}
          onClick={onReroll}
        />

        {/* Bless Pill if applicable */}
        {isBless && (
          <Chip
            label="✨ Bless"
            size="small"
            sx={{
              height: 18,
              fontSize: "0.62rem",
              fontWeight: 800,
              bgcolor: "rgba(56, 189, 248, 0.25)",
              color: "#38bdf8",
              border: "1px solid rgba(56, 189, 248, 0.6)",
              mt: 0.5,
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
};

interface QuickAccessControlsProps {
  rollMode: RollMode;
  setRollMode: (mode: RollMode) => void;
  advantage: Advantage;
  setDiceAdvantage: (advantage: Advantage) => void;
  enableSuperAdvantage: boolean;
  blessActive: boolean;
  blessCount: number;
  setBlessActive: (active: boolean) => void;
  setBlessCount: (count: number) => void;
  bonus: number;
  setDiceBonus: (bonus: number) => void;
  onResetAll: () => void;
}

const QuickAccessControls: React.FC<QuickAccessControlsProps> = ({
  rollMode,
  setRollMode,
  advantage,
  setDiceAdvantage,
  enableSuperAdvantage,
  blessActive,
  blessCount,
  setBlessActive,
  setBlessCount,
  bonus,
  setDiceBonus,
  onResetAll,
}) => {
  return (
    <Stack
      spacing={1}
      alignItems="center"
      justifyContent="center"
      onClick={(e) => e.stopPropagation()}
      sx={{ width: "100%", maxWidth: 360 }}
    >
      {/* Fila 1: Modo (Prueba / Daño) & Selector de Ventaja */}
      <Stack
        direction="row"
        spacing={0.8}
        alignItems="center"
        justifyContent="center"
      >
        {/* Selector de Modo */}
        <ToggleButtonGroup
          value={rollMode}
          exclusive
          onChange={(_, val) => {
            if (val) setRollMode(val);
          }}
          size="small"
          sx={{
            height: 34,
            backgroundColor: "rgba(30, 41, 59, 0.75)",
            backdropFilter: "blur(6px)",
            borderRadius: 3,
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.25)",
            "& .MuiToggleButton-root": {
              py: 0,
              px: 0.9,
              height: "100%",
              fontWeight: 800,
              fontSize: "0.74rem",
              color: "#94a3b8",
              textTransform: "none",
              border: "none",
              borderRadius: 3,
              boxSizing: "border-box",
            },
          }}
        >
          <ToggleButton
            value="CHECK"
            sx={{
              "&.Mui-selected": {
                backgroundColor: "rgba(59, 130, 246, 0.25) !important",
                color: "#60a5fa !important",
              },
            }}
          >
            🎯 Prueba
          </ToggleButton>
          <ToggleButton
            value="DAMAGE"
            sx={{
              "&.Mui-selected": {
                backgroundColor: "rgba(239, 68, 68, 0.25) !important",
                color: "#f87171 !important",
              },
            }}
          >
            ⚔️ Daño
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Selector de Ventaja con Normal al centro */}
        <ToggleButtonGroup
          value={advantage ?? "NORMAL"}
          exclusive
          onChange={(_, val) => {
            if (val === "NORMAL" || val === null) {
              setDiceAdvantage(null);
            } else {
              setDiceAdvantage(val);
            }
          }}
          size="small"
          sx={{
            height: 34,
            backgroundColor: "rgba(30, 41, 59, 0.75)",
            backdropFilter: "blur(6px)",
            borderRadius: 3,
            border: advantage
              ? advantage.includes("ADVANTAGE")
                ? "1px solid #22c55e"
                : "1px solid #ef4444"
              : "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: advantage
              ? advantage.includes("ADVANTAGE")
                ? "0 0 10px rgba(34, 197, 94, 0.35)"
                : "0 0 10px rgba(239, 68, 68, 0.35)"
              : "0 2px 10px rgba(0, 0, 0, 0.25)",
            transition: "border-color 0.15s, box-shadow 0.15s",
            "& .MuiToggleButton-root": {
              py: 0,
              px: enableSuperAdvantage ? 0.6 : 0.8,
              height: "100%",
              minWidth: enableSuperAdvantage ? 34 : 40,
              fontWeight: 800,
              fontSize: enableSuperAdvantage ? "0.7rem" : "0.74rem",
              color: "#94a3b8",
              textTransform: "none",
              border: "none",
              borderRadius: 3,
              boxSizing: "border-box",
            },
          }}
        >
          {enableSuperAdvantage && (
            <Tooltip title="Superdesventaja" arrow enterDelay={350}>
              <ToggleButton
                value="SUPER_DISADVANTAGE"
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "rgba(239, 68, 68, 0.35) !important",
                    color: "#fca5a5 !important",
                  },
                }}
              >
                S-Desv
              </ToggleButton>
            </Tooltip>
          )}
          <Tooltip title="Desventaja" arrow enterDelay={350}>
            <ToggleButton
              value="DISADVANTAGE"
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "rgba(239, 68, 68, 0.25) !important",
                  color: "#f87171 !important",
                },
              }}
            >
              Desv
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Tirada normal" arrow enterDelay={350}>
            <ToggleButton
              value="NORMAL"
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "rgba(255, 255, 255, 0.12) !important",
                  color: "#e2e8f0 !important",
                },
              }}
            >
              Normal
            </ToggleButton>
          </Tooltip>
          <Tooltip title="Ventaja" arrow enterDelay={350}>
            <ToggleButton
              value="ADVANTAGE"
              sx={{
                "&.Mui-selected": {
                  backgroundColor: "rgba(34, 197, 94, 0.25) !important",
                  color: "#4ade80 !important",
                },
              }}
            >
              Vent
            </ToggleButton>
          </Tooltip>
          {enableSuperAdvantage && (
            <Tooltip title="Superventaja" arrow enterDelay={350}>
              <ToggleButton
                value="SUPER_ADVANTAGE"
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "rgba(34, 197, 94, 0.35) !important",
                    color: "#86efac !important",
                  },
                }}
              >
                S-Vent
              </ToggleButton>
            </Tooltip>
          )}
        </ToggleButtonGroup>
      </Stack>

      {/* Fila 2: Bless (Acumulable) & Bono */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent="center"
      >
        {/* Bless Stepper Pill (Acumulable y tamaño fijo) */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            height: 34,
            backgroundColor: "rgba(30, 41, 59, 0.75)",
            backdropFilter: "blur(6px)",
            borderRadius: 3,
            border: blessActive
              ? "1px solid #38bdf8"
              : "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: blessActive
              ? "0 0 10px rgba(56, 189, 248, 0.35)"
              : "0 2px 10px rgba(0, 0, 0, 0.25)",
            px: 0.4,
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        >
          <Tooltip title="-1d4 Bless" enterDelay={400}>
            <span>
              <IconButton
                size="small"
                disabled={!blessActive}
                onClick={(e) => {
                  e.stopPropagation();
                  if (blessCount > 1) {
                    setBlessCount(blessCount - 1);
                  } else {
                    setBlessActive(false);
                  }
                }}
                sx={{
                  width: 24,
                  height: 24,
                  color: blessActive ? "#94a3b8" : "rgba(148, 163, 184, 0.25)",
                  "&:hover": {
                    color: "#f87171",
                    bgcolor: "rgba(239, 68, 68, 0.15)",
                  },
                }}
              >
                <RemoveIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip
            title={blessActive ? "Clic para desactivar Bless" : "Clic para activar Bless (+1d4)"}
            enterDelay={400}
          >
            <Box
              onClick={(e) => {
                e.stopPropagation();
                setBlessActive(!blessActive);
              }}
              sx={{
                px: 0.8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
                userSelect: "none",
                minWidth: 88,
              }}
            >
              <AutoAwesomeIcon
                sx={{
                  fontSize: 15,
                  color: blessActive ? "#38bdf8" : "#94a3b8",
                  filter: blessActive ? "drop-shadow(0 0 4px #38bdf8)" : "none",
                }}
              />
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 800,
                  fontSize: "0.76rem",
                  color: blessActive ? "#38bdf8" : "#94a3b8",
                  whiteSpace: "nowrap",
                }}
              >
                {blessActive ? `Bless +${blessCount}d4` : "Bless +1d4"}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="+1d4 Bless (acumular)" enterDelay={400}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                if (!blessActive) {
                  setBlessActive(true);
                } else {
                  setBlessCount(blessCount + 1);
                }
              }}
              sx={{
                width: 24,
                height: 24,
                color: blessActive ? "#38bdf8" : "#94a3b8",
                "&:hover": {
                  color: "#38bdf8",
                  bgcolor: "rgba(56, 189, 248, 0.15)",
                },
              }}
            >
              <AddIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Quick Bonus Stepper Pill */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            height: 34,
            backgroundColor: "rgba(30, 41, 59, 0.75)",
            backdropFilter: "blur(6px)",
            borderRadius: 3,
            border:
              bonus !== 0
                ? "1px solid #f59e0b"
                : "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow:
              bonus !== 0
                ? "0 0 10px rgba(245, 158, 11, 0.35)"
                : "0 2px 10px rgba(0, 0, 0, 0.25)",
            px: 0.4,
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
        >
          <Tooltip title="-1 al bono" enterDelay={400}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setDiceBonus(bonus - 1);
              }}
              sx={{
                width: 24,
                height: 24,
                color: "#94a3b8",
                "&:hover": {
                  color: "#f87171",
                  bgcolor: "rgba(239, 68, 68, 0.15)",
                },
              }}
            >
              <RemoveIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Clic para restablecer a 0" enterDelay={400}>
            <Box
              onClick={(e) => {
                e.stopPropagation();
                setDiceBonus(0);
              }}
              sx={{
                px: 0.8,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.4,
                userSelect: "none",
                minWidth: 64,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.68rem",
                  color: "#94a3b8",
                }}
              >
                Bono:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 900,
                  fontSize: "0.8rem",
                  minWidth: 20,
                  textAlign: "center",
                  color:
                    bonus > 0 ? "#f59e0b" : bonus < 0 ? "#ef4444" : "#cbd5e1",
                }}
              >
                {bonus > 0 ? `+${bonus}` : `${bonus}`}
              </Typography>
            </Box>
          </Tooltip>

          <Tooltip title="+1 al bono" enterDelay={400}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setDiceBonus(bonus + 1);
              }}
              sx={{
                width: 24,
                height: 24,
                color: "#94a3b8",
                "&:hover": {
                  color: "#34d399",
                  bgcolor: "rgba(52, 211, 153, 0.15)",
                },
              }}
            >
              <AddIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Botón X: Resetear todo debajo de todo */}
      <Tooltip title="Resetear todo" arrow enterDelay={350}>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onResetAll();
          }}
          sx={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            backgroundColor: "rgba(30, 41, 59, 0.7)",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#94a3b8",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
            transition: "all 0.15s ease-in-out",
            "&:hover": {
              backgroundColor: "rgba(239, 68, 68, 0.2)",
              borderColor: "rgba(239, 68, 68, 0.5)",
              color: "#f87171",
              transform: "scale(1.1)",
            },
          }}
        >
          <ClearIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
};

export const DiceMat: React.FC = () => {
  const roll = useDiceRollStore((state) => state.roll);
  const rollValues = useDiceRollStore((state) => state.rollValues);
  const evaluation = useDiceRollStore((state) => state.evaluation);
  const isRolling = useDiceRollStore((state) => state.isRolling);
  const rollingDieIds = useDiceRollStore((state) => state.rollingDieIds);
  const clearRoll = useDiceRollStore((state) => state.clearRoll);
  const reroll = useDiceRollStore((state) => state.reroll);
  const removeDieFromRoll = useDiceRollStore((state) => state.removeDieFromRoll);

  const counts = useDiceControlsStore((state) => state.diceCounts);
  const bonus = useDiceControlsStore((state) => state.diceBonus);
  const setDiceBonus = useDiceControlsStore((state) => state.setDiceBonus);
  const advantage = useDiceControlsStore((state) => state.diceAdvantage);
  const setDiceAdvantage = useDiceControlsStore((state) => state.setDiceAdvantage);
  const hidden = useDiceControlsStore((state) => state.diceHidden);
  const blessActive = useDiceControlsStore((state) => state.blessActive);
  const blessCount = useDiceControlsStore((state) => state.blessCount);
  const setBlessActive = useDiceControlsStore((state) => state.setBlessActive);
  const setBlessCount = useDiceControlsStore((state) => state.setBlessCount);
  const rollMode = useDiceControlsStore((state) => state.rollMode);
  const setRollMode = useDiceControlsStore((state) => state.setRollMode);
  const resetDiceCounts = useDiceControlsStore((state) => state.resetDiceCounts);
  const resetAll = useDiceControlsStore((state) => state.resetAll);
  const enableSuperAdvantage = useSettingsStore((state) => state.enableSuperAdvantage);
  const startRoll = useDiceRollStore((state) => state.startRoll);
  const pushRecentRoll = useDiceHistoryStore((state) => state.pushRecentRoll);

  const hasSelectedDice = Object.values(counts).some((c) => c > 0);
  const diceList = roll ? getDieFromDice(roll) : [];

  const handleResetAll = () => {
    resetAll();
    clearRoll();
  };

  const handleLaunchSelected = () => {
    if (!hasSelectedDice) return;
    const dice = getDiceToRoll(counts, advantage, blessActive, blessCount);
    const timestamp = Date.now();
    const recentRollId = `${timestamp}-${Math.random().toString(36).substring(2, 7)}`;

    const isDamage = rollMode === "DAMAGE";
    startRoll({
      dice,
      bonus,
      hidden,
      isDamage,
      recentRollId,
      timestamp,
    });

    pushRecentRoll({
      id: recentRollId,
      counts: { ...counts },
      bonus,
      advantage,
      timestamp,
      isDamage,
    });

    resetDiceCounts();
  };

  const handleRerollAll = () => {
    reroll();
  };

  const handleRerollSingle = (dieId: string) => {
    reroll([dieId]);
  };

  const handleDeleteDie = (dieId: string) => {
    removeDieFromRoll(dieId);
  };

  const hasCrit = evaluation?.crit20Ids && evaluation.crit20Ids.size > 0;
  const hasFumble = evaluation?.fumble1Ids && evaluation.fumble1Ids.size > 0;

  // Calculate damage breakdown by damage type for active (non-discarded) dice
  const damageBreakdown = useMemo(() => {
    if (!roll || !evaluation) return null;

    const breakdown: Record<string, { total: number; color?: string; count: number }> = {};
    let hasDamageType = false;

    for (const die of diceList) {
      if (evaluation.discardedDieIds.has(die.id)) continue;
      const val = rollValues[die.id] ?? 0;
      const typeName = die.damageType || (roll.isDamage ? "Daño" : "");
      if (typeName) {
        hasDamageType = true;
        if (!breakdown[typeName]) {
          breakdown[typeName] = { total: 0, color: die.color, count: 0 };
        }
        breakdown[typeName].total += val;
        breakdown[typeName].count += 1;
      }
    }

    if (!hasDamageType) return null;

    // Distribute flat roll bonus if present to first damage type
    if (roll.bonus !== 0) {
      const keys = Object.keys(breakdown);
      if (keys.length > 0) {
        breakdown[keys[0]].total += roll.bonus;
      }
    }

    return breakdown;
  }, [roll, evaluation, diceList, rollValues]);

  const breakdownTooltipText = useMemo(() => {
    if (damageBreakdown) {
      const parts = Object.entries(damageBreakdown).map(
        ([type, data]) => `${data.total} de ${type.toLowerCase()}`
      );
      return parts.join(", ");
    }
    if (roll && roll.bonus !== 0 && evaluation) {
      return `${evaluation.total - roll.bonus} (dados) ${roll.bonus > 0 ? `+ ${roll.bonus}` : `- ${Math.abs(roll.bonus)}`} (bono)`;
    }
    return "Total de la tirada";
  }, [damageBreakdown, roll, evaluation]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        px: 1,
        py: 1.5,
        overflow: "hidden",
        cursor: !roll && hasSelectedDice ? "pointer" : "default",
      }}
      onClick={(e) => {
        // Clicking directly on the empty mat launches picked dice
        if (e.target === e.currentTarget && !roll && hasSelectedDice) {
          handleLaunchSelected();
        }
      }}
    >
      {/* ── TOP BAR: Action Title & Big Result ── */}
      {roll && evaluation ? (
        <Fade in timeout={250}>
          <Stack
            alignItems="center"
            spacing={0.5}
            sx={{
              mt: 1,
              py: 1,
              px: 3,
              borderRadius: 3,
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
              zIndex: 10,
            }}
          >
            {/* Title / Action / Character */}
            {(roll.name || (roll.characterName && !/^(unknown|unknow|undefined|null)$/i.test(roll.characterName))) && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body1" sx={{ color: "primary.main", fontWeight: 700 }}>
                  {roll.characterName && !/^(unknown|unknow|undefined|null)$/i.test(roll.characterName)
                    ? `${roll.characterName}: `
                    : ""}
                  {roll.name || "Tirada"}
                </Typography>
                {roll.hidden && (
                  <Chip
                    label="Oculta (GM)"
                    size="small"
                    sx={{ bgcolor: "#7c3aed", color: "white", fontSize: "0.65rem", fontWeight: 700, height: 18 }}
                  />
                )}
              </Stack>
            )}

            {/* Big Total with Damage Breakdown Hover Tooltip */}
            <Tooltip
              title={
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "0.82rem", p: 0.3 }}>
                  {breakdownTooltipText}
                </Typography>
              }
              arrow
              placement="bottom"
              enterDelay={100}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ cursor: "pointer" }}>
                <Typography
                  variant="h2"
                  component="div"
                  sx={{
                    fontWeight: 900,
                    lineHeight: 1,
                    color: hasCrit ? "#facc15" : hasFumble ? "#f87171" : "#ffffff",
                    textShadow: hasCrit
                      ? "0 0 24px rgba(250, 204, 21, 0.7)"
                      : hasFumble
                      ? "0 0 24px rgba(248, 113, 113, 0.7)"
                      : "0 2px 12px rgba(0,0,0,0.6)",
                  }}
                >
                  {evaluation.total}
                </Typography>

                {roll.bonus !== 0 && (
                  <Typography variant="h5" sx={{ color: "text.secondary", fontWeight: 700 }}>
                    ({roll.bonus > 0 ? `+${roll.bonus}` : roll.bonus})
                  </Typography>
                )}

                {hasCrit && (
                  <Chip
                    label="¡CRÍTICO!"
                    sx={{
                      bgcolor: "#eab308",
                      color: "#0f172a",
                      fontWeight: 900,
                      fontSize: "0.75rem",
                      letterSpacing: 1,
                      height: 24,
                    }}
                  />
                )}
                {hasFumble && !hasCrit && (
                  <Chip
                    label="PIFIA"
                    sx={{
                      bgcolor: "#ef4444",
                      color: "white",
                      fontWeight: 900,
                      fontSize: "0.75rem",
                      letterSpacing: 1,
                      height: 24,
                    }}
                  />
                )}
              </Stack>
            </Tooltip>

            {/* Damage Type Badges if multiple damage types exist */}
            {damageBreakdown && Object.keys(damageBreakdown).length > 1 && (
              <Stack direction="row" spacing={0.6} alignItems="center" mt={0.3}>
                {Object.entries(damageBreakdown).map(([type, data]) => (
                  <Chip
                    key={type}
                    label={`${data.total} ${type}`}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      color: data.color || "#f8fafc",
                      bgcolor: data.color ? `${data.color}22` : "rgba(255,255,255,0.08)",
                      border: `1px solid ${data.color || "rgba(255,255,255,0.2)"}`,
                    }}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Fade>
      ) : (
        <div /> /* Placeholder to maintain flex spacing */
      )}

      {/* ── CENTER AREA: Dice directly on the table ── */}
      <Box
        sx={{
          flexGrow: 1,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflowY: "auto",
          p: 2,
        }}
      >
        {roll && evaluation ? (
          <Fade in timeout={300}>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: diceList.length > 8 ? 1.2 : 2,
                justifyContent: "center",
                alignItems: "center",
                maxWidth: "90%",
                maxHeight: "65vh",
                overflowY: "auto",
                p: 1,
              }}
            >
              {(() => {
                const adaptiveDieSize =
                  diceList.length <= 4
                    ? 68
                    : diceList.length <= 8
                    ? 56
                    : diceList.length <= 16
                    ? 48
                    : 40;

                return diceList.map((die) => {
                  const val = rollValues[die.id];
                  const isCrit = evaluation.crit20Ids.has(die.id);
                  const isFumble = evaluation.fumble1Ids.has(die.id);
                  const isDiscarded = evaluation.discardedDieIds.has(die.id);
                  const isBless = Boolean(die.isBless);
                  const isDieRolling = rollingDieIds?.includes(die.id) ?? false;

                  return (
                    <RolledDieItem
                      key={die.id}
                      die={die}
                      val={val}
                      size={adaptiveDieSize}
                      isCrit={isCrit}
                      isFumble={isFumble}
                      isDiscarded={isDiscarded}
                      isBless={isBless}
                      isRolling={isDieRolling}
                      onReroll={() => handleRerollSingle(die.id)}
                      onDelete={() => handleDeleteDie(die.id)}
                    />
                  );
                });
              })()}
            </Box>
          </Fade>
        ) : hasSelectedDice ? (
          /* Ready to roll prompt right in the middle of the table with quick toggles */
          <Fade in timeout={200}>
            <Stack alignItems="center" spacing={1.8}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleLaunchSelected}
                startIcon={<CasinoIcon sx={{ fontSize: 36 }} />}
                sx={{
                  px: 5,
                  py: 2,
                  borderRadius: 4,
                  fontSize: "1.25rem",
                  fontWeight: 900,
                  letterSpacing: 1.2,
                  boxShadow: "0 8px 32px rgba(245, 158, 11, 0.5)",
                  "&:hover": {
                    transform: "scale(1.05)",
                    boxShadow: "0 12px 40px rgba(245, 158, 11, 0.7)",
                  },
                  transition: "all 0.15s ease-in-out",
                }}
              >
                Lanzar Dados
              </Button>

              {/* Quick-Access Row: Modo, Ventaja/Desventaja, Bless & Bono */}
              <QuickAccessControls
                rollMode={rollMode}
                setRollMode={setRollMode}
                advantage={advantage}
                setDiceAdvantage={setDiceAdvantage}
                enableSuperAdvantage={enableSuperAdvantage}
                blessActive={blessActive}
                blessCount={blessCount}
                setBlessActive={setBlessActive}
                setBlessCount={setBlessCount}
                bonus={bonus}
                setDiceBonus={setDiceBonus}
                onResetAll={handleResetAll}
              />
            </Stack>
          </Fade>
        ) : (
          /* Subtle hint when table is completely empty with quick-access controls ready */
          <Fade in timeout={200}>
            <Stack alignItems="center" spacing={2.5}>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  opacity: 0.45,
                  fontWeight: 500,
                  pointerEvents: "none",
                  textAlign: "center",
                }}
              >
                Selecciona dados a la izquierda o una tirada guardada a la derecha
              </Typography>

              <QuickAccessControls
                rollMode={rollMode}
                setRollMode={setRollMode}
                advantage={advantage}
                setDiceAdvantage={setDiceAdvantage}
                enableSuperAdvantage={enableSuperAdvantage}
                blessActive={blessActive}
                blessCount={blessCount}
                setBlessActive={setBlessActive}
                setBlessCount={setBlessCount}
                bonus={bonus}
                setDiceBonus={setDiceBonus}
                onResetAll={handleResetAll}
              />
            </Stack>
          </Fade>
        )}
      </Box>

      {/* ── BOTTOM FLOATING ACTION BAR: Relanzar & Limpiar ── */}
      {roll && evaluation ? (
        <Fade in timeout={250}>
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              mb: 1.5,
              py: 0.8,
              px: 2,
              borderRadius: 3,
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
              zIndex: 10,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="small"
              startIcon={<ReplayIcon />}
              onClick={handleRerollAll}
              sx={{ fontWeight: 800, borderRadius: 2, px: 2 }}
            >
              Relanzar
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearRoll}
              sx={{
                borderRadius: 2,
                opacity: 0.75,
                "&:hover": { opacity: 1, backgroundColor: "rgba(255, 255, 255, 0.08)" },
              }}
            >
              Limpiar
            </Button>
          </Stack>
        </Fade>
      ) : (
        <div /> /* Placeholder to maintain flex spacing */
      )}
    </Box>
  );
};
