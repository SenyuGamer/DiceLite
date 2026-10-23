import OBR from "@owlbear-rodeo/sdk";
import React, { useEffect, useState } from "react";

export function PluginGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (OBR.isAvailable) {
      OBR.onReady(() => setReady(true));
    } else {
      // Local testing outside Owlbear
      setReady(true);
    }
  }, []);

  if (ready) {
    return <>{children}</>;
  } else {
    return null;
  }
}
