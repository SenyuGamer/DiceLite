import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/CloseRounded";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesomeRounded";
import IncreaseIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DecreaseIcon from "@mui/icons-material/RemoveCircleOutlineRounded";

import { useDiceControlsStore } from "./store";
import { useDiceRollStore } from "../dice/store";

export const BlessButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const blessActive = useDiceControlsStore((state) => state.blessActive);
  const setBlessActive = useDiceControlsStore((state) => state.setBlessActive);
  const blessCount = useDiceControlsStore((state) => state.blessCount);
  const setBlessCount = useDiceControlsStore((state) => state.setBlessCount);
  const clearRoll = useDiceRollStore((state) => state.clearRoll);

  const clearIfNeeded = () => {
    if (useDiceRollStore.getState().roll) clearRoll();
  };

  return (
    <>
      <Tooltip
        title={blessActive ? `Bless (+${blessCount}d4)` : "Bless"}
        placement="right"
        enterDelay={350}
        arrow
      >
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            color: blessActive ? "#38bdf8" : "inherit",
            border: blessActive ? "1px solid #38bdf8" : undefined,
            backgroundColor: blessActive ? "rgba(56, 189, 248, 0.2)" : undefined,
          }}
        >
          <AutoAwesomeIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AutoAwesomeIcon sx={{ color: "#38bdf8" }} />
            <Typography variant="h6">Bendición (Bless)</Typography>
          </Stack>
          <IconButton size="small" onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} pt={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body1">Activar Bless en tiradas</Typography>
              <Switch
                checked={blessActive}
                onChange={(e) => {
                  clearIfNeeded();
                  setBlessActive(e.target.checked);
                }}
                color="primary"
              />
            </Stack>

            {blessActive && (
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Cantidad de d4:
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton
                    size="small"
                    onClick={() => {
                      if (blessCount > 1) {
                        clearIfNeeded();
                        setBlessCount(blessCount - 1);
                      }
                    }}
                  >
                    <DecreaseIcon />
                  </IconButton>
                  <Typography variant="body1" sx={{ fontWeight: "bold", minWidth: 20, textAlign: "center" }}>
                    {blessCount}d4
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => {
                      clearIfNeeded();
                      setBlessCount(blessCount + 1);
                    }}
                  >
                    <IncreaseIcon />
                  </IconButton>
                </Stack>
              </Stack>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};
