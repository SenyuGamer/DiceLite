import React from "react";
import Box from "@mui/material/Box";
import { Sidebar } from "./controls/Sidebar";
import { QuickRollPanel } from "./controls/QuickRollPanel";
import { DiceMat } from "./components/DiceMat";
import { Beyond20Listener } from "./plugin/Beyond20Listener";
import { DiceRollSync } from "./plugin/DiceRollSync";
import { GlobalHistorySync } from "./plugin/GlobalHistorySync";
import { PluginGate } from "./plugin/PluginGate";

export const App: React.FC = () => {
  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "transparent",
      }}
    >
      <Beyond20Listener />
      <PluginGate>
        <DiceRollSync />
        <GlobalHistorySync readOnly={false} />
      </PluginGate>

      {/* Left Sidebar: Dice Picker & Controls */}
      <Sidebar />

      {/* Center Virtual Dice Mat */}
      <Box sx={{ flexGrow: 1, minWidth: 0, height: "100%", position: "relative", overflow: "hidden" }}>
        <DiceMat />
      </Box>

      {/* Right Quick Rolls Panel */}
      <QuickRollPanel />
    </Box>
  );
};
