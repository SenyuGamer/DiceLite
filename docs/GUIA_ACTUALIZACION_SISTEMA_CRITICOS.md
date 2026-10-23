# 📘 Guía de Actualización: Sistema Universal de Críticos, Modos de Tirada y Superventaja

Esta guía documenta la lógica y arquitectura de las mejoras implementadas en **DiceLite**, listas para ser incorporadas en la extensión principal 3D **Better Dice** (`C:\Users\Senyu\Documents\Programas\dice`).

---

## 🎯 Resumen de Nuevas Capacidades

1. **Rango Mínimo y Máximo para Críticos y Pifias (`critMin`, `critMax`, `fumbleMin`, `fumbleMax`):**
   - Permite que habilidades de clase (ej. *Guerrero Campeón* con crítico en 19-20 o 18-20) funcionen de forma nativa.
   - Soporte automático para sistemas multijuego:
     - **D&D 5e / D20:** Crítico 20 a 20 (o 19-20), Pifia 1 a 1.
     - **Cyberpunk / Interlock (d10):** Crítico 10 a 10, Pifia 1 a 1.
     - **Daggerheart (d12):** Crítico 12 a 12, Pifia 1 a 1.
     - **Call of Cthulhu / BRP (d100 inverso):** Éxito crítico 1 a 5, Pifia 96 a 100.
     - **Sistemas d6 (Year Zero, Shadowrun):** Crítico 6 a 6, Pifia 1 a 1.
     - **Personalizado / Desactivado.**

2. **Diferenciación de Modo: "Tirada de Prueba" vs "Tirada de Daño":**
   - Resuelve el problema de los **falsos críticos en tiradas de daño** (por ejemplo, hechizos o armas personalizadas cuyo daño es 1d20 o 2d10).
   - En lugar de un confuso interruptor binario ("daño activo/inactivo"), se presenta un selector explícito de dos estados: **`🎯 Tirada de Prueba`** vs **`⚔️ Tirada de Daño`**.
   - Si la tirada está en modo daño, se desactiva automáticamente la detección de pifias y críticos (configurable en opciones).

3. **Superventaja y Superdesventaja (Tirar 3 dados - Opcional en Configuración):**
   - **Desactivada por defecto**: Para no sobrecargar la interfaz estándar, viene desactivada por defecto y se enciende con un toggle en la ventana de **Configuración** (`SettingsModal.tsx`).
   - Cuando está habilitada:
     - **Superventaja (`SUPER_ADVANTAGE` / `S-Vent`):** Lanza 3 dados y se queda con el mayor (`HIGHEST`), descartando 2.
     - **Superdesventaja (`SUPER_DISADVANTAGE` / `S-Desv`):** Lanza 3 dados y se queda con el menor (`LOWEST`), descartando 2.
     - **Ventaja (`ADVANTAGE` / `Vent`):** Lanza 2 dados, conserva el mayor, descarta 1.
     - **Desventaja (`DISADVANTAGE` / `Desv`):** Lanza 2 dados, conserva el menor, descarta 1.

4. **Acceso Rápido Directo en Mesa:**
   - Debajo del botón principal de lanzamiento se ubica el selector de modo (**Prueba** / **Daño**) y el botón rápido de **Bless (`✨ Bless (+1d4)`)**.

---

## 🛠️ Arquitectura de Código

### 1. Tipos de Ventaja y Modo de Tirada (`store.ts`)

```typescript
export type Advantage =
  | "SUPER_DISADVANTAGE"
  | "DISADVANTAGE"
  | "ADVANTAGE"
  | "SUPER_ADVANTAGE"
  | null;

export type RollMode = "CHECK" | "DAMAGE";

interface DiceControlsState {
  rollMode: RollMode;
  isDamageRoll: boolean;
  diceAdvantage: Advantage;
  blessActive: boolean;
  blessCount: number;
  
  setRollMode: (mode: RollMode) => void;
  setDiceAdvantage: (advantage: Advantage) => void;
  setBlessActive: (active: boolean) => void;
}
```

---

