import React from "react";
import Badge from "@mui/material/Badge";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { ALL_DICE_TYPES, DiceType } from "../types/DiceType";
import { useDiceControlsStore } from "./store";
import { DiceSvg } from "../components/dice/DiceSvg";
import { useDiceRollStore } from "../dice/store";

export const DicePicker: React.FC = () => {
  const counts = useDiceControlsStore((state) => state.diceCounts);
  const increment = useDiceControlsStore((state) => state.incrementDieCount);
  const decrement = useDiceControlsStore((state) => state.decrementDieCount);
  const clearRoll = useDiceRollStore((state) => state.clearRoll);
  const hasActiveRoll = useDiceRollStore((state) => state.roll !== null);

  const handleClick = (type: DiceType) => {
    if (hasActiveRoll) clearRoll();
    increment(type);
  };

  const handleRightClick = (e: React.MouseEvent, type: DiceType) => {
    e.preventDefault();
    if (counts[type] > 0) {
      if (hasActiveRoll) clearRoll();
      decrement(type);
    }
  };

  return (
    <Stack spacing={0.4} alignItems="center" width="100%">
      {ALL_DICE_TYPES.map((type) => {
        const count = counts[type] || 0;
        return (
          <Tooltip
            key={type}
            title={type}
            placement="right"
            enterDelay={400}
            arrow
          >
            <Badge
              badgeContent={count}
              color="primary"
              overlap="rectangular"
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
                "& .MuiBadge-badge": {
                  fontSize: "0.68rem",
                  height: 16,
                  minWidth: 16,
                  fontWeight: 800,
                  boxShadow: "0 2px 5px rgba(0,0,0,0.5)",
                  top: 2,
                  right: 8,
                },
              }}
            >
              <ButtonBase
                onClick={() => handleClick(type)}
                onContextMenu={(e) => handleRightClick(e, type)}
                sx={{
                  width: 44,
                  py: 0.25,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 1.8,
                  backgroundColor:
                    count > 0 ? "rgba(245, 158, 11, 0.22)" : "rgba(30, 41, 59, 0.65)",
                  border:
                    count > 0
                      ? "1.5px solid #f59e0b"
                      : "1px solid rgba(255, 255, 255, 0.12)",
                  boxShadow: count > 0 ? "0 0 10px rgba(245, 158, 11, 0.3)" : "none",
                  transition: "all 0.15s ease-in-out",
                  "&:hover": {
                    backgroundColor: "#f59e0b",
                    borderColor: "#f59e0b",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
                    "& .dice-label": {
                      color: "#0f172a",
                    },
                    "& svg line, & svg polygon, & svg rect": {
                      stroke: "#0f172a !important",
                    },
                  },
                }}
              >
                <DiceSvg type={type} size={20} />
                <Typography
                  className="dice-label"
                  variant="caption"
                  sx={{
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    color: count > 0 ? "primary.main" : "#e2e8f0",
                    lineHeight: 1,
                    mt: 0.15,
                    letterSpacing: "0.02em",
                    transition: "color 0.15s ease",
                  }}
                >
                  {type}
                </Typography>
              </ButtonBase>
            </Badge>
          </Tooltip>
        );
      })}
    </Stack>
  );
};
