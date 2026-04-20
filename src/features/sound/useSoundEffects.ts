import { useCallback, useMemo, useRef, useState } from "react";
import {
  loadSoundMuted,
  saveSoundMuted,
} from "../../storage/repositories/soundRepo";
import { createSoundEffectsController } from "./soundEffects";

export const useSoundEffects = () => {
  const [isMuted, setIsMuted] = useState<boolean>(() => loadSoundMuted());
  const controllerRef = useRef(
    createSoundEffectsController({
      initialMuted: isMuted,
    }),
  );

  const applyMuted = useCallback((nextMuted: boolean) => {
    controllerRef.current.setMuted(nextMuted);
    setIsMuted(nextMuted);
    saveSoundMuted(nextMuted);
  }, []);

  const toggleMute = useCallback(() => {
    applyMuted(!controllerRef.current.isMuted());
  }, [applyMuted]);

  const api = useMemo(
    () => ({
      isMuted,
      toggleMute,
      playUiTap: () => controllerRef.current.playUiTap(),
      playCountdownTick: () => controllerRef.current.playCountdownTick(),
      playRoundStart: () => controllerRef.current.playRoundStart(),
      playCorrect: () => controllerRef.current.playCorrect(),
      playWrong: () => controllerRef.current.playWrong(),
      playStageClear: () => controllerRef.current.playStageClear(),
    }),
    [isMuted, toggleMute],
  );

  return api;
};
