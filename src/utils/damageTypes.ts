export interface DamageDefinition {
  typeKey: string;
  name: string;
  emoji: string;
  color: string;
  fillColor: string;
  glowColor: string;
}

export const DAMAGE_TYPES: Record<string, DamageDefinition> = {
  fire: {
    typeKey: "fire",
    name: "Fuego",
    emoji: "🔥",
    color: "#f97316",
    fillColor: "#431407",
    glowColor: "rgba(249, 115, 22, 0.6)",
  },
  cold: {
    typeKey: "cold",
    name: "Frío",
    emoji: "❄️",
    color: "#06b6d4",
    fillColor: "#083344",
    glowColor: "rgba(6, 182, 212, 0.6)",
  },
  lightning: {
    typeKey: "lightning",
    name: "Relámpago",
    emoji: "⚡",
    color: "#eab308",
    fillColor: "#422006",
    glowColor: "rgba(234, 179, 8, 0.6)",
  },
  thunder: {
    typeKey: "thunder",
    name: "Trueno",
    emoji: "💥",
    color: "#818cf8",
    fillColor: "#1e1b4b",
    glowColor: "rgba(129, 140, 248, 0.6)",
  },
  poison: {
    typeKey: "poison",
    name: "Veneno",
    emoji: "🟢",
    color: "#10b981",
    fillColor: "#064e3b",
    glowColor: "rgba(16, 185, 129, 0.6)",
  },
  acid: {
    typeKey: "acid",
    name: "Ácido",
    emoji: "🧪",
    color: "#84cc16",
    fillColor: "#1a2e05",
    glowColor: "rgba(132, 204, 22, 0.6)",
  },
  necrotic: {
    typeKey: "necrotic",
    name: "Necrótico",
    emoji: "💀",
    color: "#a855f7",
    fillColor: "#3b0764",
    glowColor: "rgba(168, 85, 247, 0.6)",
  },
  radiant: {
    typeKey: "radiant",
    name: "Radiante",
    emoji: "✨",
    color: "#fbbf24",
    fillColor: "#451a03",
    glowColor: "rgba(251, 191, 36, 0.6)",
  },
  force: {
    typeKey: "force",
    name: "Fuerza",
    emoji: "🔮",
    color: "#d946ef",
    fillColor: "#4a044e",
    glowColor: "rgba(217, 70, 239, 0.6)",
  },
  psychic: {
    typeKey: "psychic",
    name: "Psíquico",
    emoji: "🧠",
    color: "#ec4899",
    fillColor: "#500724",
    glowColor: "rgba(236, 72, 153, 0.6)",
  },
  slashing: {
    typeKey: "slashing",
    name: "Cortante",
    emoji: "⚔️",
    color: "#94a3b8",
    fillColor: "#1e293b",
    glowColor: "rgba(148, 163, 184, 0.5)",
  },
  piercing: {
    typeKey: "piercing",
    name: "Perforante",
    emoji: "🗡️",
    color: "#38bdf8",
    fillColor: "#082f49",
    glowColor: "rgba(56, 189, 248, 0.5)",
  },
  bludgeoning: {
    typeKey: "bludgeoning",
    name: "Contundente",
    emoji: "🔨",
    color: "#a8a29e",
    fillColor: "#292524",
    glowColor: "rgba(168, 162, 158, 0.5)",
  },
  healing: {
    typeKey: "healing",
    name: "Curación",
    emoji: "💖",
    color: "#22c55e",
    fillColor: "#052e16",
    glowColor: "rgba(34, 197, 94, 0.6)",
  },
};

/**
 * Detects damage definition from raw type string or fallback text
 */
