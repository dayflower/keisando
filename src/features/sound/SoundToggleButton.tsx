import { Volume2, VolumeX } from "lucide-react";

type SoundToggleButtonProps = {
  isMuted: boolean;
  onToggleMute: () => void;
  onUiTap?: () => void;
};

export const SoundToggleButton = ({
  isMuted,
  onToggleMute,
  onUiTap,
}: SoundToggleButtonProps) => {
  return (
    <button
      className="sound-icon-button"
      type="button"
      onClick={() => {
        onUiTap?.();
        onToggleMute();
      }}
      aria-label={isMuted ? "Unmute sound effects" : "Mute sound effects"}
    >
      {isMuted ? (
        <VolumeX size={16} aria-hidden="true" />
      ) : (
        <Volume2 size={16} aria-hidden="true" />
      )}
    </button>
  );
};
