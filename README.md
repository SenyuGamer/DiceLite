# 🎲 Dice Lite

Una versión ultra-ligera, rápida y 2D de la extensión de dados para [Owlbear Rodeo](https://www.owlbear.rodeo/), derivada de Better Dice.

---

## ⚡ Características Principales

- **0% 3D / WebGL / WASM:** Sin Three.js ni Rapier Physics. Rendimiento instantáneo y compatible con cualquier dispositivo móvil o de gama baja.
- **Gráficos SVG Vectoriales:** Poliedros frontales limpios (d4, d6, d8, d10, d12, d20, d100) con números centrados, bordes luminosos en Críticos (20) y Pifias (1).
- **Mesa de Dados Virtual 2D:** Desglose visual completo, soporte de ventaja/desventaja con descarte visual tachado, y opción de relanzar dados individuales.
- **Sincronización en Sala Owlbear Rodeo:** Notificaciones flotantes 2D elegantes (*toasts*) cuando los compañeros lanzan dados en la sala.
- **Integración con BeyondOwl y Beyond20:** Receptor directo para tiradas de ataques, daño, hechizos, salvaciones y críticos desde D&D Beyond.
- **Tiradas Guardadas y Rápidas:** Barra lateral de acceso rápido con categorías personalizables e importación/exportación JSON.
- **Historial Completo:** Registro de tiradas locales y globales de la sala.

---

## 🛠️ Desarrollo y Compilación

```bash
# Instalar dependencias
npm install

# Modo desarrollo local
npm run dev

# Compilar para producción
npm run build
```

---

## 📂 Estructura del Proyecto

```text
├── public/                 # Manifest y assets estáticos de Owlbear Rodeo
├── src/
│   ├── components/         # Mesa virtual 2D y poliedros SVG (DiceSvg, DiceMat)
│   ├── controls/           # Barras laterales, selectores, modales e historiales
│   ├── dice/               # Store Zustand y estado de tirada activa
│   ├── helpers/            # RNG criptográfico y matemática de tiradas
│   ├── plugin/             # Conexión con SDK Owlbear Rodeo y BeyondOwl
│   ├── types/              # Definiciones TypeScript
│   └── utils/              # Parsers de fórmulas de dados
```
