import MuiGlobalStyles from "@mui/material/GlobalStyles";
import { useTheme } from "@mui/material/styles";
import { useMemo } from "react";

export function GlobalStyles() {
  const theme = useTheme();
  const mode = theme.palette.mode;

  const styles = useMemo(() => {
    return {
      body: {
        overflow: "hidden",
        userSelect: "none",
        backgroundColor: "transparent",
      },
      div: {
        ".simplebar-scrollbar:before": {
          background: mode === "dark" ? "#fff" : "rgba(0, 0, 0, 0.87)",
        },
        ".simplebar-track.simplebar-horizontal": {
          bottom: "6px",
        },
        ":not(.simplebar-content-wrapper)::-webkit-scrollbar": {
          backgroundColor: "transparent",
          borderRadius: "100px",
        },
        ":not(.simplebar-content-wrapper)::-webkit-scrollbar:vertical": {
          width: "6px",
        },
        ":not(.simplebar-content-wrapper)::-webkit-scrollbar-thumb": {
          backgroundColor:
            mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.3)",
          borderRadius: "10px",
        },
      },
      "@keyframes diceBounce": {
        "0%": {
          transform: "scale(0.3) rotate(-30deg)",
          opacity: 0,
        },
        "50%": {
          transform: "scale(1.15) rotate(10deg)",
        },
        "75%": {
          transform: "scale(0.95) rotate(-5deg)",
        },
        "100%": {
          transform: "scale(1) rotate(0deg)",
          opacity: 1,
        },
      },
      ".dicelite-rolling": {
        animation: "diceBounce 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
      },
    };
  }, [mode]);

  return <MuiGlobalStyles styles={styles} />;
}
