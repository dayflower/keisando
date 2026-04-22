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
      setMuted: (nextMuted: boolean) => applyMuted(nextMuted),
      toggleMute,
      startBgm: () => controllerRef.current.startBgm(),
      stopBgm: () => controllerRef.current.stopBgm(),
      playUiTap: () => controllerRef.current.playUiTap(),
      playCountdownTick: () => controllerRef.current.playCountdownTick(),
      playRoundStart: () => controllerRef.current.playRoundStart(),
      playCorrect: () => controllerRef.current.playCorrect(),
      playWrong: () => controllerRef.current.playWrong(),
      playClearGlobalBest: () => controllerRef.current.playClearGlobalBest(),
      playClearMyBest: () => controllerRef.current.playClearMyBest(),
      playClearNoMistake: () => controllerRef.current.playClearNoMistake(),
      playClearWithMistake: () => controllerRef.current.playClearWithMistake(),
    }),
    [applyMuted, isMuted, toggleMute],
  );

  return api;
};
