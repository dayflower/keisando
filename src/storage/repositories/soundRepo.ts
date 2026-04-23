import { SOUND_MUTED_STORAGE_KEY } from "../keys";
import { loadStoredValue, saveStoredValue } from "./storageHelpers";

const TRUE_LITERAL = "true";
const FALSE_LITERAL = "false";

export const loadSoundMuted = (): boolean => {
  const raw = loadStoredValue(SOUND_MUTED_STORAGE_KEY);
  if (raw === TRUE_LITERAL) return true;
  if (raw === FALSE_LITERAL || raw === null) return false;
  return false;
};

export const saveSoundMuted = (isMuted: boolean) => {
  saveStoredValue(
    SOUND_MUTED_STORAGE_KEY,
    isMuted ? TRUE_LITERAL : FALSE_LITERAL,
  );
};
