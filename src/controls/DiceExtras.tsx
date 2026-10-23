import React, { useState } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Tooltip from "@mui/material/Tooltip";
import Badge from "@mui/material/Badge";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import { DieBonus } from "./DieBonus";
import { DieAdvantage } from "./DieAdvantage";
import { useDiceControlsStore } from "./store";
import { useDiceRollStore } from "../dice/store";

export const DiceExtras: React.FC = () => {
  const bonus = useDiceControlsStore((state) => state.diceBonus);
  const setBonus = useDiceControlsStore((state) => state.setDiceBonus);
  const advantage = useDiceControlsStore((state) => state.diceAdvantage);
  const setAdvantage = useDiceControlsStore((state) => state.setDiceAdvantage);
  const rollMode = useDiceControlsStore((state) => state.rollMode);
  const setRollMode = useDiceControlsStore((state) => state.setRollMode);
  const clearRoll = useDiceRollStore((state) => state.clearRoll);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const clearIfNeeded = () => {
    if (useDiceRollStore.getState().roll) clearRoll();
  };

  const isDamage = rollMode === "DAMAGE";
  const hasMod = bonus !== 0 || advantage !== null || isDamage;

  return (
    <>
      <Tooltip title="Modificadores" placement="right" enterDelay={350} arrow>
        <Badge
          color="primary"
          variant="dot"
          invisible={!hasMod}
          overlap="circular"
        >
          <IconButton
            onClick={handleClick}
            sx={{
              width: 36,
              height: 36,
              fontSize: "0.85rem",
              fontWeight: 700,
              color: hasMod ? "primary.main" : "inherit",
              border: hasMod ? "1px solid #f59e0b" : undefined,
            }}
          >
            {bonus !== 0 ? (bonus > 0 ? `+${bonus}` : `${bonus}`) : "+/-"}
          </IconButton>
        </Badge>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "center", horizontal: "right" }}
        transformOrigin={{ vertical: "center", horizontal: "left" }}
        PaperProps={{
          sx: {
            minWidth: 260,
            p: 0.5,
          },
        }}
      >
        {/* TIPO DE TIRADA: Prueba vs Daño */}
        <Typography variant="caption" sx={{ px: 2, pt: 0.5, color: "text.secondary", fontWeight: 700, display: "block" }}>
          TIPO DE TIRADA
        </Typography>
        <Box sx={{ px: 1, pt: 0.5, pb: 0.5 }}>
          <ToggleButtonGroup
            value={rollMode}
            exclusive
            onChange={(_, val) => {
              if (val) {
                clearIfNeeded();
                setRollMode(val);
              }
            }}
            fullWidth
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                fontWeight: 800,
                fontSize: "0.74rem",
                py: 0.6,
                textTransform: "none",
              },
            }}
          >
            <ToggleButton
              value="CHECK"
              sx={{
                color: "#94a3b8 !important",
                "&.Mui-selected": {
                  bgcolor: "rgba(59, 130, 246, 0.22) !important",
                  color: "#60a5fa !important",
                  border: "1px solid #3b82f6",
                },
              }}
            >
              🎯 Tirada de Prueba
            </ToggleButton>
            <ToggleButton
              value="DAMAGE"
              sx={{
                color: "#94a3b8 !important",
                "&.Mui-selected": {
                  bgcolor: "rgba(239, 68, 68, 0.22) !important",
                  color: "#f87171 !important",
                  border: "1px solid #ef4444",
                },
              }}
            >
              ⚔️ Tirada de Daño
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* VENTAJA / DESVENTAJA */}
        <Typography variant="caption" sx={{ px: 2, py: 0.5, color: "text.secondary", fontWeight: 700, display: "block" }}>
          VENTAJA / DESVENTAJA
        </Typography>
        <DieAdvantage
          advantage={advantage}
          onChange={(adv) => {
            clearIfNeeded();
            setAdvantage(adv);
          }}
        />

        <Divider sx={{ my: 1 }} />

        {/* BONUS NUMÉRICO */}
        <Typography variant="caption" sx={{ px: 2, py: 0.5, color: "text.secondary", fontWeight: 700, display: "block" }}>
          BONUS NUMÉRICO
        </Typography>
        <DieBonus
          bonus={bonus}
          onChange={(val) => {
            clearIfNeeded();
            setBonus(val);
          }}
          onIncrease={() => {
            clearIfNeeded();
            setBonus(bonus + 1);
          }}
          onDecrease={() => {
            clearIfNeeded();
            setBonus(bonus - 1);
          }}
        />
      </Menu>
    </>
  );
};
