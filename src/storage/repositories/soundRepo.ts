import { SOUND_MUTED_STORAGE_KEY } from "../keys";

const TRUE_LITERAL = "true";
const FALSE_LITERAL = "false";

export const loadSoundMuted = (): boolean => {
  try {
    const raw = localStorage.getItem(SOUND_MUTED_STORAGE_KEY);
    if (raw === TRUE_LITERAL) return true;
    if (raw === FALSE_LITERAL || raw === null) return false;
    return false;
  } catch {
    return false;
  }
};

export const saveSoundMuted = (isMuted: boolean) => {
  try {
    localStorage.setItem(
      SOUND_MUTED_STORAGE_KEY,
      isMuted ? TRUE_LITERAL : FALSE_LITERAL,
    );
  } catch {
    // Ignore storage write errors to keep gameplay uninterrupted.
  }
};