### 2. Generador de Dados con Superventaja (`getDiceToRoll`)

Cuando se genera la estructura de la tirada, `SUPER_ADVANTAGE` y `SUPER_DISADVANTAGE` empaquetan 3 dados dentro de un grupo con combinación `HIGHEST` o `LOWEST`:

```typescript
export function getDiceToRoll(
  counts: Partial<DiceCounts>,
  advantage: Advantage,
  blessActive?: boolean,
  blessCount?: number
): (Die | Dice)[] {
  const dice: (Die | Dice)[] = [];

  for (const [typeKey, count] of Object.entries(counts)) {
    const type = typeKey as DiceType;
    const num = count || 0;

    for (let i = 0; i < num; i++) {
      if (advantage === null) {
        dice.push({ id: generateDiceId(), type });
      } else {
        const isSuper =
          advantage === "SUPER_ADVANTAGE" || advantage === "SUPER_DISADVANTAGE";
        const combination =
          advantage === "ADVANTAGE" || advantage === "SUPER_ADVANTAGE"
            ? "HIGHEST"
            : "LOWEST";

        const subDice: Die[] = [
          { id: generateDiceId(), type },
          { id: generateDiceId(), type },
        ];
        if (isSuper) {
          subDice.push({ id: generateDiceId(), type });
        }

        dice.push({
          dice: subDice,
          combination,
        });
      }
    }
  }

  // Bless agrega 1d4 por cada blessCount
  if (dice.length > 0 && blessActive && blessCount && blessCount > 0) {
    for (let i = 0; i < blessCount; i++) {
      dice.push({ id: generateDiceId(), type: "D4", isBless: true });
    }
  }

  return dice;
}
```

---

### 3. Evaluación Matemática y Descarte Dinámico (`diceMath.ts`)

La función de evaluación soporta automáticamente cualquier cantidad de dados (2 o 3 dados en ventaja/superventaja):

```typescript
// Para HIGHEST: busca el valor máximo y descarta todos los demás dados del grupo
if (item.combination === "HIGHEST") {
  let maxVal = -Infinity;
  let bestIndex = 0;
  childResults.forEach((res, idx) => {
    if (res.val > maxVal) {
      maxVal = res.val;
      bestIndex = idx;
    }
  });
  childResults.forEach((res, idx) => {
    if (idx !== bestIndex && res.dieId) {
      discardedDieIds.add(res.dieId);
    }
  });
  return maxVal;
}

// Para LOWEST: busca el valor mínimo y descarta todos los demás dados del grupo
if (item.combination === "LOWEST") {
  let minVal = Infinity;
  let bestIndex = 0;
  childResults.forEach((res, idx) => {
    if (res.val < minVal) {
      minVal = res.val;
      bestIndex = idx;
    }
  });
  childResults.forEach((res, idx) => {
    if (idx !== bestIndex && res.dieId) {
      discardedDieIds.add(res.dieId);
    }
  });
  return minVal;
}
```

---

### 4. Evaluación de Críticos y Pifias por Rangos

```typescript
const settings = useSettingsStore.getState();
const isDamage = Boolean(diceRoll.isDamage);
const allowCrits = !(isDamage && settings.ignoreCritOnDamage) && settings.preset !== "NONE";

if (allowCrits) {
  const allDice = getDieFromDice(diceRoll);
  const diceById = new Map(allDice.map((d) => [d.id, d]));

  for (const [id, value] of Object.entries(rollValues)) {
    const die = diceById.get(id);

    // Solo evalúa el dado asignado al sistema (y excluye dados bless d4)
    if (die && die.type === settings.criticalDieType && !die.isBless) {
      // Rango de Crítico
      if (value >= settings.critMin && value <= settings.critMax) {
        crit20Ids.add(id);
      }
      // Rango de Pifia
      if (value >= settings.fumbleMin && value <= settings.fumbleMax) {
        fumble1Ids.add(id);
      }
    }
  }
}
```

---

### 5. Configuración Universal (`settingsStore.ts`)

