import React from "react";
import ReactDOM from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";

import "./fonts/fonts.css";
import { GlobalStyles } from "./GlobalStyles";
import { PluginThemeProvider } from "./plugin/PluginThemeProvider";
import { PartyRollToasts } from "./plugin/PartyRollToasts";
import { Beyond20Listener } from "./plugin/Beyond20Listener";
import { GlobalHistorySync } from "./plugin/GlobalHistorySync";
import { PluginGate } from "./plugin/PluginGate";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PluginThemeProvider>
      <CssBaseline />
      <GlobalStyles />
      <PluginGate>
        <Beyond20Listener />
        <GlobalHistorySync readOnly={true} />
        <PartyRollToasts />
      </PluginGate>
    </PluginThemeProvider>
  </React.StrictMode>
);
