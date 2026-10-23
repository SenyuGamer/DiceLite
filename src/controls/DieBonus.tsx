import React, { useState, useEffect } from "react";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import IconButton from "@mui/material/IconButton";
import Input from "@mui/material/Input";
import Stack from "@mui/material/Stack";
import IncreaseIcon from "@mui/icons-material/AddCircleOutlineRounded";
import DecreaseIcon from "@mui/icons-material/RemoveCircleOutlineRounded";

interface DieBonusProps {
  bonus: number;
  onChange: (bonus: number) => void;
  onIncrease: () => void;
  onDecrease: () => void;
}

export const DieBonus: React.FC<DieBonusProps> = ({
  bonus,
  onChange,
  onIncrease,
  onDecrease,
}) => {
  const [bonusString, setBonusString] = useState(`${bonus}`);

  useEffect(() => {
    setBonusString(`${bonus}`);
  }, [bonus]);

  return (
    <ListItem disablePadding>
      <ListItemButton sx={{ cursor: "inherit" }}>
        <ListItemIcon sx={{ minWidth: "32px", justifyContent: "center", fontWeight: "bold" }}>
          +/-
        </ListItemIcon>
        <ListItemText sx={{ marginRight: "80px" }}>
          <Input
            disableUnderline
            inputProps={{
              sx: { textAlign: "center", fontWeight: "bold" },
            }}
            value={bonusString}
            onChange={(e) => {
              setBonusString(e.target.value);
              const num = parseInt(e.target.value, 10);
              if (!isNaN(num)) onChange(num);
            }}
          />
        </ListItemText>
        <ListItemSecondaryAction>
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" onClick={onDecrease}>
              <DecreaseIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onIncrease}>
              <IncreaseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </ListItemSecondaryAction>
      </ListItemButton>
    </ListItem>
  );
};
