import type { Mark, Stats } from '../types';

interface PlayingProps {
  board: Mark[][];
  yourMark: Mark;
  opponentUsername: string;
  currentTurn: Mark;
  userId: string;
  username: string;
  stats: Stats;
  countdownSecs: number | null;
  winningCells: [number, number][] | null;
  connectionStatus: string;
  opponentDisconnected: boolean;
  onCellClick: (row: number, col: number) => void;
}

export function Playing({
  board,
  yourMark,
  opponentUsername,
  currentTurn,
  userId,
  username,
  stats,
  countdownSecs,
  winningCells,
  connectionStatus,
  opponentDisconnected,
  onCellClick,
}: PlayingProps) {
  const isMyTurn = yourMark === currentTurn;
  const isReconnecting = connectionStatus === 'reconnecting';
  const isFailed = connectionStatus === 'failed';

  const isWinningCell = (row: number, col: number): boolean => {
    if (!winningCells) return false;
    return winningCells.some(([r, c]) => r === row && c === col);
  };

  return (
    <div className="playing">
      <div className="game-header">
        <div className="player-info">
          <span className="label">You</span>
          <span className="username">{username}</span>
          <span className="mark">{yourMark}</span>
        </div>
        <div className="vs">vs</div>
        <div className="player-info">
          <span className="label">Opponent</span>
          <span className="username">{opponentUsername}</span>
          <span className="mark">{yourMark === 'X' ? 'O' : 'X'}</span>
        </div>
      </div>

      <div className="turn-indicator">
        {isMyTurn ? 'Your turn' : `${opponentUsername}'s turn`}
      </div>

      {countdownSecs !== null && (
        <div className="countdown" data-testid="countdown">
          Time remaining: {countdownSecs}s
        </div>
      )}

      <div className="board">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const win = isWinningCell(r, c);
            return (
              <button
                key={`${r}-${c}`}
                className={`cell ${cell ? 'filled' : ''} ${win ? 'winning' : ''}`}
                onClick={() => onCellClick(r, c)}
                disabled={!!cell || !isMyTurn || isReconnecting || isFailed}
                data-testid={`cell-${r}-${c}`}
              >
                {cell}
              </button>
            );
          })
        )}
      </div>

      <div className="session-bar">
        <span>ID: <code>{userId}</code></span>
        <span>W: {stats.wins} L: {stats.losses} D: {stats.draws}</span>
      </div>

      {opponentDisconnected && (
        <div className="notification">
          Opponent disconnected. Waiting for reconnect...
        </div>
      )}

      {isReconnecting && (
        <div className="overlay">
          <div className="overlay-content">
            <h3>Reconnecting...</h3>
            <div className="spinner" />
          </div>
        </div>
      )}

      {isFailed && (
        <div className="overlay">
          <div className="overlay-content">
            <h3>Connection Lost</h3>
            <p>Unable to reconnect. Please return to home.</p>
          </div>
        </div>
      )}
    </div>
  );
}
