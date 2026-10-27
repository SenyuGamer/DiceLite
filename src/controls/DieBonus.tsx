import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
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
    setBonusString(bonus === 0 ? "0" : (bonus > 0 ? `+${bonus}` : `${bonus}`));
  }, [bonus]);

  const commitValue = (valStr: string) => {
    const cleaned = valStr.replace(/^\+/, "").trim();
    const num = parseInt(cleaned, 10);
    if (!isNaN(num)) {
      onChange(num);
      setBonusString(num === 0 ? "0" : (num > 0 ? `+${num}` : `${num}`));
    } else {
      onChange(0);
      setBonusString("0");
    }
  };

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Stack direction="row" spacing={1} alignItems="center">
        <IconButton 
          size="small" 
          onClick={onDecrease}
          sx={{ 
            color: "text.secondary",
            "&:hover": { color: "error.main", bgcolor: "rgba(239, 68, 68, 0.1)" }
          }}
          title="Restar 1"
        >
          <DecreaseIcon fontSize="medium" />
        </IconButton>

        <TextField
          size="small"
          value={bonusString}
          onChange={(e) => {
            setBonusString(e.target.value);
            const cleaned = e.target.value.replace(/^\+/, "").trim();
            const num = parseInt(cleaned, 10);
            if (!isNaN(num)) {
              onChange(num);
            }
          }}
          onBlur={(e) => commitValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitValue(bonusString);
              (e.target as HTMLElement).blur();
            }
          }}
          placeholder="+0"
          inputProps={{
            style: { 
              textAlign: "center", 
              fontWeight: 800, 
              fontSize: "1rem",
              padding: "6px 8px"
            },
          }}
          sx={{
            flex: 1,
            "& .MuiOutlinedInput-root": {
              borderRadius: "8px",
              bgcolor: "background.paper",
              "& fieldset": {
                borderColor: bonus !== 0 ? "primary.main" : "divider",
                borderWidth: bonus !== 0 ? "2px" : "1px",
              },
              "&:hover fieldset": {
                borderColor: "primary.light",
              },
            },
          }}
        />

        <IconButton 
          size="small" 
          onClick={onIncrease}
          sx={{ 
            color: "text.secondary",
            "&:hover": { color: "success.main", bgcolor: "rgba(34, 197, 94, 0.1)" }
          }}
          title="Sumar 1"
        >
          <IncreaseIcon fontSize="medium" />
        </IconButton>
      </Stack>

      {/* Acceso rápido a valores frecuentes */}
      <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 1 }}>
        {[0, 1, 2, 3, 5].map((val) => (
          <Button
            key={val}
            size="small"
            variant={bonus === val ? "contained" : "outlined"}
            onClick={() => {
              onChange(val);
              setBonusString(val === 0 ? "0" : `+${val}`);
            }}
            sx={{
              minWidth: "32px",
              px: 0.8,
              py: 0.2,
              fontSize: "0.72rem",
              fontWeight: 700,
              borderRadius: "6px",
              textTransform: "none",
            }}
          >
            {val === 0 ? "0" : `+${val}`}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};
