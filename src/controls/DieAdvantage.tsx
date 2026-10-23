import React from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import { Advantage } from "./store";
import { useSettingsStore } from "./settingsStore";

interface DieAdvantageProps {
  advantage?: Advantage;
  onChange: (advantage: Advantage) => void;
}

export const DieAdvantage: React.FC<DieAdvantageProps> = ({ advantage, onChange }) => {
  const enableSuperAdvantage = useSettingsStore((state) => state.enableSuperAdvantage);

  return (
    <ToggleButtonGroup
      value={advantage}
      exclusive
      onChange={(_, value) => onChange(value)}
      aria-label="Ventaja / Desventaja"
      fullWidth
      size="small"
      sx={{
        p: 0.5,
        "& .MuiToggleButton-root": {
          fontWeight: 800,
          fontSize: enableSuperAdvantage ? "0.72rem" : "0.8rem",
          py: 0.6,
          px: 0.5,
          textTransform: "none",
        },
      }}
    >
      {enableSuperAdvantage && (
        <Tooltip title="Superdesventaja" arrow placement="top" enterDelay={300}>
          <ToggleButton
            value="SUPER_DISADVANTAGE"
            sx={{
              color: "#f87171 !important",
              "&.Mui-selected": {
                bgcolor: "rgba(239, 68, 68, 0.28) !important",
                color: "#fca5a5 !important",
                border: "1px solid #ef4444",
              },
            }}
          >
            S-Desv
          </ToggleButton>
        </Tooltip>
      )}

      <Tooltip title="Desventaja" arrow placement="top" enterDelay={300}>
        <ToggleButton
          value="DISADVANTAGE"
          sx={{
            color: "#fca5a5 !important",
            "&.Mui-selected": {
              bgcolor: "rgba(239, 68, 68, 0.16) !important",
              color: "#fca5a5 !important",
              border: "1px solid #ef4444",
            },
          }}
        >
          Desv
        </ToggleButton>
      </Tooltip>

      <Tooltip title="Ventaja" arrow placement="top" enterDelay={300}>
        <ToggleButton
          value="ADVANTAGE"
          sx={{
            color: "#86efac !important",
            "&.Mui-selected": {
              bgcolor: "rgba(34, 197, 94, 0.16) !important",
              color: "#86efac !important",
              border: "1px solid #22c55e",
            },
          }}
        >
          Vent
        </ToggleButton>
      </Tooltip>

      {enableSuperAdvantage && (
        <Tooltip title="Superventaja" arrow placement="top" enterDelay={300}>
          <ToggleButton
            value="SUPER_ADVANTAGE"
            sx={{
              color: "#4ade80 !important",
              "&.Mui-selected": {
                bgcolor: "rgba(34, 197, 94, 0.28) !important",
                color: "#4ade80 !important",
                border: "1px solid #22c55e",
              },
            }}
          >
            S-Vent
          </ToggleButton>
        </Tooltip>
      )}
    </ToggleButtonGroup>
  );
};
