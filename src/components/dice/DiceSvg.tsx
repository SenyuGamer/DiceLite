import React from "react";
import { DiceType } from "../../types/DiceType";

interface DiceSvgProps {
  type: DiceType;
  value?: number | null;
  size?: number | "small" | "medium" | "large" | "xlarge";
  isCrit?: boolean;
  isFumble?: boolean;
  isDiscarded?: boolean;
  isBless?: boolean;
  color?: string;
  fillColor?: string;
  rolling?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  style?: React.CSSProperties;
}

const SIZE_MAP = {
  small: 28,
  medium: 44,
  large: 64,
  xlarge: 84,
};

export const DiceSvg: React.FC<DiceSvgProps> = ({
  type,
  value,
  size = "medium",
  isCrit = false,
  isFumble = false,
  isDiscarded = false,
  isBless = false,
  color,
  fillColor: propFillColor,
  rolling = false,
  onClick,
  style,
}) => {
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size] || 44;

  const effectiveCrit = isCrit && !isDiscarded;
  const effectiveFumble = isFumble && !isDiscarded;

  // Colors
  const defaultFill = "#222736";
  const defaultStroke = color || "#6366f1";
  const strokeColor = effectiveCrit
    ? "#eab308"
    : effectiveFumble
    ? "#ef4444"
    : isBless
    ? "#38bdf8"
    : isDiscarded
    ? "#64748b"
    : defaultStroke;

  const fillColor = effectiveCrit
    ? "#42320b"
    : effectiveFumble
    ? "#3f1515"
    : isBless
    ? "#0c4a6e"
    : isDiscarded
    ? "#1e293b"
    : propFillColor || (color ? `${color}28` : defaultFill);

  const textColor = effectiveCrit
    ? "#fef08a"
    : effectiveFumble
    ? "#fca5a5"
    : isBless
    ? "#e0f2fe"
    : isDiscarded
    ? "#94a3b8"
    : "#ffffff";

  const renderShape = () => {
    switch (type) {
      case "D4":
        return (
          <>
            <polygon
              points="50,14 88,78 12,78"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <line x1="50" y1="14" x2="50" y2="52" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="12" y1="78" x2="50" y2="52" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="88" y1="78" x2="50" y2="52" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
          </>
        );

      case "D6":
        return (
          <>
            <rect
              x="16"
              y="16"
              width="68"
              height="68"
              rx="12"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <rect
              x="24"
              y="24"
              width="52"
              height="52"
              rx="8"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
          </>
        );

      case "D8":
        return (
          <>
            <polygon
              points="50,12 88,50 50,88 12,50"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <polygon
              points="50,24 76,50 50,76 24,50"
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
            <line x1="50" y1="12" x2="50" y2="88" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.3" />
            <line x1="12" y1="50" x2="88" y2="50" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.3" />
          </>
        );

      case "D10":
        return (
          <>
            <polygon
              points="50,10 86,38 72,88 28,88 14,38"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <line x1="50" y1="10" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="14" y1="38" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="86" y1="38" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="28" y1="88" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="72" y1="88" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
          </>
        );

      case "D12":
        return (
          <>
            <polygon
              points="50,12 88,38 74,86 26,86 12,38"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <polygon
              points="50,28 72,44 64,72 36,72 28,44"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeOpacity="0.5"
            />
            <line x1="50" y1="12" x2="50" y2="28" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="88" y1="38" x2="72" y2="44" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="74" y1="86" x2="64" y2="72" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="26" y1="86" x2="36" y2="72" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
            <line x1="12" y1="38" x2="28" y2="44" stroke={strokeColor} strokeWidth="1.5" strokeOpacity="0.4" />
          </>
        );

      case "D20":
        return (
          <>
            <polygon
              points="50,10 86,28 86,72 50,90 14,72 14,28"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Inner equilateral triangle */}
            <polygon
              points="50,28 78,70 22,70"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeOpacity="0.6"
            />
            {/* Facet lines */}
            <line x1="50" y1="10" x2="50" y2="28" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="14" y1="28" x2="50" y2="28" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="86" y1="28" x2="50" y2="28" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="14" y1="72" x2="22" y2="70" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="86" y1="72" x2="78" y2="70" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="22" y1="70" x2="50" y2="90" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="78" y1="70" x2="50" y2="90" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
          </>
        );

      case "D100":
        return (
          <>
            <polygon
              points="50,10 86,38 72,88 28,88 14,38"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <line x1="50" y1="10" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="14" y1="38" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="86" y1="38" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="28" y1="88" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            <line x1="72" y1="88" x2="50" y2="48" stroke={strokeColor} strokeWidth="2" strokeOpacity="0.5" />
            {/* Small percent sign in the corner */}
            <text x="70" y="32" fontSize="14" fill={strokeColor} opacity="0.8" fontWeight="bold">
              %
            </text>
          </>
        );
    }
  };

  const textYOffset = type === "D4" ? 62 : 58;
  const fontSize =
    value !== undefined && value !== null && value > 99
      ? 22
      : value !== undefined && value !== null && value > 9
      ? 28
      : 34;

  return (
    <div
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(e);
        }
      }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: pixelSize,
        height: pixelSize,
        position: "relative",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s",
        filter: effectiveCrit
          ? "drop-shadow(0 0 8px rgba(234, 179, 8, 0.7))"
          : effectiveFumble
          ? "drop-shadow(0 0 8px rgba(239, 68, 68, 0.7))"
          : isBless
          ? "drop-shadow(0 0 10px rgba(56, 189, 248, 0.85)) drop-shadow(0 0 3px #38bdf8)"
          : color
          ? `drop-shadow(0 0 6px ${color}80)`
          : "none",
        opacity: isDiscarded ? 0.35 : 1,
        ...style,
      }}
      className={rolling ? "dicelite-rolling" : ""}
    >
      <svg
        viewBox="0 0 100 100"
        width={pixelSize}
        height={pixelSize}
        style={{ overflow: "visible" }}
      >
        {renderShape()}

        {/* Divine Bless Sparkle Icon */}
        {isBless && (
          <g transform="translate(68, 6)">
            <path
              d="M 10 0 Q 10 10 20 10 Q 10 10 10 20 Q 10 10 0 10 Q 10 10 10 0 Z"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="1.2"
            />
          </g>
        )}

        {/* Display value if provided */}
        {value !== undefined && value !== null && (
          <text
            x="50"
            y={textYOffset}
            textAnchor="middle"
            dominantBaseline="central"
            fill={textColor}
            fontSize={fontSize}
            fontWeight="bold"
            fontFamily="'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
            style={{
              textShadow: "0 1px 3px rgba(0,0,0,0.8)",
            }}
          >
            {value}
          </text>
        )}

        {/* Discarded cross-line */}
        {isDiscarded && (
          <line
            x1="18"
            y1="18"
            x2="82"
            y2="82"
            stroke="#ef4444"
            strokeWidth="5"
            strokeLinecap="round"
          />
        )}
      </svg>
    </div>
  );
};