```typescript
export interface SettingsState {
  preset: GameSystemPreset;
  criticalDieType: DiceType;
  critMin: number;
  critMax: number;
  fumbleMin: number;
  fumbleMax: number;
  ignoreCritOnDamage: boolean;
  enableSuperAdvantage: boolean; // Desactivado por defecto (false)
  setPreset: (preset: GameSystemPreset) => void;
  setCriticalDieType: (type: DiceType) => void;
  setCritRange: (min: number, max: number) => void;
  setFumbleRange: (min: number, max: number) => void;
  setIgnoreCritOnDamage: (val: boolean) => void;
  setEnableSuperAdvantage: (val: boolean) => void;
}
```

**Presets preconfigurados:**

| Preset | Dado | Crítico (`Min - Max`) | Pifia (`Min - Max`) |
| :--- | :---: | :---: | :---: |
| **D&D 5e / D20** | `D20` | `20 - 20` | `1 - 1` |
| **Cyberpunk / Interlock** | `D10` | `10 - 10` | `1 - 1` |
| **Daggerheart** | `D12` | `12 - 12` | `1 - 1` |
| **Call of Cthulhu / BRP** | `D100` | `1 - 5` | `96 - 100` |
| **Year Zero / Shadowrun** | `D6` | `6 - 6` | `1 - 1` |
| **Custom** | Cualquiera | Configurable por usuario | Configurable por usuario |
| **Ninguno** | - | Desactivado | Desactivado |

---

## 🎨 Componentes de Interfaz de Usuario

### 1. Selector de Ventaja (`DieAdvantage.tsx`)
- **Modo normal (default):** Muestra los 2 botones clásicos: `Desv` (Desventaja) y `Vent` (Ventaja).
- **Modo Superventaja habilitado en Config:** Despliega los 4 botones compactos con código de color:
  - `S-Desv` (Rojo acentuado) - Superdesventaja (3 dados, menor).
  - `Desv` (Rojo suave) - Desventaja (2 dados, menor).
  - `Vent` (Verde suave) - Ventaja (2 dados, mayor).
  - `S-Vent` (Verde acentuado) - Superventaja (3 dados, mayor).

### 2. Selector de Modo de Tirada (`DiceMat.tsx` y `DiceExtras.tsx`)
En lugar de un checkbox ambiguo:
```tsx
<ToggleButtonGroup
  value={rollMode}
  exclusive
  onChange={(_, val) => val && setRollMode(val)}
  size="small"
>
  <ToggleButton value="CHECK">🎯 Tirada de Prueba</ToggleButton>
  <ToggleButton value="DAMAGE">⚔️ Tirada de Daño</ToggleButton>
</ToggleButtonGroup>
```

---

## 📋 Pasos para Portar a Better Dice (3D)

1. **Copiar `settingsStore.ts` y `SettingsModal.tsx`:**
   Ubicar en `src/controls/` y enlazar en la barra lateral.
2. **Actualizar el tipo `Advantage` en `src/controls/store.ts`:**
   Añadir `"SUPER_ADVANTAGE"` y `"SUPER_DISADVANTAGE"`.
3. **Actualizar `getDiceToRoll`:**
   Incluir el tercer dado al detectar los modos super.
4. **Reemplazar la verificación de críticos en la física 3D:**
   En el callback donde los dados se detienen (`DiceRoll.tsx` / `finishDieRoll`):
   ```typescript
   const settings = useSettingsStore.getState();
   const isDamage = Boolean(diceRoll.isDamage);
   const allowCrits = !(isDamage && settings.ignoreCritOnDamage) && settings.preset !== "NONE";

   if (allowCrits && die.type === settings.criticalDieType) {
     const isCrit = value >= settings.critMin && value <= settings.critMax;
     const isFumble = value >= settings.fumbleMin && value <= settings.fumbleMax;
     // Disparar animación de crítico / sonido / partículas según corresponda
   }
   ```
5. **Añadir el selector `🎯 Tirada de Prueba` vs `⚔️ Tirada de Daño`** en los controles de lanzamiento.
