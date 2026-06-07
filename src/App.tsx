import { useGameSocket } from './hooks/useGameSocket';
import { Home } from './components/Home';
import { Queue } from './components/Queue';
import { Playing } from './components/Playing';
import { PostMatch } from './components/PostMatch';
import { Spectating } from './components/Spectating';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws';

function App() {
  const {
    state,
    setUsername,
    makeMove,
    sendRematchResponse,
    spectate,
    sendMessage,
    findMatch,
    goHome,
    goToQueue,
    isConnected,
  } = useGameSocket(WS_URL);

  const handleCellClick = (row: number, col: number) => {
    if (state.yourMark === state.currentTurn && state.phase === 'playing') {
      makeMove(row, col);
    }
  };

  const handleSetUsername = (username: string) => {
    setUsername(username);
    sendMessage({ type: 'set_username', username });
  };

  const handleRematch = () => {
    sendRematchResponse(true);
  };

  const handleNewOpponent = () => {
    sendRematchResponse(false);
    goToQueue();
    findMatch();
  };

  const handleReturnHome = () => {
    sendRematchResponse(false);
    goHome();
  };

  const handleSpectate = (userId: string) => {
    spectate(userId);
  };

  return (
    <div className="app">
      {!isConnected && state.connectionStatus !== 'failed' && (
        <div className="connection-status">Connecting...</div>
      )}

      {state.connectionStatus === 'failed' && (
        <div className="connection-status failed">
          Connection failed. Please refresh to try again.
        </div>
      )}

      {state.phase === 'home' && (
        <Home
          userId={state.userId}
          currentUsername={state.username}
          onSetUsername={handleSetUsername}
          error={state.error}
          matchTimeout={state.matchTimeout}
        />
      )}

      {state.phase === 'queue' && (
        <Queue position={state.queuePosition} />
      )}

      {state.phase === 'playing' && (
        <Playing
          board={state.board}
          yourMark={state.yourMark}
          opponentUsername={state.opponentUsername}
          currentTurn={state.currentTurn}
          userId={state.userId}
          username={state.username}
          stats={state.stats}
          countdownSecs={state.countdownSecs}
          winningCells={state.winningCells}
          connectionStatus={state.connectionStatus}
          opponentDisconnected={state.opponentDisconnected}
          onCellClick={handleCellClick}
        />
      )}

      {state.phase === 'post_match' && state.lastResult && (
        <PostMatch
          result={state.lastResult}
          yourMark={state.yourMark}
          board={state.board}
          winningCells={state.winningCells}
          stats={state.stats}
          onRematch={handleRematch}
          onNewOpponent={handleNewOpponent}
          onReturnHome={handleReturnHome}
          countdownSecs={state.countdownSecs}
        />
      )}

      {state.phase === 'spectating' && (
        <Spectating
          board={state.board}
          currentTurn={state.currentTurn}
          countdownSecs={state.countdownSecs}
          matchEnded={!!state.lastResult}
          matchResult={state.lastResult?.result || ''}
          onSpectate={handleSpectate}
          error={state.error}
        />
      )}
    </div>
  );
}

export default App;
