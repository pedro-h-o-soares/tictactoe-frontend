import { useState } from 'react';
import type { Mark } from '../types';

interface SpectatingProps {
  board: Mark[][];
  currentTurn: Mark;
  countdownSecs: number | null;
  matchEnded: boolean;
  matchResult: string;
  onSpectate: (userId: string) => void;
  error: string | null;
}

export function Spectating({
  board,
  currentTurn,
  countdownSecs,
  matchEnded,
  matchResult,
  onSpectate,
  error,
}: SpectatingProps) {
  const [userId, setUserId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.trim()) {
      onSpectate(userId.trim());
    }
  };

  if (board.every(row => row.every(c => c === '')) && !matchEnded) {
    return (
      <div className="spectating">
        <h2>Spectate a Game</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter User ID to spectate"
          />
          <button type="submit">Watch</button>
        </form>
        {error && <div className="error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="spectating">
      <h2>Spectating</h2>

      <div className="turn-indicator">
        {matchEnded ? 'Game ended' : `${currentTurn}'s turn`}
      </div>

      {countdownSecs !== null && (
        <div className="countdown">Time remaining: {countdownSecs}s</div>
      )}

      <div className="board read-only">
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div key={`${r}-${c}`} className={`cell ${cell ? 'filled' : ''}`}>
              {cell}
            </div>
          ))
        )}
      </div>

      {matchEnded && (
        <div className="match-result">
          <h3>Result: {matchResult}</h3>
          <button onClick={() => window.location.reload()}>Watch Another Game</button>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  );
}
