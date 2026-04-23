import { Volume2, VolumeX } from "lucide-react";
import { useI18n } from "../../shared/i18n";

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
  const { t } = useI18n();

  return (
    <button
      className="sound-icon-button"
      type="button"
      onClick={() => {
        onUiTap?.();
        onToggleMute();
      }}
      aria-label={isMuted ? t("sound.unmute") : t("sound.mute")}
    >
      {isMuted ? (
        <VolumeX size={16} aria-hidden="true" />
      ) : (
        <Volume2 size={16} aria-hidden="true" />
      )}
    </button>
  );
};
