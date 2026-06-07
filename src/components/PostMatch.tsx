import { useState, useEffect } from 'react';
import type { Mark, MatchEndPayload, Stats } from '../types';

interface PostMatchProps {
  result: MatchEndPayload;
  yourMark: Mark;
  board: Mark[][];
  winningCells: [number, number][] | null;
  stats: Stats;
  onRematch: () => void;
  onNewOpponent: () => void;
  onReturnHome: () => void;
  countdownSecs: number | null;
}

export function PostMatch({ result, yourMark, stats, board, winningCells, onRematch, onNewOpponent, onReturnHome, countdownSecs }: PostMatchProps) {
  const [rematchSent, setRematchSent] = useState(false);

  const handleRematch = () => {
    setRematchSent(true);
    onRematch();
  };

  const isWinningCell = (row: number, col: number): boolean => {
    if (!winningCells) return false;
    return winningCells.some(([r, c]) => r === row && c === col);
  };

  const isDraw = !result.winner_mark;
  const isLoss = !isDraw && yourMark !== result.winner_mark;
  const isWin = !isDraw && !isLoss;

  const resultText = () => {
    if (isDraw) return "It's a draw!";
    if (isWin) return 'You won!';
    return 'You lose!';
  };

  const [localCountdown, setLocalCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdownSecs !== null && countdownSecs > 0) {
      setLocalCountdown(countdownSecs);
      const timer = setInterval(() => {
        setLocalCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setLocalCountdown(null);
    }
  }, [countdownSecs]);

  const forfeitReason = result.reason === 'opponent_disconnected' ? 'Opponent left the game' : null;

  return (
    <div className="post-match">
      <h2>{resultText()}</h2>
      {forfeitReason && isWin && <p className="forfeit-reason">{forfeitReason}</p>}

      <div className="board">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const win = isWinningCell(r, c);
            return (
              <div
                key={`${r}-${c}`}
                className={`cell ${cell ? 'filled' : ''} ${win ? 'winning' : ''} ${win && isLoss ? 'loss' : ''}`}
              >
                {cell}
              </div>
            );
          })
        )}
      </div>

      <div className="stats">
        <p>Wins: {stats.wins}</p>
        <p>Losses: {stats.losses}</p>
        <p>Draws: {stats.draws}</p>
      </div>

      <div className="actions">
        <button onClick={handleRematch} disabled={rematchSent}>
          {rematchSent ? 'Waiting...' : 'Rematch'}
        </button>
        <button onClick={onNewOpponent}>Find New Opponent</button>
        <button onClick={onReturnHome}>Return to Home</button>
      </div>

      {localCountdown !== null && (
        <p className="countdown">Rematch deadline: {localCountdown}s</p>
      )}
    </div>
  );
}
