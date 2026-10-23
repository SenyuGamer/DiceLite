import React, { useState, useEffect } from "react";
import OBR, { Player } from "@owlbear-rodeo/sdk";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import SimpleBar from "simplebar-react";
import CasinoIcon from "@mui/icons-material/CasinoRounded";
import BookmarkIcon from "@mui/icons-material/BookmarkRounded";
import SettingsIcon from "@mui/icons-material/SettingsRounded";
import GroupIcon from "@mui/icons-material/GroupRounded";

import { DicePicker } from "./DicePicker";
import { DiceHidden } from "./DiceHidden";
import { DiceHistory } from "./DiceHistory";
import { GlobalHistory } from "./GlobalHistory";
import { SavedRollsModal } from "./SavedRollsModal";
import { SettingsModal } from "./SettingsModal";
import { PlayerAvatar } from "../plugin/PlayerAvatar";
import { PlayerTrayDialog } from "../plugin/PlayerTrayDialog";

interface SidebarSectionProps {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SidebarSection: React.FC<SidebarSectionProps> = ({
  icon,
  label,
  open,
  onToggle,
  children,
}) => {
  return (
    <Stack spacing={0.5} width="100%" alignItems="center">
      <Tooltip title={label} placement="right" arrow>
        <IconButton
          size="small"
          onClick={onToggle}
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2,
            color: open ? "primary.main" : "text.secondary",
            bgcolor: open ? "rgba(245, 158, 11, 0.12)" : "transparent",
            border: open ? "1px solid rgba(245, 158, 11, 0.3)" : "1px solid transparent",
            "&:hover": {
              bgcolor: "rgba(245, 158, 11, 0.2)",
              color: "primary.main",
            },
          }}
        >
          {icon}
        </IconButton>
      </Tooltip>
      {open && children}
    </Stack>
  );
};

export const Sidebar: React.FC = () => {
  const [diceOpen, setDiceOpen] = useState(true);
  const [savedRollsOpen, setSavedRollsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Party members
  const [otherPlayers, setOtherPlayers] = useState<Player[]>([]);
  const [focusedPlayer, setFocusedPlayer] = useState<Player | null>(null);

  useEffect(() => {
    if (!OBR.isAvailable) return;

    let unsub: (() => void) | undefined;
    let isCancelled = false;

    OBR.onReady(async () => {
      if (isCancelled) return;
      try {
        const myId = OBR.player.id;
        const players = await OBR.party.getPlayers();
        if (!isCancelled) {
          setOtherPlayers(players.filter((p) => p.id !== myId));
        }

        unsub = OBR.party.onChange((players) => {
          if (!isCancelled) {
            setOtherPlayers(players.filter((p) => p.id !== myId));
          }
        });
      } catch (err) {
        console.warn("Could not fetch players:", err);
      }
    });

    return () => {
      isCancelled = true;
      if (unsub) unsub();
    };
  }, []);

  return (
    <SimpleBar
      style={{
        maxHeight: "100vh",
        width: "56px",
        minWidth: "56px",
        overflowY: "auto",
        flexShrink: 0,
        backgroundColor: "rgba(15, 17, 26, 0.75)",
        backdropFilter: "blur(8px)",
        borderRight: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <Stack p={0.4} spacing={0.4} alignItems="center">
        {/* Dados Section */}
        <SidebarSection
          icon={<CasinoIcon fontSize="small" />}
          label="Dados"
          open={diceOpen}
          onToggle={() => setDiceOpen((v) => !v)}
        >
          <Stack spacing={0.5} alignItems="center" pb={0.5}>
            <DicePicker />
            <Divider flexItem sx={{ mx: 0.5, my: 0.2 }} />
            <DiceHidden />
          </Stack>
        </SidebarSection>

        <Divider flexItem sx={{ mx: 0.5 }} />

        {/* Herramientas (siempre visibles) */}
        <Stack spacing={0.6} alignItems="center" pb={0.5}>
          <DiceHistory />
          <GlobalHistory />
          <Tooltip title="Tiradas Guardadas" placement="right" enterDelay={350} arrow>
            <IconButton
              size="small"
              onClick={() => setSavedRollsOpen(true)}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                color: "text.secondary",
                "&:hover": {
                  bgcolor: "rgba(245, 158, 11, 0.15)",
                  color: "primary.main",
                },
              }}
            >
              <BookmarkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>

        <Divider flexItem sx={{ mx: 0.5 }} />

        {/* Configuración del Sistema */}
        <Tooltip title="Configuración" placement="right" enterDelay={350} arrow>
          <IconButton onClick={() => setSettingsOpen(true)}>
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {/* Jugadores en la Sala (Avatares dinámicos) */}
        {otherPlayers.length > 0 && (
          <>
            <Divider flexItem sx={{ mx: 0.5, my: 0.5 }} />
            <Tooltip title={`Jugadores (${otherPlayers.length})`} placement="right" enterDelay={350} arrow>
              <GroupIcon sx={{ fontSize: 16, color: "text.secondary", opacity: 0.7, mb: 0.3 }} />
            </Tooltip>
            {otherPlayers.map((player) => (
              <PlayerAvatar
                key={player.id}
                player={player}
                onSelect={() => setFocusedPlayer(player)}
              />
            ))}
          </>
        )}
      </Stack>

      {savedRollsOpen && (
        <SavedRollsModal
          open={savedRollsOpen}
          onClose={() => setSavedRollsOpen(false)}
        />
      )}
      {settingsOpen && (
        <SettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      )}
      <PlayerTrayDialog
        player={focusedPlayer}
        onClose={() => setFocusedPlayer(null)}
      />
    </SimpleBar>
  );
};
