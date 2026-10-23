import React, { useState, useRef } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Popper from "@mui/material/Popper";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import SimpleBar from "simplebar-react";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownwardRounded";

import { useSavedRollsStore, SavedRoll } from "./savedRolls";
import { useDiceRollStore } from "../dice/store";
import { useDiceControlsStore, getDiceToRoll, Advantage } from "./store";
import { useSettingsStore } from "./settingsStore";
import { DiceType } from "../types/DiceType";
import { detectDamageType } from "../utils/damageTypes";

const formatCompactFormula = (roll: SavedRoll) => {
  if (roll.damageComponents && roll.damageComponents.length > 0) {
    const parts = roll.damageComponents
      .filter((c) => c.count > 0)
      .map((c) => `${c.count}${c.type.toLowerCase()}`);
    let res = parts.join("+");
    if (roll.bonus !== 0) {
      res += roll.bonus > 0 ? `+${roll.bonus}` : `${roll.bonus}`;
    }
    return res || "0";
  }

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
  return res || "0";
};

const formatFormula = (roll: SavedRoll) => {
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
    return res || "0";
  }

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
  return res || "0";
};

interface QuickRollItemProps {
  roll: SavedRoll;
  groupColor: string;
}

const QuickRollItem: React.FC<QuickRollItemProps> = ({ roll, groupColor }) => {
  const [expanded, setExpanded] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const startRoll = useDiceRollStore((state) => state.startRoll);
  const hidden = useDiceControlsStore((state) => state.diceHidden);
  const activeBonus = useDiceControlsStore((state) => state.diceBonus);
  const blessActive = useDiceControlsStore((state) => state.blessActive);
  const blessCount = useDiceControlsStore((state) => state.blessCount);
  const setRollMode = useDiceControlsStore((state) => state.setRollMode);
  const enableSuperAdvantage = useSettingsStore((state) => state.enableSuperAdvantage);

  const executeRoll = (adv: Advantage) => {
    // Bless only applies to test/check/attack rolls, NEVER to damage rolls
    const shouldAddBless = Boolean(!roll.isDamage && blessActive);

    // Combines the saved roll's fixed bonus + any active quick bonus
    const totalBonus = roll.bonus + activeBonus;

    const dice = getDiceToRoll(
      roll.counts,
      adv,
      shouldAddBless,
      blessCount || 1,
      roll.damageType,
      roll.damageComponents
    );

    const rollDamageTypes: string[] = [];
    if (roll.damageComponents && roll.damageComponents.length > 0) {
      for (const comp of roll.damageComponents) {
        if (comp.damageType) {
          const def = detectDamageType(comp.damageType);
          const name = def ? def.name : comp.damageType;
          if (!rollDamageTypes.includes(name)) rollDamageTypes.push(name);
        }
      }
    } else if (roll.damageType) {
      const def = detectDamageType(roll.damageType);
      rollDamageTypes.push(def ? def.name : roll.damageType);
    }

    const timestamp = Date.now();
    const recentRollId = `${timestamp}-${Math.random().toString(36).substring(2, 7)}`;

    startRoll({
      dice,
      bonus: totalBonus,
      hidden,
      name: roll.name,
      isDamage: roll.isDamage,
      damageTypes: rollDamageTypes.length > 0 ? rollDamageTypes : undefined,
      recentRollId,
      timestamp,
    });

    // Update active rollMode without modifying the saved roll definition
    setRollMode(roll.isDamage ? "DAMAGE" : "CHECK");
    setExpanded(false);
  };

  const tooltipText = `${roll.name} (${formatFormula(roll)})`;

  return (
    <ClickAwayListener onClickAway={() => setExpanded(false)}>
      <Box sx={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
        <Tooltip
          title={tooltipText}
          placement="left"
          enterDelay={350}
          arrow
        >
          <IconButton
            ref={anchorRef}
            onClick={() => setExpanded((prev) => !prev)}
            sx={{
              width: 44,
              height: 40,
              borderRadius: 2,
              bgcolor: expanded
                ? "rgba(245, 158, 11, 0.35)"
                : roll.isDamage
                ? "rgba(239, 68, 68, 0.18)"
                : "rgba(30, 41, 59, 0.8)",
              border: expanded
                ? "2px solid #f59e0b"
                : roll.isDamage
                ? "1px solid rgba(239, 68, 68, 0.45)"
                : "1px solid rgba(255, 255, 255, 0.12)",
              display: "flex",
              flexDirection: "column",
              p: 0.2,
              boxShadow: expanded ? "0 0 10px rgba(245, 158, 11, 0.5)" : "none",
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: groupColor,
                color: "#0f172a",
                transform: "scale(1.05)",
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.62rem",
                fontWeight: 800,
                lineHeight: 1.15,
                textAlign: "center",
                maxWidth: "40px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {roll.name.length > 5 ? roll.name.slice(0, 5) : roll.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: "0.55rem",
                opacity: 0.9,
                lineHeight: 1.1,
                fontWeight: 800,
                maxWidth: "38px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {formatCompactFormula(roll)}
            </Typography>
          </IconButton>
        </Tooltip>

        {/* Floating compact launcher HUD */}
        <Popper
          open={expanded}
          anchorEl={anchorRef.current}
          placement="left"
          modifiers={[
            { name: "offset", options: { offset: [0, 10] } },
            { name: "preventOverflow", options: { boundary: "viewport", padding: 8 } },
            { name: "flip", options: { fallbackPlacements: ["left-start", "left-end"] } },
          ]}
          style={{ zIndex: 1400 }}
        >
          <Box
            sx={{
              p: 1.2,
              borderRadius: 3,
              bgcolor: "rgba(15, 23, 42, 0.96)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.75)",
              backdropFilter: "blur(12px)",
              minWidth: 175,
              maxWidth: 220,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            {/* Header: Full Name and tags */}
            <Box>
              <Typography
                variant="body2"
                noWrap
                sx={{ fontWeight: 800, fontSize: "0.8rem", color: "#f8fafc" }}
              >
                {roll.name}
              </Typography>
              <Stack direction="row" spacing={0.6} alignItems="center" mt={0.3} flexWrap="wrap">
                <Typography variant="caption" sx={{ fontSize: "0.68rem", color: "text.secondary", fontWeight: 700 }}>
                  {formatFormula(roll)}
                </Typography>
                {roll.isDamage ? (
                  <Chip label="Daño" size="small" sx={{ height: 16, fontSize: "0.58rem", fontWeight: 700, bgcolor: "rgba(239, 68, 68, 0.2)", color: "#f87171" }} />
                ) : (
                  <Chip label="Prueba" size="small" sx={{ height: 16, fontSize: "0.58rem", fontWeight: 700, bgcolor: "rgba(59, 130, 246, 0.2)", color: "#60a5fa" }} />
                )}
                {roll.isDamage && roll.damageComponents && roll.damageComponents.length > 0 ? (
                  // Display chips for each distinct damage type in damageComponents
                  Array.from(new Set(roll.damageComponents.map((c) => c.damageType).filter(Boolean))).map((dmgType) => {
                    const def = detectDamageType(dmgType as string);
                    return (
                      <Chip
                        key={dmgType as string}
                        label={`${def?.emoji || "💥"} ${def?.name || dmgType}`}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: "0.58rem",
                          fontWeight: 700,
                          bgcolor: def ? def.fillColor : "rgba(245, 158, 11, 0.2)",
                          color: def ? def.color : "#f59e0b",
                          border: `1px solid ${def ? def.color : "rgba(245, 158, 11, 0.4)"}80`,
                        }}
                      />
                    );
                  })
                ) : (
                  roll.isDamage && roll.damageType && (() => {
                    const def = detectDamageType(roll.damageType);
                    return (
                      <Chip
                        label={`${def?.emoji || "💥"} ${def?.name || roll.damageType}`}
                        size="small"
                        sx={{
                          height: 16,
                          fontSize: "0.58rem",
                          fontWeight: 700,
                          bgcolor: def ? def.fillColor : "rgba(245, 158, 11, 0.2)",
                          color: def ? def.color : "#f59e0b",
                          border: `1px solid ${def ? def.color : "rgba(245, 158, 11, 0.4)"}80`,
                        }}
                      />
                    );
                  })()
                )}
                {!roll.isDamage && blessActive && (
                  <Chip label={`✨+${blessCount || 1}d4`} size="small" sx={{ height: 16, fontSize: "0.58rem", fontWeight: 700, bgcolor: "rgba(56, 189, 248, 0.2)", color: "#38bdf8" }} />
                )}
              </Stack>
            </Box>

            {/* Main Action Buttons: Desv, Normal, Vent */}
            <Stack direction="row" spacing={0.6} alignItems="center">
              <Tooltip title="Desventaja" arrow enterDelay={200}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => executeRoll("DISADVANTAGE")}
                  sx={{
                    flex: 1,
                    py: 0.5,
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#f87171",
                    borderColor: "rgba(239, 68, 68, 0.6)",
                    bgcolor: "rgba(239, 68, 68, 0.18)",
                    borderRadius: 2,
                    textTransform: "none",
                    minWidth: 42,
                    "&:hover": { bgcolor: "rgba(239, 68, 68, 0.35)", borderColor: "#ef4444" },
                  }}
                >
                  Desv
                </Button>
              </Tooltip>

              <Button
                size="small"
                variant="contained"
                onClick={() => executeRoll(null)}
                sx={{
                  flex: 1.4,
                  py: 0.5,
                  fontSize: "0.74rem",
                  fontWeight: 900,
                  bgcolor: "#f59e0b",
                  color: "#0f172a",
                  borderRadius: 2,
                  textTransform: "none",
                  whiteSpace: "nowrap",
                  "&:hover": { bgcolor: "#d97706" },
                }}
              >
                🎲 Normal
              </Button>

              <Tooltip title="Ventaja" arrow enterDelay={200}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => executeRoll("ADVANTAGE")}
                  sx={{
                    flex: 1,
                    py: 0.5,
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    color: "#4ade80",
                    borderColor: "rgba(34, 197, 94, 0.6)",
                    bgcolor: "rgba(34, 197, 94, 0.18)",
                    borderRadius: 2,
                    textTransform: "none",
                    minWidth: 42,
                    "&:hover": { bgcolor: "rgba(34, 197, 94, 0.35)", borderColor: "#22c55e" },
                  }}
                >
                  Vent
                </Button>
              </Tooltip>
            </Stack>

            {/* Super advantage buttons if enabled: Compact 2-button row */}
            {enableSuperAdvantage && (
              <Stack direction="row" spacing={0.6} alignItems="center">
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => executeRoll("SUPER_DISADVANTAGE")}
                  sx={{
                    flex: 1,
                    py: 0.3,
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    color: "#fca5a5",
                    borderColor: "rgba(239, 68, 68, 0.4)",
                    bgcolor: "rgba(239, 68, 68, 0.12)",
                    borderRadius: 1.5,
                    textTransform: "none",
                    "&:hover": { bgcolor: "rgba(239, 68, 68, 0.25)", borderColor: "#ef4444" },
                  }}
                >
                  S-Desv (3d)
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => executeRoll("SUPER_ADVANTAGE")}
                  sx={{
                    flex: 1,
                    py: 0.3,
                    fontSize: "0.66rem",
                    fontWeight: 800,
                    color: "#86efac",
                    borderColor: "rgba(34, 197, 94, 0.4)",
                    bgcolor: "rgba(34, 197, 94, 0.12)",
                    borderRadius: 1.5,
                    textTransform: "none",
                    "&:hover": { bgcolor: "rgba(34, 197, 94, 0.25)", borderColor: "#22c55e" },
                  }}
                >
                  S-Vent (3d)
                </Button>
              </Stack>
            )}
          </Box>
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export const QuickRollPanel: React.FC = () => {
  const groups = useSavedRollsStore((state) => state.groups);
  const favoriteGroups = useSavedRollsStore((state) => state.favoriteGroups);
  const savedRolls = useSavedRollsStore((state) => state.savedRolls);
  const groupColors = useSavedRollsStore((state) => state.groupColors);

  const visibleGroups = groups.filter((g) => favoriteGroups.includes(g));

  if (visibleGroups.length === 0) {
    return null;
  }

  return (
    <SimpleBar
      style={{
        maxHeight: "100%",
        height: "100%",
        width: "56px",
        minWidth: "56px",
        flexShrink: 0,
        overflowY: "auto",
        position: "relative",
        zIndex: 10,
        backgroundColor: "rgba(15, 17, 26, 0.75)",
        backdropFilter: "blur(8px)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <Stack p={0.5} spacing={1} alignItems="center">
        {visibleGroups.map((group) => {
          const rollsInGroup = savedRolls.filter((r) => r.group === group);
          if (rollsInGroup.length === 0) return null;
          const color = groupColors[group] || "#f59e0b";

          return (
            <Stack key={group} spacing={0.5} alignItems="center" width="100%">
              <Tooltip title={group} placement="left" arrow>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    textAlign: "center",
                    bgcolor: color,
                    color: "#0f172a",
                    borderRadius: 1,
                    width: "100%",
                    px: 0.5,
                    py: 0.3,
                    mt: 0.5,
                    cursor: "default",
                  }}
                >
                  {group.slice(0, 5).toUpperCase()}
                </Typography>
              </Tooltip>

              {rollsInGroup.map((roll) => (
                <QuickRollItem key={roll.id} roll={roll} groupColor={color} />
              ))}
            </Stack>
          );
        })}
      </Stack>
    </SimpleBar>
  );
};
