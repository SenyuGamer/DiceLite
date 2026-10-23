import React, { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import TextField from "@mui/material/TextField";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import CloseIcon from "@mui/icons-material/CloseRounded";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditIcon from "@mui/icons-material/EditRounded";
import PlayArrowIcon from "@mui/icons-material/PlayArrowRounded";
import StarIcon from "@mui/icons-material/StarRounded";
import StarBorderIcon from "@mui/icons-material/StarBorderRounded";
import DownloadIcon from "@mui/icons-material/DownloadRounded";
import UploadIcon from "@mui/icons-material/UploadRounded";
import AddIcon from "@mui/icons-material/AddRounded";
import RemoveIcon from "@mui/icons-material/RemoveRounded";
import CasinoIcon from "@mui/icons-material/CasinoRounded";
import ExpandMoreIcon from "@mui/icons-material/ExpandMoreRounded";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownwardRounded";
import MoreVertIcon from "@mui/icons-material/MoreVertRounded";

import { useSavedRollsStore, SavedRoll } from "./savedRolls";
import { RollDamageComponent } from "../types/RollDamageComponent";
import { useDiceRollStore } from "../dice/store";
import { useDiceControlsStore, getDiceToRoll, DiceCounts, Advantage } from "./store";
import { useSettingsStore } from "./settingsStore";
import { ALL_DICE_TYPES, DiceType } from "../types/DiceType";
import { DiceSvg } from "../components/dice/DiceSvg";
import { parseDiceString } from "../utils/diceStringParser";
import { DAMAGE_TYPES, detectDamageType } from "../utils/damageTypes";

interface SavedRollsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SavedRollsModal: React.FC<SavedRollsModalProps> = ({ open, onClose }) => {
  const groups = useSavedRollsStore((state) => state.groups);
  const favoriteGroups = useSavedRollsStore((state) => state.favoriteGroups);
  const savedRolls = useSavedRollsStore((state) => state.savedRolls);
  const groupColors = useSavedRollsStore((state) => state.groupColors);
  const addRoll = useSavedRollsStore((state) => state.addRoll);
  const editRoll = useSavedRollsStore((state) => state.editRoll);
  const removeRoll = useSavedRollsStore((state) => state.removeRoll);
  const toggleFavoriteGroup = useSavedRollsStore((state) => state.toggleFavoriteGroup);
  const importRolls = useSavedRollsStore((state) => state.importRolls);

  const startRoll = useDiceRollStore((state) => state.startRoll);
  const hidden = useDiceControlsStore((state) => state.diceHidden);
  const currentCounts = useDiceControlsStore((state) => state.diceCounts);
  const currentBonus = useDiceControlsStore((state) => state.diceBonus);
  const currentRollMode = useDiceControlsStore((state) => state.rollMode);
  const setRollMode = useDiceControlsStore((state) => state.setRollMode);
  const activeAdvantage = useDiceControlsStore((state) => state.diceAdvantage);
  const blessActive = useDiceControlsStore((state) => state.blessActive);
  const blessCount = useDiceControlsStore((state) => state.blessCount);
  const enableSuperAdvantage = useSettingsStore((state) => state.enableSuperAdvantage);

  // Roll creator / editor state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRollId, setEditingRollId] = useState<string | null>(null);
  const [newRollName, setNewRollName] = useState("");
  const [newRollGroup, setNewRollGroup] = useState(groups[0] || "Ataques");
  const [newRollBonus, setNewRollBonus] = useState(0);
  const [newRollCounts, setNewRollCounts] = useState<Partial<DiceCounts>>({ D20: 1 });
  const [newRollIsDamage, setNewRollIsDamage] = useState(false);
  const [newRollDamageType, setNewRollDamageType] = useState<string>("");
  const [formulaInput, setFormulaInput] = useState("1d20");

  // Multi-damage components state (for damage rolls with multiple dice/types)
  const [newRollDamageComponents, setNewRollDamageComponents] = useState<RollDamageComponent[]>([
    { id: "comp-1", count: 2, type: "D6", damageType: "Contundente" },
  ]);

  // Context menu for choosing advantage explicitly
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedRoll, setSelectedRoll] = useState<SavedRoll | null>(null);

  // Helper: converts damage components to DiceCounts
  const componentsToCounts = (components: RollDamageComponent[]): Partial<DiceCounts> => {
    const counts: Partial<DiceCounts> = {};
    for (const c of components) {
      if (c.count > 0) {
        counts[c.type] = (counts[c.type] || 0) + c.count;
      }
    }
    return counts;
  };

  // Helper: formats formula string from damage components
  const formatComponentsToFormula = (components: RollDamageComponent[], bonus: number = 0) => {
    const parts = components
      .filter((c) => c.count > 0)
      .map((c) => {
        const typeStr = `${c.count}${c.type.toLowerCase()}`;
        return c.damageType ? `${typeStr} ${c.damageType}` : typeStr;
      });

    let res = parts.join(" + ");
    if (bonus !== 0) {
      if (res) {
        res += bonus > 0 ? ` + ${bonus}` : ` - ${Math.abs(bonus)}`;
      } else {
        res = `${bonus}`;
      }
    }
    return res || "0";
  };

  // Damage component management handlers
  const handleAddDamageComponent = () => {
    setNewRollDamageComponents((prev) => [
      ...prev,
      {
        id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        count: 2,
        type: "D6",
        damageType: "Fuego",
      },
    ]);
  };

  const handleRemoveDamageComponent = (index: number) => {
    setNewRollDamageComponents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateComponentCount = (index: number, count: number) => {
    setNewRollDamageComponents((prev) =>
      prev.map((c, i) => (i === index ? { ...c, count: Math.max(1, count) } : c))
    );
  };

  const handleUpdateComponentType = (index: number, type: DiceType) => {
    setNewRollDamageComponents((prev) =>
      prev.map((c, i) => (i === index ? { ...c, type } : c))
    );
  };

  const handleUpdateComponentDamageType = (index: number, damageType: string) => {
    setNewRollDamageComponents((prev) =>
      prev.map((c, i) => (i === index ? { ...c, damageType } : c))
    );
  };

  // Sync helper: formats formula string from dice counts and bonus
  const formatCountsToFormula = (counts: Partial<DiceCounts>, bonus: number = 0) => {
    const parts: string[] = [];
    for (const type of ALL_DICE_TYPES) {
      const c = counts[type];
      if (c && c > 0) {
        parts.push(`${c}${type.toLowerCase()}`);
      }
    }
    let res = parts.join(" + ");
    if (bonus !== 0) {
      if (res) {
        res += bonus > 0 ? ` + ${bonus}` : ` - ${Math.abs(bonus)}`;
      } else {
        res = `${bonus}`;
      }
    }
    return res;
  };

  const updateCountsAndFormula = (newCounts: Partial<DiceCounts>, newBonus: number = newRollBonus) => {
    setNewRollCounts(newCounts);
    setNewRollBonus(newBonus);
    setFormulaInput(formatCountsToFormula(newCounts, newBonus));
  };

  const handleFormulaInputChange = (text: string) => {
    setFormulaInput(text);
    const parsed = parseDiceString(text);
    if (parsed) {
      setNewRollCounts(parsed.counts);
      setNewRollBonus(parsed.bonus);
    }
  };

  const handleAddDie = (type: DiceType) => {
    const next = { ...newRollCounts, [type]: (newRollCounts[type] || 0) + 1 };
    updateCountsAndFormula(next, newRollBonus);
  };

  const handleRemoveDie = (type: DiceType) => {
    const current = newRollCounts[type] || 0;
    if (current <= 1) {
      const next = { ...newRollCounts };
      delete next[type];
      updateCountsAndFormula(next, newRollBonus);
    } else {
      const next = { ...newRollCounts, [type]: current - 1 };
      updateCountsAndFormula(next, newRollBonus);
    }
  };

  const handleClearDice = () => {
    updateCountsAndFormula({}, newRollBonus);
  };

  const handleUseCurrentSelection = () => {
    updateCountsAndFormula({ ...currentCounts }, currentBonus);
    setNewRollIsDamage(currentRollMode === "DAMAGE");
    if (currentRollMode === "DAMAGE") {
      const comps: RollDamageComponent[] = [];
      let idx = 1;
      for (const [t, c] of Object.entries(currentCounts)) {
        if (c && c > 0) {
          comps.push({
            id: `comp-${idx++}`,
            count: c,
            type: t as DiceType,
            damageType: "Contundente",
          });
        }
      }
      if (comps.length > 0) {
        setNewRollDamageComponents(comps);
      }
    }
  };

  const handleStartEdit = (roll: SavedRoll) => {
    setEditingRollId(roll.id);
    setNewRollName(roll.name);
    setNewRollGroup(roll.group);
    updateCountsAndFormula(roll.counts, roll.bonus);
    setNewRollBonus(roll.bonus);
    setNewRollIsDamage(Boolean(roll.isDamage));
    setNewRollDamageType(roll.damageType || "");

    if (roll.damageComponents && roll.damageComponents.length > 0) {
      setNewRollDamageComponents(roll.damageComponents.map((c) => ({ ...c })));
    } else if (roll.isDamage) {
      const comps: RollDamageComponent[] = [];
      let idx = 1;
      for (const [t, c] of Object.entries(roll.counts)) {
        if (c && c > 0) {
          comps.push({
            id: `comp-${idx++}`,
            count: c,
            type: t as DiceType,
            damageType: roll.damageType || "Contundente",
          });
        }
      }
      setNewRollDamageComponents(
        comps.length > 0
          ? comps
          : [{ id: "comp-1", count: 1, type: "D8", damageType: roll.damageType || "Contundente" }]
      );
    } else {
      setNewRollDamageComponents([
        { id: "comp-1", count: 2, type: "D6", damageType: "Contundente" },
      ]);
    }

    setShowAddForm(true);
    handleCloseMenu();
  };

  const handleSaveRoll = () => {
    if (!newRollName.trim()) return;

    const finalCounts = newRollIsDamage
      ? componentsToCounts(newRollDamageComponents)
      : newRollCounts;

    const damageTypeToSave = newRollIsDamage
      ? (newRollDamageComponents[0]?.damageType || newRollDamageType || undefined)
      : undefined;

    const damageComponentsToSave = newRollIsDamage
      ? newRollDamageComponents.filter((c) => c.count > 0)
      : undefined;

    if (editingRollId) {
      editRoll(editingRollId, {
        name: newRollName.trim(),
        group: newRollGroup.trim() || (newRollIsDamage ? "Daño" : "Ataques"),
        counts: finalCounts,
        bonus: newRollBonus,
        isDamage: newRollIsDamage,
        damageType: damageTypeToSave,
        damageComponents: damageComponentsToSave,
      });
      setEditingRollId(null);
    } else {
      addRoll({
        name: newRollName.trim(),
        group: newRollGroup.trim() || (newRollIsDamage ? "Daño" : "Ataques"),
        counts: finalCounts,
        bonus: newRollBonus,
        advantage: null,
        isDamage: newRollIsDamage,
        damageType: damageTypeToSave,
        damageComponents: damageComponentsToSave,
      });
    }

    setNewRollName("");
    setNewRollDamageType("");
    setEditingRollId(null);
    setShowAddForm(false);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingRollId(null);
    setNewRollName("");
    setNewRollDamageType("");
  };

  const handleToggleAddForm = () => {
    if (showAddForm) {
      handleCancelForm();
    } else {
      setEditingRollId(null);
      setNewRollName("");
      setNewRollGroup(groups[0] || "Ataques");
      updateCountsAndFormula({ D20: 1 }, 0);
      setNewRollIsDamage(false);
      setNewRollDamageType("");
      setNewRollDamageComponents([
        { id: "comp-1", count: 2, type: "D6", damageType: "Contundente" },
      ]);
      setShowAddForm(true);
    }
  };

  const totalDiceCount = Object.values(newRollCounts).reduce((a, b) => (a || 0) + (b || 0), 0);
  const totalDamageDiceCount = newRollDamageComponents.reduce((acc, c) => acc + (c.count || 0), 0);

  const handleLaunch = (roll: SavedRoll, explicitAdvantage?: Advantage) => {
    const advantageToUse =
      explicitAdvantage !== undefined
        ? explicitAdvantage
        : (activeAdvantage !== null ? activeAdvantage : roll.advantage);

    // Bless strictly applies to check/test rolls, never to damage
    const shouldAddBless = Boolean(!roll.isDamage && blessActive);

    // Combine saved roll inherent bonus with current quick-access situational bonus
    const totalBonus = roll.bonus + currentBonus;

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

    const dice = getDiceToRoll(
      roll.counts,
      advantageToUse,
      shouldAddBless,
      blessCount || 1,
      roll.damageType,
      roll.damageComponents
    );

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

    // Update active rollMode without altering the saved roll definition
    setRollMode(roll.isDamage ? "DAMAGE" : "CHECK");

    handleCloseMenu();
    onClose();
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>, roll: SavedRoll) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedRoll(roll);
    setMenuAnchor(e.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setSelectedRoll(null);
  };

  const handleExport = () => {
    const data = {
      groups,
      favoriteGroups,
      groupColors,
      savedRolls,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dicelite-saved-rolls-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        importRolls(json);
      } catch (err) {
        console.error("Error al importar tiradas:", err);
      }
    };
    reader.readAsText(file);
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: "#0b0f19",
          backgroundImage: "none",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 3,
          height: "94vh",
          maxHeight: "96vh",
          maxWidth: "680px",
          m: 1,
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.85)",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2,
          py: 1.2,
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#f8fafc" }}>
          Tiradas Guardadas
        </Typography>
        <Stack direction="row" spacing={0.6} alignItems="center">
          <Tooltip title="Exportar JSON">
            <IconButton size="small" onClick={handleExport} sx={{ color: "text.secondary", "&:hover": { color: "#f8fafc" }, p: 0.6 }}>
              <DownloadIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Importar JSON">
            <IconButton size="small" component="label" sx={{ color: "text.secondary", "&:hover": { color: "#f8fafc" }, p: 0.6 }}>
              <UploadIcon sx={{ fontSize: 18 }} />
              <input type="file" accept=".json" hidden onChange={handleImport} />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary", "&:hover": { color: "#f8fafc" }, p: 0.6 }}>
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ px: 1.5, py: 1.2, flexGrow: 1, overflowY: "auto" }}>
        <Stack spacing={1.2} pt={0.2}>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
            onClick={handleToggleAddForm}
            sx={{
              borderRadius: 2,
              fontWeight: 700,
              fontSize: "0.75rem",
              py: 0.6,
              textTransform: "none",
            }}
          >
            {showAddForm ? (editingRollId ? "Cancelar Edición" : "Cancelar Creación") : "Crear Nueva Tirada Guardada"}
          </Button>

          {/* Create / Edit Form */}
          {showAddForm && (
            <Stack
              spacing={1.4}
              p={1.5}
              sx={{
                bgcolor: "rgba(15, 23, 42, 0.95)",
                borderRadius: 2.5,
                border: "1px solid rgba(245, 158, 11, 0.35)",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
              }}
            >
              {/* Form Title */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 900,
                    color: "#f59e0b",
                    display: "flex",
                    alignItems: "center",
                    gap: 0.8,
                    fontSize: "0.85rem",
                  }}
                >
                  <CasinoIcon sx={{ fontSize: 18 }} />
                  {editingRollId ? "Editar Tirada Guardada" : "Crear Nueva Tirada Guardada"}
                </Typography>
                <IconButton size="small" onClick={handleCancelForm} sx={{ color: "text.secondary", p: 0.4 }}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>

              {/* Name & Category Inputs */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                <TextField
                  label="Nombre de la tirada"
                  placeholder="ej. Espada Larga +1, Fuego Lesivo, Curar..."
                  size="small"
                  fullWidth
                  value={newRollName}
                  onChange={(e) => setNewRollName(e.target.value)}
                  InputProps={{ sx: { fontSize: "0.78rem" } }}
                  InputLabelProps={{ sx: { fontSize: "0.75rem" } }}
                  sx={{ flex: 1.4 }}
                />
                <TextField
                  label="Grupo / Categoría"
                  size="small"
                  fullWidth
                  value={newRollGroup}
                  onChange={(e) => setNewRollGroup(e.target.value)}
                  InputProps={{ sx: { fontSize: "0.78rem" } }}
                  InputLabelProps={{ sx: { fontSize: "0.75rem" } }}
                  sx={{ flex: 1 }}
                />
              </Stack>

              {/* Quick Category Chips */}
              {groups.length > 0 && (
                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: "wrap", gap: 0.4 }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.65rem", mr: 0.5 }}>
                    Categorías:
                  </Typography>
                  {groups.map((g) => (
                    <Chip
                      key={g}
                      label={g}
                      size="small"
                      clickable
                      onClick={() => setNewRollGroup(g)}
                      sx={{
                        height: 20,
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        bgcolor: newRollGroup === g ? "rgba(245, 158, 11, 0.25)" : "rgba(255, 255, 255, 0.06)",
                        color: newRollGroup === g ? "#f59e0b" : "#cbd5e1",
                        border: newRollGroup === g ? "1px solid #f59e0b" : "1px solid rgba(255, 255, 255, 0.1)",
                        "&:hover": { bgcolor: "rgba(245, 158, 11, 0.35)" },
                      }}
                    />
                  ))}
                </Stack>
              )}

              {/* Selector Modo: Tirada de Prueba vs Tirada de Daño */}
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800, fontSize: "0.66rem", letterSpacing: 0.5, mb: 0.6, display: "block" }}>
                  TIPO DE TIRADA
                </Typography>
                <Stack direction="row" spacing={1}>
                  {/* Option 1: Tirada de Prueba */}
                  <ButtonBase
                    onClick={() => {
                      setNewRollIsDamage(false);
                      setNewRollDamageType("");
                    }}
                    sx={{
                      flex: 1,
                      p: 1,
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      textAlign: "left",
                      bgcolor: !newRollIsDamage ? "rgba(59, 130, 246, 0.18)" : "rgba(30, 41, 59, 0.4)",
                      border: !newRollIsDamage ? "1.5px solid #3b82f6" : "1px solid rgba(255, 255, 255, 0.1)",
                      boxShadow: !newRollIsDamage ? "0 0 10px rgba(59, 130, 246, 0.3)" : "none",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: !newRollIsDamage ? "rgba(59, 130, 246, 0.25)" : "rgba(30, 41, 59, 0.7)",
                      },
                    }}
                  >
                    <Stack direction="row" spacing={0.6} alignItems="center" width="100%">
                      <Typography sx={{ fontSize: "0.95rem" }}>🎯</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.76rem", color: !newRollIsDamage ? "#60a5fa" : "#94a3b8" }}>
                        Tirada de Prueba
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ fontSize: "0.63rem", color: "text.secondary", mt: 0.2 }}>
                      Ataque d20, tirada de salvación, habilidad, iniciativa. Aplica Bless/Bono.
                    </Typography>
                  </ButtonBase>

                  {/* Option 2: Tirada de Daño */}
                  <ButtonBase
                    onClick={() => {
                      setNewRollIsDamage(true);
                    }}
                    sx={{
                      flex: 1,
                      p: 1,
                      borderRadius: 2,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      textAlign: "left",
                      bgcolor: newRollIsDamage ? "rgba(239, 68, 68, 0.18)" : "rgba(30, 41, 59, 0.4)",
                      border: newRollIsDamage ? "1.5px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.1)",
                      boxShadow: newRollIsDamage ? "0 0 10px rgba(239, 68, 68, 0.3)" : "none",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        bgcolor: newRollIsDamage ? "rgba(239, 68, 68, 0.25)" : "rgba(30, 41, 59, 0.7)",
                      },
                    }}
                  >
                    <Stack direction="row" spacing={0.6} alignItems="center" width="100%">
                      <Typography sx={{ fontSize: "0.95rem" }}>⚔️</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: "0.76rem", color: newRollIsDamage ? "#f87171" : "#94a3b8" }}>
                        Tirada de Daño
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ fontSize: "0.63rem", color: "text.secondary", mt: 0.2 }}>
                      Armas, conjuros ofensivos o curación (permite varios dados y tipos de daño).
                    </Typography>
                  </ButtonBase>
                </Stack>
              </Box>

              {/* Mode A: CHECK / TEST ROLL (Interactive Dice Bar) */}
              {!newRollIsDamage && (
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    bgcolor: "rgba(30, 41, 59, 0.5)",
                    border: "1px solid rgba(255, 255, 255, 0.09)",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 800, fontSize: "0.66rem", letterSpacing: 0.5 }}>
                      SELECCIÓN DE DADOS ({totalDiceCount} dados)
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Button
                        size="small"
                        variant="text"
                        onClick={handleUseCurrentSelection}
                        sx={{ fontSize: "0.68rem", py: 0, textTransform: "none", color: "#38bdf8", fontWeight: 700 }}
                      >
                        Usar selección de la mesa
                      </Button>
                      <Button
                        size="small"
                        variant="text"
                        onClick={handleClearDice}
                        disabled={totalDiceCount === 0}
                        sx={{ fontSize: "0.68rem", py: 0, textTransform: "none", color: "#f87171", fontWeight: 700 }}
                      >
                        Limpiar dados
                      </Button>
                    </Stack>
                  </Stack>

                  {/* Horizontal Dice Bar */}
                  <Stack
                    direction="row"
                    spacing={0.6}
                    sx={{
                      overflowX: "auto",
                      pb: 0.6,
                      pt: 0.2,
                      justifyContent: { xs: "flex-start", sm: "center" },
                    }}
                  >
                    {ALL_DICE_TYPES.map((type) => {
                      const count = newRollCounts[type] || 0;
                      return (
                        <Box
                          key={type}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            p: 0.6,
                            minWidth: 52,
                            borderRadius: 2,
                            bgcolor: count > 0 ? "rgba(245, 158, 11, 0.18)" : "rgba(15, 23, 42, 0.7)",
                            border: count > 0 ? "1.5px solid #f59e0b" : "1px solid rgba(255, 255, 255, 0.08)",
                            boxShadow: count > 0 ? "0 0 10px rgba(245, 158, 11, 0.25)" : "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Tooltip title={`Clic para añadir ${type}`} arrow placement="top" enterDelay={400}>
                            <ButtonBase
                              onClick={() => handleAddDie(type)}
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                width: "100%",
                                borderRadius: 1.5,
                                py: 0.3,
                                "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)" },
                              }}
                            >
                              <DiceSvg type={type} size={24} color={count > 0 ? "#f59e0b" : "#94a3b8"} />
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 800, mt: 0.2, fontSize: "0.62rem", color: count > 0 ? "#f59e0b" : "#cbd5e1" }}
                              >
                                {type}
                              </Typography>
                            </ButtonBase>
                          </Tooltip>

                          <Stack direction="row" spacing={0.1} alignItems="center" mt={0.4}>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveDie(type)}
                              disabled={count <= 0}
                              sx={{
                                p: 0.2,
                                color: count > 0 ? "#f87171" : "rgba(255,255,255,0.2)",
                                "&:hover": { bgcolor: "rgba(239, 68, 68, 0.2)" },
                              }}
                            >
                              <RemoveIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                            <Typography
                              sx={{
                                minWidth: 16,
                                textAlign: "center",
                                fontWeight: 900,
                                fontSize: "0.75rem",
                                color: count > 0 ? "#f8fafc" : "text.secondary",
                              }}
                            >
                              {count}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleAddDie(type)}
                              sx={{
                                p: 0.2,
                                color: "#38bdf8",
                                "&:hover": { bgcolor: "rgba(56, 189, 248, 0.2)" },
                              }}
                            >
                              <AddIcon sx={{ fontSize: 12 }} />
                            </IconButton>
                          </Stack>
                        </Box>
                      );
                    })}
                  </Stack>

                  {/* Formula manual text input & Modifier */}
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2} alignItems="center" mt={1.2}>
                    <TextField
                      label="Fórmula (ej. 1d20 + 5)"
                      size="small"
                      fullWidth
                      value={formulaInput}
                      onChange={(e) => handleFormulaInputChange(e.target.value)}
                      helperText="Puedes hacer clic en los dados o escribir la fórmula directamente"
                      InputProps={{ sx: { fontSize: "0.78rem" } }}
                      InputLabelProps={{ sx: { fontSize: "0.74rem" } }}
                      FormHelperTextProps={{ sx: { fontSize: "0.64rem" } }}
                    />
                    <TextField
                      label="Modificador (+/-)"
                      type="number"
                      size="small"
                      sx={{ minWidth: 120 }}
                      value={newRollBonus}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        updateCountsAndFormula(newRollCounts, val);
                      }}
                      InputProps={{ sx: { fontSize: "0.78rem" } }}
                      InputLabelProps={{ sx: { fontSize: "0.74rem" } }}
                    />
                  </Stack>
                </Box>
              )}

              {/* Mode B: DAMAGE ROLL (Multi-Damage Component Builder) */}
              {newRollIsDamage && (
                <Box
                  sx={{
                    p: 1.2,
                    borderRadius: 2,
                    bgcolor: "rgba(30, 41, 59, 0.5)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "#f87171",
                          fontWeight: 800,
                          fontSize: "0.68rem",
                          letterSpacing: 0.5,
                          textTransform: "uppercase",
                        }}
                      >
                        COMPONENTES DE DAÑO ({totalDamageDiceCount} dados en total)
                      </Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.62rem", display: "block" }}>
                        Combina varios dados y tipos de daño (ej. 2d6 Contundente + 2d6 Fuego)
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack spacing={0.8}>
                    {newRollDamageComponents.map((comp, index) => {
                      const currentDamageDef = comp.damageType ? detectDamageType(comp.damageType) : null;
                      return (
                        <Box
                          key={comp.id || index}
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: "rgba(15, 23, 42, 0.8)",
                            border: `1.5px solid ${currentDamageDef ? currentDamageDef.color + "60" : "rgba(255, 255, 255, 0.1)"}`,
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            alignItems: { xs: "stretch", sm: "center" },
                            gap: 1,
                          }}
                        >
                          {/* Quantity Controls */}
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.65rem", minWidth: 42 }}>
                              Dados:
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateComponentCount(index, Math.max(1, comp.count - 1))}
                              disabled={comp.count <= 1}
                              sx={{ p: 0.3, color: "#f87171" }}
                            >
                              <RemoveIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                            <TextField
                              type="number"
                              size="small"
                              value={comp.count}
                              onChange={(e) => {
                                const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                                handleUpdateComponentCount(index, val);
                              }}
                              inputProps={{ min: 1, style: { textAlign: "center", padding: "4px", width: "32px", fontSize: "0.78rem", fontWeight: 800 } }}
                              sx={{ width: 44 }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => handleUpdateComponentCount(index, comp.count + 1)}
                              sx={{ p: 0.3, color: "#38bdf8" }}
                            >
                              <AddIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Stack>

                          {/* Die Type Selector */}
                          <Stack direction="row" spacing={0.4} alignItems="center" sx={{ flexWrap: "wrap" }}>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.65rem", mr: 0.3 }}>
                              Tipo:
                            </Typography>
                            {(["D4", "D6", "D8", "D10", "D12", "D20"] as DiceType[]).map((dType) => (
                              <Chip
                                key={dType}
                                label={dType}
                                size="small"
                                clickable
                                onClick={() => handleUpdateComponentType(index, dType)}
                                sx={{
                                  height: 22,
                                  fontSize: "0.65rem",
                                  fontWeight: 800,
                                  bgcolor: comp.type === dType ? "rgba(245, 158, 11, 0.25)" : "rgba(255, 255, 255, 0.05)",
                                  color: comp.type === dType ? "#f59e0b" : "#94a3b8",
                                  border: comp.type === dType ? "1.5px solid #f59e0b" : "1px solid rgba(255, 255, 255, 0.08)",
                                  "&:hover": { bgcolor: "rgba(245, 158, 11, 0.35)" },
                                }}
                              />
                            ))}
                          </Stack>

                          {/* Damage Type Dropdown / Select */}
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flex: 1, minWidth: 140 }}>
                            <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.65rem" }}>
                              Daño:
                            </Typography>
                            <select
                              value={comp.damageType || ""}
                              onChange={(e) => handleUpdateComponentDamageType(index, e.target.value)}
                              style={{
                                backgroundColor: currentDamageDef ? currentDamageDef.fillColor : "#0f172a",
                                color: currentDamageDef ? currentDamageDef.color : "#f8fafc",
                                borderColor: currentDamageDef ? currentDamageDef.color : "rgba(255, 255, 255, 0.2)",
                                borderWidth: "1.5px",
                                borderStyle: "solid",
                                borderRadius: "6px",
                                padding: "3px 6px",
                                fontSize: "0.74rem",
                                fontWeight: 800,
                                cursor: "pointer",
                                outline: "none",
                                flex: 1,
                              }}
                            >
                              <option value="" style={{ background: "#0f172a", color: "#94a3b8" }}>
                                Sin tipo (Genérico)
                              </option>
                              {Object.values(DAMAGE_TYPES).map((def) => (
                                <option
                                  key={def.typeKey}
                                  value={def.name}
                                  style={{ background: "#0f172a", color: def.color, fontWeight: 700 }}
                                >
                                  {def.emoji} {def.name}
                                </option>
                              ))}
                            </select>
                          </Stack>

                          {/* Delete Row Button */}
                          {newRollDamageComponents.length > 1 && (
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveDamageComponent(index)}
                              sx={{ color: "text.secondary", "&:hover": { color: "#ef4444" }, p: 0.3, alignSelf: { xs: "flex-end", sm: "center" } }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>

                  {/* Button to add another component and Modifier */}
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" mt={1.2} spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                      onClick={handleAddDamageComponent}
                      sx={{
                        borderRadius: 2,
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        textTransform: "none",
                        color: "#f87171",
                        borderColor: "rgba(239, 68, 68, 0.5)",
                        bgcolor: "rgba(239, 68, 68, 0.1)",
                        "&:hover": {
                          bgcolor: "rgba(239, 68, 68, 0.2)",
                          borderColor: "#ef4444",
                        },
                      }}
                    >
                      + Añadir otro tipo de daño
                    </Button>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        label="Modificador (+/-)"
                        type="number"
                        size="small"
                        sx={{ width: 120 }}
                        value={newRollBonus}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setNewRollBonus(val);
                        }}
                        InputProps={{ sx: { fontSize: "0.78rem" } }}
                        InputLabelProps={{ sx: { fontSize: "0.74rem" } }}
                      />
                    </Stack>
                  </Stack>
                </Box>
              )}

              {/* Live Preview Banner */}
              <Box
                sx={{
                  p: 1,
                  borderRadius: 2,
                  bgcolor: "rgba(245, 158, 11, 0.08)",
                  border: "1px dashed rgba(245, 158, 11, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0, overflow: "hidden" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.66rem", flexShrink: 0 }}>
                    Vista previa:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 900,
                      fontSize: "0.76rem",
                      color: "#f8fafc",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {newRollName.trim() || "Sin nombre"} :{" "}
                    <span style={{ color: "#f59e0b" }}>
                      {newRollIsDamage
                        ? formatComponentsToFormula(newRollDamageComponents, newRollBonus)
                        : (totalDiceCount > 0 || newRollBonus !== 0 ? formulaInput || "0" : "Selecciona al menos 1 dado")}
                    </span>
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0} flexWrap="wrap">
                  <Chip
                    label={newRollIsDamage ? "⚔️ Daño" : "🎯 Prueba"}
                    size="small"
                    sx={{
                      height: 19,
                      fontSize: "0.64rem",
                      fontWeight: 800,
                      bgcolor: newRollIsDamage ? "rgba(239, 68, 68, 0.2)" : "rgba(59, 130, 246, 0.2)",
                      color: newRollIsDamage ? "#f87171" : "#60a5fa",
                      border: `1px solid ${newRollIsDamage ? "rgba(239, 68, 68, 0.4)" : "rgba(59, 130, 246, 0.4)"}`,
                    }}
                  />
                  {newRollIsDamage &&
                    Array.from(new Set(newRollDamageComponents.map((c) => c.damageType).filter(Boolean))).map((dt) => {
                      const def = detectDamageType(dt as string);
                      return (
                        <Chip
                          key={dt as string}
                          label={`${def?.emoji || "💥"} ${def?.name || dt}`}
                          size="small"
                          sx={{
                            height: 19,
                            fontSize: "0.64rem",
                            fontWeight: 800,
                            bgcolor: def ? def.fillColor : "rgba(245, 158, 11, 0.2)",
                            color: def ? def.color : "#f59e0b",
                            border: `1px solid ${def ? def.color : "rgba(245, 158, 11, 0.5)"}`,
                            boxShadow: def ? `0 0 6px ${def.glowColor}` : "none",
                          }}
                        />
                      );
                    })}
                </Stack>
              </Box>

              {/* Actions: Cancel & Save */}
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleCancelForm}
                  size="small"
                  sx={{ borderRadius: 2, fontSize: "0.72rem", py: 0.5 }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={handleSaveRoll}
                  disabled={
                    !newRollName.trim() ||
                    (newRollIsDamage
                      ? totalDamageDiceCount === 0 && newRollBonus === 0
                      : totalDiceCount === 0 && newRollBonus === 0)
                  }
                  sx={{
                    borderRadius: 2,
                    px: 2.5,
                    py: 0.5,
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                  }}
                >
                  {editingRollId ? "Actualizar Tirada" : "Guardar Tirada"}
                </Button>
              </Stack>
            </Stack>
          )}

          {/* Groups list */}
          {groups.map((group) => {
            const rollsInGroup = savedRolls.filter((r) => r.group === group);
            const isFav = favoriteGroups.includes(group);
            const color = groupColors[group] || "#f59e0b";

            return (
              <Accordion
                key={group}
                defaultExpanded
                disableGutters
                elevation={0}
                sx={{
                  bgcolor: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid rgba(255, 255, 255, 0.07)",
                  borderRadius: "10px !important",
                  "&:before": { display: "none" },
                  overflow: "hidden",
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: 16, color: "text.secondary" }} />}
                  sx={{
                    minHeight: 34,
                    px: 1.2,
                    "& .MuiAccordionSummary-content": { my: 0.4 },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.8} sx={{ width: "100%", pr: 0.8 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography sx={{ fontWeight: 800, fontSize: "0.78rem", color: "#f1f5f9" }}>
                      {group}
                    </Typography>
                    <Box sx={{ flexGrow: 1 }} />
                    <Tooltip title={isFav ? "Quitar de favoritos" : "Fijar en favoritos"}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteGroup(group);
                        }}
                        sx={{
                          width: 24,
                          height: 24,
                          color: isFav ? "#facc15" : "text.secondary",
                          "&:hover": { color: "#facc15" },
                        }}
                      >
                        {isFav ? <StarIcon sx={{ fontSize: 16 }} /> : <StarBorderIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1, pt: 0, pb: 1 }}>
                  {rollsInGroup.length === 0 ? (
                    <Typography variant="caption" sx={{ color: "text.secondary", fontStyle: "italic", px: 0.5, fontSize: "0.7rem" }}>
                      No hay tiradas en esta categoría
                    </Typography>
                  ) : (
                    <Stack spacing={0.6}>
                      {rollsInGroup.map((roll) => (
                        <Box
                          key={roll.id}
                          onContextMenu={(e) => handleOpenMenu(e, roll)}
                          sx={{
                            p: 0.8,
                            borderRadius: 1.8,
                            bgcolor: "rgba(30, 41, 59, 0.5)",
                            border: "1px solid rgba(255, 255, 255, 0.06)",
                            transition: "all 0.15s ease",
                            "&:hover": {
                              bgcolor: "rgba(30, 41, 59, 0.8)",
                              borderColor: "rgba(255, 255, 255, 0.12)",
                            },
                          }}
                        >
                          {/* Row 1: Roll Name, Chips & Menu Button */}
                          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={0.8}>
                            <Stack direction="row" alignItems="center" spacing={0.6} sx={{ minWidth: 0, flexGrow: 1, flexWrap: "wrap", gap: 0.4 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 800,
                                  fontSize: "0.78rem",
                                  color: "#f8fafc",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {roll.name}
                              </Typography>
                              {roll.isDamage ? (
                                <Chip
                                  label="Daño"
                                  size="small"
                                  sx={{
                                    height: 17,
                                    fontSize: "0.6rem",
                                    fontWeight: 800,
                                    bgcolor: "rgba(239, 68, 68, 0.2)",
                                    color: "#f87171",
                                    border: "1px solid rgba(239, 68, 68, 0.35)",
                                  }}
                                />
                              ) : (
                                <Chip
                                  label="Prueba"
                                  size="small"
                                  sx={{
                                    height: 17,
                                    fontSize: "0.6rem",
                                    fontWeight: 800,
                                    bgcolor: "rgba(59, 130, 246, 0.2)",
                                    color: "#60a5fa",
                                    border: "1px solid rgba(59, 130, 246, 0.35)",
                                  }}
                                />
                              )}
                              {roll.isDamage && roll.damageComponents && roll.damageComponents.length > 0 ? (
                                Array.from(new Set(roll.damageComponents.map((c) => c.damageType).filter(Boolean))).map((dmgType) => {
                                  const def = detectDamageType(dmgType as string);
                                  return (
                                    <Chip
                                      key={dmgType as string}
                                      label={`${def?.emoji || "💥"} ${def?.name || dmgType}`}
                                      size="small"
                                      sx={{
                                        height: 17,
                                        fontSize: "0.6rem",
                                        fontWeight: 800,
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
                                        height: 17,
                                        fontSize: "0.6rem",
                                        fontWeight: 800,
                                        bgcolor: def ? def.fillColor : "rgba(245, 158, 11, 0.2)",
                                        color: def ? def.color : "#f59e0b",
                                        border: `1px solid ${def ? def.color : "rgba(245, 158, 11, 0.4)"}80`,
                                      }}
                                    />
                                  );
                                })()
                              )}
                              {!roll.isDamage && blessActive && (
                                <Chip
                                  label={`✨+${blessCount || 1}d4`}
                                  size="small"
                                  sx={{
                                    height: 17,
                                    fontSize: "0.6rem",
                                    fontWeight: 800,
                                    bgcolor: "rgba(56, 189, 248, 0.2)",
                                    color: "#38bdf8",
                                    border: "1px solid rgba(56, 189, 248, 0.4)",
                                  }}
                                />
                              )}
                            </Stack>

                            <Stack direction="row" spacing={0.2} alignItems="center">
                              <Tooltip title="Editar tirada" enterDelay={250}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEdit(roll);
                                  }}
                                  sx={{
                                    width: 22,
                                    height: 22,
                                    color: "text.secondary",
                                    "&:hover": { color: "#38bdf8" },
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: 15 }} />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Más opciones" enterDelay={250}>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleOpenMenu(e, roll)}
                                  sx={{
                                    width: 22,
                                    height: 22,
                                    color: "text.secondary",
                                    "&:hover": { color: "#f8fafc" },
                                  }}
                                >
                                  <MoreVertIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Stack>

                          {/* Row 2: Formula info & Launch Actions */}
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            spacing={1}
                            mt={0.6}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                fontWeight: 700,
                                fontSize: "0.7rem",
                              }}
                            >
                              {formatFormula(roll)}
                              {currentBonus !== 0 && (
                                <span
                                  style={{
                                    color: currentBonus > 0 ? "#f59e0b" : "#ef4444",
                                    marginLeft: 6,
                                  }}
                                >
                                  ({currentBonus > 0 ? `+${currentBonus}` : currentBonus} bono)
                                </span>
                              )}
                            </Typography>

                            {/* Ergonomic launch buttons: Desv, Normal, Vent */}
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <Tooltip title="Desventaja" arrow enterDelay={250}>
                                <Button
                                  size="small"
                                  onClick={() => handleLaunch(roll, "DISADVANTAGE")}
                                  sx={{
                                    minWidth: 38,
                                    height: 22,
                                    px: 0.6,
                                    py: 0,
                                    fontSize: "0.64rem",
                                    fontWeight: 800,
                                    color: "#f87171",
                                    bgcolor: "rgba(239, 68, 68, 0.15)",
                                    border: "1px solid rgba(239, 68, 68, 0.4)",
                                    borderRadius: 1.5,
                                    textTransform: "none",
                                    "&:hover": {
                                      bgcolor: "rgba(239, 68, 68, 0.3)",
                                      borderColor: "#ef4444",
                                    },
                                  }}
                                >
                                  Desv
                                </Button>
                              </Tooltip>

                              <Tooltip title="Lanzar Normal" arrow enterDelay={250}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  onClick={() => handleLaunch(roll, null)}
                                  startIcon={<PlayArrowIcon sx={{ fontSize: "13px !important", ml: -0.2, mr: -0.2 }} />}
                                  sx={{
                                    height: 22,
                                    px: 1,
                                    py: 0,
                                    fontSize: "0.68rem",
                                    fontWeight: 900,
                                    bgcolor: "#f59e0b",
                                    color: "#0f172a",
                                    borderRadius: 1.5,
                                    textTransform: "none",
                                    boxShadow: "0 2px 6px rgba(245, 158, 11, 0.3)",
                                    "&:hover": {
                                      bgcolor: "#d97706",
                                    },
                                  }}
                                >
                                  Lanzar
                                </Button>
                              </Tooltip>

                              <Tooltip title="Ventaja" arrow enterDelay={250}>
                                <Button
                                  size="small"
                                  onClick={() => handleLaunch(roll, "ADVANTAGE")}
                                  sx={{
                                    minWidth: 38,
                                    height: 22,
                                    px: 0.6,
                                    py: 0,
                                    fontSize: "0.64rem",
                                    fontWeight: 800,
                                    color: "#4ade80",
                                    bgcolor: "rgba(34, 197, 94, 0.15)",
                                    border: "1px solid rgba(34, 197, 94, 0.4)",
                                    borderRadius: 1.5,
                                    textTransform: "none",
                                    "&:hover": {
                                      bgcolor: "rgba(34, 197, 94, 0.3)",
                                      borderColor: "#22c55e",
                                    },
                                  }}
                                >
                                  Vent
                                </Button>
                              </Tooltip>
                            </Stack>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      </DialogContent>

      {/* Advantage Selection Menu on Right-Click or More Options */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: {
            bgcolor: "#0f172a",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
            borderRadius: 2,
          },
        }}
      >
        {selectedRoll && (
          <Box sx={{ px: 2, py: 0.8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "primary.main", display: "block" }}>
              {selectedRoll.name}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.7rem" }}>
              {formatFormula(selectedRoll)}
            </Typography>
            {selectedRoll.isDamage && selectedRoll.damageComponents && selectedRoll.damageComponents.length > 0 ? (
              <Typography variant="caption" sx={{ display: "block", color: "#f87171", fontSize: "0.68rem", mt: 0.2, fontWeight: 700 }}>
                💥 Tipos: {Array.from(new Set(selectedRoll.damageComponents.map((c) => c.damageType).filter(Boolean))).join(", ")}
              </Typography>
            ) : (
              selectedRoll.isDamage && selectedRoll.damageType && (() => {
                const dDef = detectDamageType(selectedRoll.damageType);
                return (
                  <Typography variant="caption" sx={{ display: "block", color: dDef ? dDef.color : "#f59e0b", fontSize: "0.68rem", mt: 0.2, fontWeight: 700 }}>
                    {dDef?.emoji || "💥"} Tipo: {dDef?.name || selectedRoll.damageType}
                  </Typography>
                );
              })()
            )}
            {!selectedRoll.isDamage && blessActive && (
              <Typography variant="caption" sx={{ display: "block", color: "#38bdf8", fontSize: "0.7rem", mt: 0.2 }}>
                ✨ Bless activo (+{blessCount || 1}d4)
              </Typography>
            )}
          </Box>
        )}

        <MenuItem
          onClick={() => selectedRoll && handleLaunch(selectedRoll, null)}
          sx={{ fontSize: "0.82rem", fontWeight: 700 }}
        >
          🎲 Lanzar Normal
        </MenuItem>

        <MenuItem
          onClick={() => selectedRoll && handleLaunch(selectedRoll, "ADVANTAGE")}
          sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#4ade80" }}
        >
          🟢 Con Ventaja (2 dados)
        </MenuItem>

        <MenuItem
          onClick={() => selectedRoll && handleLaunch(selectedRoll, "DISADVANTAGE")}
          sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#f87171" }}
        >
          🔴 Con Desventaja (2 dados)
        </MenuItem>

        {enableSuperAdvantage && (
          <MenuItem
            onClick={() => selectedRoll && handleLaunch(selectedRoll, "SUPER_ADVANTAGE")}
            sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#86efac" }}
          >
            🌟 Con Superventaja (3 dados)
          </MenuItem>
        )}

        {enableSuperAdvantage && (
          <MenuItem
            onClick={() => selectedRoll && handleLaunch(selectedRoll, "SUPER_DISADVANTAGE")}
            sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#fca5a5" }}
          >
            💀 Con Superdesventaja (3 dados)
          </MenuItem>
        )}

        <Divider sx={{ my: 0.5, borderColor: "rgba(255, 255, 255, 0.08)" }} />

        <MenuItem
          onClick={() => {
            if (selectedRoll) handleStartEdit(selectedRoll);
          }}
          sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#38bdf8" }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <EditIcon sx={{ fontSize: 16 }} />
            <span>Editar tirada</span>
          </Stack>
        </MenuItem>

        <MenuItem
          onClick={() => {
            if (selectedRoll) removeRoll(selectedRoll.id);
            handleCloseMenu();
          }}
          sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#ef4444" }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <DeleteIcon sx={{ fontSize: 16 }} />
            <span>Eliminar tirada</span>
          </Stack>
        </MenuItem>
      </Menu>
    </Dialog>
  );
};
