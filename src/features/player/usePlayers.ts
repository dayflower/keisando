import { useEffect, useMemo, useState } from "react";
import { PLAYER_NAME_MAX_LENGTH } from "../../shared/constants";
import { createPlayerId } from "../../shared/ids";
import type { Player } from "../../shared/types";
import {
  loadActivePlayerId,
  loadPlayers,
  normalizeAndValidatePlayerName,
  saveActivePlayerId,
  savePlayers,
} from "../../storage/repositories/playersRepo";

type RegisterPlayerResult =
  | { ok: true; player: Player }
  | { ok: false; error: string };

export const usePlayers = () => {
  const [players, setPlayers] = useState<Player[]>(() => loadPlayers());
  const [activePlayerId, setActivePlayerId] = useState<string | null>(() =>
    loadActivePlayerId(),
  );

  useEffect(() => {
    if (players.length === 0) {
      if (activePlayerId !== null) {
        setActivePlayerId(null);
      }
      return;
    }

    if (
      activePlayerId !== null &&
      !players.some((player) => player.id === activePlayerId)
    ) {
      setActivePlayerId(players[0].id);
    }
  }, [activePlayerId, players]);

  useEffect(() => {
    savePlayers(players);
  }, [players]);

  useEffect(() => {
    saveActivePlayerId(activePlayerId);
  }, [activePlayerId]);

  const activePlayer = useMemo(
    () => players.find((player) => player.id === activePlayerId) ?? null,
    [activePlayerId, players],
  );

  const playerNameById = useMemo(
    () => new Map(players.map((player) => [player.id, player.name])),
    [players],
  );

  const selectPlayer = (playerId: string) => {
    setActivePlayerId(playerId);
  };

  const registerPlayer = (name: string): RegisterPlayerResult => {
    const normalizedName = normalizeAndValidatePlayerName(name);
    if (!normalizedName) {
      return {
        ok: false,
        error: `Name must be 1-${PLAYER_NAME_MAX_LENGTH} characters.`,
      };
    }

    const isDuplicate = players.some(
      (player) => player.name.toLowerCase() === normalizedName.toLowerCase(),
    );
    if (isDuplicate) {
      return {
        ok: false,
        error: "This player name already exists.",
      };
    }

    const nextPlayer: Player = {
      id: createPlayerId(),
      name: normalizedName,
      createdAt: Date.now(),
    };

    setPlayers((prev) => [...prev, nextPlayer]);
    setActivePlayerId(nextPlayer.id);

    return {
      ok: true,
      player: nextPlayer,
    };
  };

  const resetPlayers = () => {
    setPlayers([]);
    setActivePlayerId(null);
  };

  return {
    players,
    activePlayerId,
    activePlayer,
    playerNameById,
    selectPlayer,
    registerPlayer,
    resetPlayers,
  };
};
