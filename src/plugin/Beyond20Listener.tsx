import { useEffect } from "react";
import { useDiceRollStore } from "../dice/store";
import { useDiceControlsStore, Advantage } from "../controls/store";
import { parseDiceString } from "../utils/diceStringParser";
import { DiceRoll } from "../types/DiceRoll";
import { useDiceHistoryStore } from "../controls/history";
import { DiceCounts } from "../controls/store";
import { Die } from "../types/Die";
import { Dice } from "../types/Dice";
import { DiceType } from "../types/DiceType";
import { detectDamageType } from "../utils/damageTypes";
import { RollDamageComponent } from "../types/RollDamageComponent";

let b20IdCounter = 0;
const generateB20DieId = () => `b20_${Date.now()}_${b20IdCounter++}`;

export function Beyond20Listener() {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "Beyond20_Roll" || event.data?.type === "BeyondOwl_Roll") {
        console.log("DiceLite BeyondOwl/Beyond20 Event Received:", event.data);
        let request = event.data.data;
        if (!request) return;

        if (request.action === "rendered-roll" && request.request) {
          request = request.request;
        }

        // Parse advantage
        let advantage: Advantage = null;
        if (request.advantage === 3) advantage = "ADVANTAGE";
        else if (request.advantage === 4) advantage = "DISADVANTAGE";
        else if (request.advantage === 1) advantage = "ADVANTAGE";

        const dice: (Die | Dice)[] = [];
        const allCounts: Partial<DiceCounts> = {};
        let totalBonus = 0;
        let isDamage = false;
        const detectedDamageTypes: string[] = [];

        // ── 1. Attack rolls (1d20 + to-hit) ──
        if (request.type === "attack" || request.type === "spell-attack") {
          if (request.rollAttack !== false && request["to-hit"] !== undefined) {
            let toHit = String(request["to-hit"] || "+0").replace(/\s/g, "");
            if (!toHit.startsWith("+") && !toHit.startsWith("-") && toHit !== "") toHit = "+" + toHit;
            const parsed = parseDiceString(`1d20${toHit}`);
            if (parsed) {
              totalBonus += parsed.bonus;
              allCounts["D20"] = (allCounts["D20"] || 0) + 1;

              if (advantage === null) {
                dice.push({ id: generateB20DieId(), type: "D20" });
              } else {
                const combination = advantage === "ADVANTAGE" ? "HIGHEST" : "LOWEST";
                dice.push({
                  dice: [
                    { id: generateB20DieId(), type: "D20" },
                    { id: generateB20DieId(), type: "D20" },
                  ],
                  combination,
                });
              }
            }
          }
        }

        // ── 2. Skill, Ability, Saving Throw, Initiative, Death Save ──
        if (["skill", "ability", "saving-throw", "initiative", "death-save"].includes(request.type)) {
          let toHit = String(request.modifier || request["to-hit"] || "+0").replace(/\s/g, "");
          if (!toHit.startsWith("+") && !toHit.startsWith("-") && toHit !== "") toHit = "+" + toHit;
          const parsed = parseDiceString(`1d20${toHit}`);
          if (parsed) {
            totalBonus += parsed.bonus;
            allCounts["D20"] = (allCounts["D20"] || 0) + 1;

            if (advantage === null) {
              dice.push({ id: generateB20DieId(), type: "D20" });
            } else {
              const combination = advantage === "ADVANTAGE" ? "HIGHEST" : "LOWEST";
              dice.push({
                dice: [
                  { id: generateB20DieId(), type: "D20" },
                  { id: generateB20DieId(), type: "D20" },
                ],
                combination,
              });
            }
          }
        }

        // ── 3. Damage / Healing rolls (Weapons, Spells, Abilities) ──
        const hasDamagesArray = Array.isArray(request.damages) && request.damages.length > 0;
        const isExplicitDamage = request.type === "damage" || request.type === "heal" || request.type === "healing" || request.rollDamage === true || hasDamagesArray;
        const b20DamageComponents: RollDamageComponent[] = [];

        if (isExplicitDamage && (hasDamagesArray || request.damage || request.damages)) {
          isDamage = true;
          const rawDamages: string[] = hasDamagesArray
            ? request.damages
            : request.damage
            ? [String(request.damage)]
            : [];

          const rawTypes: string[] = Array.isArray(request["damage-types"])
            ? request["damage-types"]
            : Array.isArray(request.damage_types)
            ? request.damage_types
            : [];

          const isCrit = Boolean(request.rollCritical);

          for (let i = 0; i < rawDamages.length; i++) {
            const dmgFormula = String(rawDamages[i]);
            const bracketMatch = dmgFormula.match(/\[([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)\]/);
            const explicitType =
              rawTypes[i] ||
              (bracketMatch ? bracketMatch[1] : "") ||
              (rawDamages.length === 1 ? (request.damageType || request["damage-type"] || "") : "");

            // If explicit type is present, detect from it; otherwise if i > 0, inspect formula or fallback
            const damageDef = explicitType
              ? detectDamageType(explicitType)
              : i === 0
              ? detectDamageType("", `${request.name || ""} ${request.title || ""}`)
              : detectDamageType(dmgFormula, `${request.name || ""} ${request.title || ""}`);

            const parsed = parseDiceString(dmgFormula);
            if (!parsed) continue;

            totalBonus += parsed.bonus;
            const typeLabel = damageDef ? damageDef.name : explicitType || "Daño";
            if (typeLabel && !detectedDamageTypes.includes(typeLabel)) {
              detectedDamageTypes.push(typeLabel);
            }

            // Double dice on critical if Beyond20 didn't supply explicit critical-damages
            const multiplier = isCrit && !request["critical-damages"] ? 2 : 1;

            for (const [typeKey, count] of Object.entries(parsed.counts)) {
              const type = typeKey as DiceType;
              const num = (count || 0) * multiplier;
              allCounts[type] = (allCounts[type] || 0) + num;

              b20DamageComponents.push({
                id: `b20_comp_${i}_${typeKey}`,
                count: num,
                type,
                damageType: typeLabel,
              });

              for (let n = 0; n < num; n++) {
                dice.push({
                  id: generateB20DieId(),
                  type,
                  color: damageDef?.color,
                  fillColor: damageDef?.fillColor,
                  damageType: typeLabel,
                  damageTypeKey: damageDef?.typeKey,
                });
              }
            }
          }

          // Handle explicit Beyond20 critical damages array if provided
          if (isCrit && Array.isArray(request["critical-damages"])) {
            const critDamages: string[] = request["critical-damages"];
            const critTypes: string[] = Array.isArray(request["critical-damage-types"])
              ? request["critical-damage-types"]
              : [];

            for (let i = 0; i < critDamages.length; i++) {
              const dmgFormula = String(critDamages[i]);
              const bracketMatch = dmgFormula.match(/\[([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+)\]/);
              const explicitType =
                critTypes[i] ||
                rawTypes[i] ||
                (bracketMatch ? bracketMatch[1] : "");

              const damageDef = explicitType
                ? detectDamageType(explicitType)
                : i === 0
                ? detectDamageType("", `${request.name || ""} ${request.title || ""}`)
                : detectDamageType(dmgFormula, `${request.name || ""} ${request.title || ""}`);
              const parsed = parseDiceString(dmgFormula);
              if (!parsed) continue;

              totalBonus += parsed.bonus;
              const typeLabel = damageDef ? damageDef.name : explicitType || "Daño";
              if (typeLabel && !detectedDamageTypes.includes(typeLabel)) {
                detectedDamageTypes.push(typeLabel);
              }

              for (const [typeKey, count] of Object.entries(parsed.counts)) {
                const type = typeKey as DiceType;
                const num = count || 0;
                allCounts[type] = (allCounts[type] || 0) + num;

                for (let n = 0; n < num; n++) {
                  dice.push({
                    id: generateB20DieId(),
                    type,
                    color: damageDef?.color,
                    fillColor: damageDef?.fillColor,
                    damageType: typeLabel,
                    damageTypeKey: damageDef?.typeKey,
                  });
                }
              }
            }
          }
        }

        // ── 4. Bless support (only for non-damage rolls) ──
        const controlsState = useDiceControlsStore.getState();
        if (!isDamage && controlsState.blessActive && controlsState.blessCount > 0) {
          for (let i = 0; i < controlsState.blessCount; i++) {
            dice.push({ id: generateB20DieId(), type: "D4", isBless: true });
          }
        }

        let rollName = (request.name || request.title || (isDamage ? (detectedDamageTypes.includes("Curación") ? "Curación" : "Daño") : "Ataque / Prueba")).trim();
        rollName = rollName.replace(/^(unknown|unknow)\s*[:\-]?\s*/i, "").trim();
        if (detectedDamageTypes.includes("Curación")) {
          rollName = rollName.replace(/\s*\((?:Daño|Damage)\)$/i, " (Curación)");
        }

        let charName = request.character?.name?.trim();
        if (charName && /^(unknown|unknow|undefined|null)$/i.test(charName)) {
          charName = undefined;
        }
        const recentRollId = performance.now().toString();

        const roll: DiceRoll = {
          dice,
          bonus: totalBonus,
          recentRollId,
          hidden: request.whisper === 1 || request.whisper === "YES",
          name: rollName,
          characterName: charName,
          isDamage,
          damageTypes: detectedDamageTypes,
        };

        if (dice.length > 0) {
          useDiceRollStore.getState().startRoll(roll);

          useDiceHistoryStore.getState().pushRecentRoll({
            id: recentRollId,
            name: rollName,
            advantage,
            counts: allCounts,
            bonus: totalBonus,
            timestamp: Date.now(),
            isDamage,
            damageType: detectedDamageTypes[0],
            damageTypes: detectedDamageTypes,
            damageComponents: b20DamageComponents.length > 0 ? b20DamageComponents : undefined,
          });
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}
