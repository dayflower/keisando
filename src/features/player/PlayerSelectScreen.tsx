import { ArrowLeft } from "lucide-react";
import type { FormEvent } from "react";
import { PLAYER_NAME_MAX_LENGTH } from "../../shared/constants";
import { useI18n } from "../../shared/i18n";
import type { Player } from "../../shared/types";
import { SoundToggleButton } from "../sound/SoundToggleButton";

type PlayerSelectScreenProps = {
  players: Player[];
  activePlayerId: string | null;
  newPlayerName: string;
  registerError: string | null;
  onSetNewPlayerName: (name: string) => void;
  onSelectPlayer: (playerId: string) => void;
  onRegisterPlayer: (event: FormEvent<HTMLFormElement>) => void;
  onBackToStageSelect: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onUiTap?: () => void;
};

export const PlayerSelectScreen = ({
  players,
  activePlayerId,
  newPlayerName,
  registerError,
  onSetNewPlayerName,
  onSelectPlayer,
  onRegisterPlayer,
  onBackToStageSelect,
  isMuted,
  onToggleMute,
  onUiTap,
}: PlayerSelectScreenProps) => {
  const { t } = useI18n();

  return (
    <main className="app">
      <section className="stage-card">
        <div className="stage-head-row">
          <p className="stage-tag">{t("playerSelect.screenTag")}</p>
          <div className="stage-head-actions">
            <button
              className="back-icon-button"
              type="button"
              onClick={() => {
                onUiTap?.();
                onBackToStageSelect();
              }}
              aria-label={t("common.backToStageSelect")}
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <SoundToggleButton
              isMuted={isMuted}
              onToggleMute={onToggleMute}
              onUiTap={onUiTap}
            />
          </div>
        </div>
        <h1 className="title">{t("common.appName")}</h1>
        <p className="stage-select-description">
          {t("playerSelect.description")}
        </p>

        {players.length > 0 ? (
          <div className="player-list">
            {players.map((player) => {
              const isCurrent = player.id === activePlayerId;

              return (
                <button
                  className={`player-item ${isCurrent ? "player-item-active" : ""}`}
                  key={player.id}
                  type="button"
                  onClick={() => {
                    onUiTap?.();
                    onSelectPlayer(player.id);
                  }}
                >
                  <span className="player-item-name">{player.name}</span>
                  {isCurrent && (
                    <span className="player-item-badge">
                      {t("playerSelect.active")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="stage-select-hint">{t("playerSelect.empty")}</p>
        )}

        <form
          className="player-register-form"
          onSubmit={(event) => {
            onUiTap?.();
            onRegisterPlayer(event);
          }}
        >
          <label className="player-register-label" htmlFor="player-name-input">
            {t("playerSelect.newPlayerName")}
          </label>
          <input
            id="player-name-input"
            className="player-register-input"
            type="text"
            value={newPlayerName}
            maxLength={PLAYER_NAME_MAX_LENGTH}
            onChange={(event) => {
              onSetNewPlayerName(event.target.value);
            }}
          />
          {registerError && (
            <p className="player-register-error">{registerError}</p>
          )}
          <div className="player-register-actions">
            <button className="primary-action-button" type="submit">
              {t("playerSelect.register")}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};
