import type { FormEvent } from "react";
import { PLAYER_NAME_MAX_LENGTH } from "../../shared/constants";
import type { Player } from "../../shared/types";

type PlayerSelectScreenProps = {
  players: Player[];
  activePlayerId: string | null;
  newPlayerName: string;
  registerError: string | null;
  onSetNewPlayerName: (name: string) => void;
  onSelectPlayer: (playerId: string) => void;
  onRegisterPlayer: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
};

export const PlayerSelectScreen = ({
  players,
  activePlayerId,
  newPlayerName,
  registerError,
  onSetNewPlayerName,
  onSelectPlayer,
  onRegisterPlayer,
  onClose,
}: PlayerSelectScreenProps) => {
  return (
    <main className="app">
      <section className="stage-card">
        <div className="stage-head-row">
          <p className="stage-tag">Select Player</p>
          <button
            className="close-button"
            type="button"
            onClick={onClose}
            aria-label="Back to stage select"
          >
            ×
          </button>
        </div>
        <h1 className="title">Keisando</h1>
        <p className="stage-select-description">Choose your active player.</p>

        {players.length > 0 ? (
          <div className="player-list">
            {players.map((player) => {
              const isCurrent = player.id === activePlayerId;

              return (
                <button
                  className={`player-item ${isCurrent ? "player-item-active" : ""}`}
                  key={player.id}
                  type="button"
                  onClick={() => onSelectPlayer(player.id)}
                >
                  <span className="player-item-name">{player.name}</span>
                  {isCurrent && (
                    <span className="player-item-badge">Active</span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="stage-select-hint">
            No player yet. Register one below.
          </p>
        )}

        <form className="player-register-form" onSubmit={onRegisterPlayer}>
          <label className="player-register-label" htmlFor="player-name-input">
            New Player Name
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
            <button className="clear-close-button" type="submit">
              Register
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};
