import React from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import HiddenOnIcon from "@mui/icons-material/VisibilityOffRounded";
import HiddenOffIcon from "@mui/icons-material/VisibilityRounded";

import { useDiceControlsStore } from "./store";
import { useDiceRollStore } from "../dice/store";

export const DiceHidden: React.FC = () => {
  const hidden = useDiceControlsStore((state) => state.diceHidden);
  const toggleDiceHidden = useDiceControlsStore((state) => state.toggleDiceHidden);
  const clearRoll = useDiceRollStore((state) => state.clearRoll);

  const handleClick = () => {
    toggleDiceHidden();
    if (useDiceRollStore.getState().roll) clearRoll();
  };

  return (
    <Tooltip
      title={hidden ? "Tirada Oculta" : "Tirada Pública"}
      placement="right"
      enterDelay={350}
      arrow
    >
      <IconButton
        size="small"
        onClick={handleClick}
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          color: hidden ? "#c084fc" : "text.secondary",
          border: hidden ? "1.5px solid #a855f7" : "1px solid transparent",
          backgroundColor: hidden ? "rgba(168, 85, 247, 0.22)" : "transparent",
          boxShadow: hidden ? "0 0 10px rgba(168, 85, 247, 0.35)" : "none",
          "&:hover": {
            backgroundColor: hidden ? "rgba(168, 85, 247, 0.32)" : "rgba(255, 255, 255, 0.08)",
            color: hidden ? "#e9d5ff" : "text.primary",
          },
          transition: "all 0.15s ease-in-out",
        }}
      >
        {hidden ? <HiddenOnIcon fontSize="small" /> : <HiddenOffIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};
