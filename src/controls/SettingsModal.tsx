import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import CloseIcon from "@mui/icons-material/CloseRounded";
import SettingsIcon from "@mui/icons-material/SettingsRounded";

import { useSettingsStore, GameSystemPreset } from "./settingsStore";
import { ALL_DICE_TYPES, DiceType } from "../types/DiceType";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const preset = useSettingsStore((state) => state.preset);
  const criticalDieType = useSettingsStore((state) => state.criticalDieType);
  const critMin = useSettingsStore((state) => state.critMin);
  const critMax = useSettingsStore((state) => state.critMax);
  const fumbleMin = useSettingsStore((state) => state.fumbleMin);
  const fumbleMax = useSettingsStore((state) => state.fumbleMax);
  const ignoreCritOnDamage = useSettingsStore((state) => state.ignoreCritOnDamage);
  const enableSuperAdvantage = useSettingsStore((state) => state.enableSuperAdvantage);

  const setPreset = useSettingsStore((state) => state.setPreset);
  const setCriticalDieType = useSettingsStore((state) => state.setCriticalDieType);
  const setCritRange = useSettingsStore((state) => state.setCritRange);
  const setFumbleRange = useSettingsStore((state) => state.setFumbleRange);
  const setIgnoreCritOnDamage = useSettingsStore((state) => state.setIgnoreCritOnDamage);
  const setEnableSuperAdvantage = useSettingsStore((state) => state.setEnableSuperAdvantage);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <SettingsIcon sx={{ color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Configuración de Críticos
          </Typography>
        </Stack>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} pt={1}>
          {/* Preset Selector */}
          <FormControl fullWidth size="small">
            <InputLabel id="system-preset-label">Sistema / Dado Principal</InputLabel>
            <Select
              labelId="system-preset-label"
              value={preset}
              label="Sistema / Dado Principal"
              onChange={(e) => setPreset(e.target.value as GameSystemPreset)}
            >
              <MenuItem value="D20">🐉 D&D 5e / Pathfinder (d20: 20 y 1)</MenuItem>
              <MenuItem value="D10">🤖 Cyberpunk / Interlock (d10: 10 y 1)</MenuItem>
              <MenuItem value="D12">🗡️ Daggerheart (d12: 12 y 1)</MenuItem>
              <MenuItem value="D100">🐙 Call of Cthulhu (d100: 1-5 y 96-100)</MenuItem>
              <MenuItem value="D6">🎲 Sistema d6 (d6: 6 y 1)</MenuItem>
              <MenuItem value="CUSTOM">⚙️ Personalizado (Elegir reglas)</MenuItem>
              <MenuItem value="NONE">🚫 Desactivado (Sin críticos/pifias)</MenuItem>
            </Select>
          </FormControl>

          {/* Range Settings Box */}
          {preset !== "NONE" && (
            <Stack
              spacing={1.8}
              p={1.8}
              sx={{
                bgcolor: "rgba(30, 41, 59, 0.45)",
                borderRadius: 2.5,
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", letterSpacing: 0.5 }}>
                {preset === "CUSTOM" ? "RANGOS PERSONALIZADOS" : "RANGOS DEL SISTEMA ACTIVO"}
              </Typography>

              <FormControl fullWidth size="small">
                <InputLabel>Dado de Prueba</InputLabel>
                <Select
                  value={criticalDieType}
                  label="Dado de Prueba"
                  onChange={(e) => setCriticalDieType(e.target.value as DiceType)}
                >
                  {ALL_DICE_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Critical Range */}
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#facc15" }}>
                  Rango de Éxito Crítico (Mínimo a Máximo):
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label="Mínimo"
                    type="number"
                    size="small"
                    fullWidth
                    value={critMin}
                    onChange={(e) => setCritRange(parseInt(e.target.value, 10) || 0, critMax)}
                  />
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    a
                  </Typography>
                  <TextField
                    label="Máximo"
                    type="number"
                    size="small"
                    fullWidth
                    value={critMax}
                    onChange={(e) => setCritRange(critMin, parseInt(e.target.value, 10) || 0)}
                  />
                </Stack>
              </Stack>

              {/* Fumble Range */}
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: "#f87171" }}>
                  Rango de Pifia / Fallo Crítico (Mínimo a Máximo):
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label="Mínimo"
                    type="number"
                    size="small"
                    fullWidth
                    value={fumbleMin}
                    onChange={(e) => setFumbleRange(parseInt(e.target.value, 10) || 0, fumbleMax)}
                  />
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    a
                  </Typography>
                  <TextField
                    label="Máximo"
                    type="number"
                    size="small"
                    fullWidth
                    value={fumbleMax}
                    onChange={(e) => setFumbleRange(fumbleMin, parseInt(e.target.value, 10) || 0)}
                  />
                </Stack>
              </Stack>
            </Stack>
          )}

          <Divider />

          {/* Ignore on Damage */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={ignoreCritOnDamage}
                  onChange={(e) => setIgnoreCritOnDamage(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Ignorar en tiradas de daño
                </Typography>
              }
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", pl: 4 }}>
              Si un arma o herramienta tiene daño de 1d20 (o el dado del sistema), un 1 o 20 no se marcará
              erróneamente como crítico o pifia.
            </Typography>
          </Box>

          <Divider />

          {/* Super Advantage & Super Disadvantage */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={enableSuperAdvantage}
                  onChange={(e) => setEnableSuperAdvantage(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Superventaja y Superdesventaja
                </Typography>
              }
            />
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", pl: 4 }}>
              Permite tirar 3 dados en lugar de 2 (ej. Puntería Élfica o habilidades avanzadas). Desactivado por defecto.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
