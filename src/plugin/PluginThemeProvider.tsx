import { Theme as MuiTheme, createTheme } from "@mui/material/styles";
import ThemeProvider from "@mui/material/styles/ThemeProvider";
import OBR, { Theme } from "@owlbear-rodeo/sdk";
import React, { useEffect, useState } from "react";

function getTheme(theme?: Theme) {
  return createTheme({
    palette: {
      mode: "dark",
      primary: { main: "#f59e0b" }, // Amber / Gold accent
      secondary: { main: "#10b981" }, // Emerald accent
      background: {
        paper: "rgba(15, 17, 26, 0.88)",
        default: "transparent",
      },
      text: {
        primary: "#e2e8f0",
        secondary: "#94a3b8",
      },
    },
    typography: {
      fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      h6: { fontWeight: 600, color: "#f59e0b" },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: "transparent",
          },
          "::-webkit-scrollbar": { width: "6px" },
          "::-webkit-scrollbar-track": { background: "rgba(0,0,0,0.1)" },
          "::-webkit-scrollbar-thumb": {
            background: "rgba(245, 158, 11, 0.5)",
            borderRadius: "3px",
          },
        },
      },
      MuiButtonBase: { defaultProps: { disableRipple: true } },
      MuiIconButton: {
        styleOverrides: {
          root: {
            backgroundColor: "rgba(30, 41, 59, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#e2e8f0",
            margin: "2px",
            transition: "all 0.15s ease-in-out",
            "&:hover": {
              backgroundColor: "#f59e0b",
              color: "#0f172a",
              transform: "translateY(-1px)",
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            fontSize: "0.8rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backdropFilter: "blur(14px)",
            backgroundColor: "rgba(15, 17, 26, 0.92)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
            backgroundImage: "none",
          },
        },
      },
    },
  });
}

export function PluginThemeProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const [theme, setTheme] = useState<MuiTheme>(() => getTheme());
  const [ready, setReady] = useState(() => OBR.isReady);

  useEffect(() => {
    if (OBR.isAvailable) {
      OBR.onReady(() => setReady(true));
    }
  }, []);

  useEffect(() => {
    if (ready) {
      const updateTheme = (theme: Theme) => {
        setTheme(getTheme(theme));
      };
      OBR.theme.getTheme().then(updateTheme);
      return OBR.theme.onChange(updateTheme);
    }
  }, [ready]);

  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