export function detectDamageType(rawType?: string, fallbackText?: string): DamageDefinition | null {
  const cleanRaw = (rawType || "").toLowerCase().trim();
  if (cleanRaw) {
    if (/heal|curaci[óo]n|cure|wound|curar|herida|heridas|sanaci[óo]n|sanar|temp hp|vida|salud|vitality|restorat/i.test(cleanRaw)) return DAMAGE_TYPES.healing;
    if (/bludgeoning|contundente|crush|smash|golpe|impacto/i.test(cleanRaw)) return DAMAGE_TYPES.bludgeoning;
    if (/slashing|cortante|slash|corte|tajo/i.test(cleanRaw)) return DAMAGE_TYPES.slashing;
    if (/piercing|perforante|pierce|punzante|estocada/i.test(cleanRaw)) return DAMAGE_TYPES.piercing;
    if (/radiant|radiante|holy|sagrado|celestial|divin|solar/i.test(cleanRaw)) return DAMAGE_TYPES.radiant;
    if (/fire|fuego|flam|pyro|ignite|ardiente/i.test(cleanRaw)) return DAMAGE_TYPES.fire;
    if (/cold|fr[íi]o|ice|hielo|frost|gelid/i.test(cleanRaw)) return DAMAGE_TYPES.cold;
    if (/lightning|rel[áa]mpago|rayo|electric|shock/i.test(cleanRaw)) return DAMAGE_TYPES.lightning;
    if (/thunder|trueno|s[óo]nico|sound|ac[uú]stico/i.test(cleanRaw)) return DAMAGE_TYPES.thunder;
    if (/poison|veneno|t[óo]xico|toxic/i.test(cleanRaw)) return DAMAGE_TYPES.poison;
    if (/acid|[áa]cido|caustic|corrosiv/i.test(cleanRaw)) return DAMAGE_TYPES.acid;
    if (/necrotic|necr[óo]tico|decay|death|putref|marchit/i.test(cleanRaw)) return DAMAGE_TYPES.necrotic;
    if (/force|fuerza|eldritch|arcane|arcano/i.test(cleanRaw)) return DAMAGE_TYPES.force;
    if (/psychic|ps[íi]quico|mental|telepath|mente/i.test(cleanRaw)) return DAMAGE_TYPES.psychic;
  }

  // Fallback to name/context if no explicit rawType
  const cleanFallback = (fallbackText || "").toLowerCase().trim();
  if (!cleanFallback) return null;

  if (/heal|curaci[óo]n|cure|wound|curar|herida|heridas|sanaci[óo]n|sanar|temp hp|vida|salud|vitality|restorat|healing hands|manos curativas|lay on hands|imposici[óo]n de manos/i.test(cleanFallback)) return DAMAGE_TYPES.healing;
  if (/radiant|radiante|holy|sagrado|celestial|divin|sear|smite|lum[íi]nic|solar|true strike|golpe certero|\bcertero\b/i.test(cleanFallback)) return DAMAGE_TYPES.radiant;
  if (/fire|fuego|flam|pyro|ignite|ardiente/i.test(cleanFallback)) return DAMAGE_TYPES.fire;
  if (/cold|fr[íi]o|ice|hielo|frost|gelid/i.test(cleanFallback)) return DAMAGE_TYPES.cold;
  if (/lightning|rel[áa]mpago|rayo|electric|shock/i.test(cleanFallback)) return DAMAGE_TYPES.lightning;
  if (/thunder|trueno|s[óo]nico|sound|ac[uú]stico/i.test(cleanFallback)) return DAMAGE_TYPES.thunder;
  if (/poison|veneno|t[óo]xico|toxic/i.test(cleanFallback)) return DAMAGE_TYPES.poison;
  if (/acid|[áa]cido|caustic|corrosiv/i.test(cleanFallback)) return DAMAGE_TYPES.acid;
  if (/necrotic|necr[óo]tico|decay|death|putref|marchit/i.test(cleanFallback)) return DAMAGE_TYPES.necrotic;
  if (/force|fuerza|eldritch|arcane|arcano/i.test(cleanFallback)) return DAMAGE_TYPES.force;
  if (/psychic|ps[íi]quico|mental|telepath|mente/i.test(cleanFallback)) return DAMAGE_TYPES.psychic;
  if (/slashing|cortante|slash|corte|tajo/i.test(cleanFallback)) return DAMAGE_TYPES.slashing;
  if (/piercing|perforante|pierce|punzante|estocada/i.test(cleanFallback)) return DAMAGE_TYPES.piercing;
  if (/bludgeoning|contundente|crush|smash|\bgolpe\b(?!\s*certero)|impacto/i.test(cleanFallback)) return DAMAGE_TYPES.bludgeoning;

  return null;
}
