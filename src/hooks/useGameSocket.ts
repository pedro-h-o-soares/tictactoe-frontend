import { useCallback, useEffect, useReducer } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import type { GameState, MatchEndPayload, Mark, Phase } from '../types';
import { createInitialState, loadStoredUserId, storeUsername, storeUserId } from '../types';

type Action =
  | { type: 'session_init'; userId: string }
  | { type: 'username_ok' }
  | { type: 'error'; code: string; message: string }
  | { type: 'queue_position'; position: number }
  | { type: 'queue_timeout' }
  | { type: 'match_start'; matchId: string; yourMark: string; opponentUsername: string; moveTimeoutSecs: number }
  | { type: 'board_update'; board: string[][]; turn: string; lastMove?: { row: number; col: number; mark: string; auto: boolean } }
  | { type: 'countdown'; remainingSecs: number }
  | { type: 'match_end'; result: string; winnerMark: string; winningCells: [number, number][] | null; stats: { wins: number; losses: number; draws: number }; reason?: string }
  | { type: 'post_match'; rematchDeadlineSecs: number }
  | { type: 'opponent_disconnected'; reconnectWindowSecs: number }
  | { type: 'opponent_reconnected' }
  | { type: 'connection_change'; status: 'connected' | 'reconnecting' | 'failed' }
  | { type: 'set_username'; username: string }
  | { type: 'match_cleanup' }
  | { type: 'set_phase'; phase: Phase };

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'session_init':
      return { ...state, userId: action.userId };

    case 'username_ok':
      return { ...state, phase: 'queue' };

    case 'error':
      return { ...state, error: action.message };

    case 'queue_position':
      return { ...state, queuePosition: action.position };

    case 'queue_timeout':
      return { ...state, phase: 'home', matchTimeout: true };

    case 'match_start': {
      const board: Mark[][] = [['', '', ''], ['', '', ''], ['', '', '']];
      return {
        ...state,
        phase: 'playing',
        matchId: action.matchId,
        yourMark: action.yourMark as Mark,
        opponentUsername: action.opponentUsername,
        currentTurn: 'X',
        board,
        countdownSecs: action.moveTimeoutSecs,
        winningCells: null,
        lastResult: null,
        error: null,
        matchTimeout: false,
        opponentDisconnected: false,
      };
    }

    case 'board_update': {
      const board = action.board.map(row => row.map(c => (c === '' ? '' : c)) as Mark[]);
      return {
        ...state,
        board,
        currentTurn: action.turn as Mark,
        winningCells: null,
      };
    }

    case 'countdown':
      return { ...state, countdownSecs: action.remainingSecs };

    case 'match_end': {
      const payload: MatchEndPayload = {
        type: 'match_end',
        result: action.result,
        winner_mark: action.winnerMark,
        winning_cells: action.winningCells,
        stats: action.stats,
        reason: action.reason,
      };
      const cells = action.winningCells as [number, number][] | null;
      return {
        ...state,
        lastResult: payload,
        stats: action.stats,
        winningCells: cells,
        countdownSecs: null,
        phase: 'post_match',
      };
    }

    case 'post_match':
      return { ...state, phase: 'post_match', countdownSecs: action.rematchDeadlineSecs };

    case 'opponent_disconnected':
      return { ...state, countdownSecs: null, opponentDisconnected: true };

    case 'opponent_reconnected':
      return { ...state, opponentDisconnected: false };

    case 'match_cleanup':
      if (state.phase !== 'post_match') return state;
      return { ...state, phase: 'home', lastResult: null, error: null };

    case 'set_phase':
      return { ...state, phase: action.phase };

    case 'connection_change':
      return { ...state, connectionStatus: action.status };

    case 'set_username':
      storeUsername(action.username);
      return { ...state, username: action.username, error: null };

    default:
      return state;
  }
}

export function useGameSocket(url: string) {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);

  const { sendJsonMessage, readyState, lastJsonMessage } = useWebSocket(url, {
    onOpen: () => dispatch({ type: 'connection_change', status: 'connected' }),
    onClose: () => dispatch({ type: 'connection_change', status: 'reconnecting' }),
    onError: () => dispatch({ type: 'connection_change', status: 'failed' }),
    shouldReconnect: () => true,
    reconnectInterval: 3000,
    reconnectAttempts: 10,
    onReconnectStop: () => dispatch({ type: 'connection_change', status: 'failed' }),
    share: true,
  });

  useEffect(() => {
    if (lastJsonMessage !== null) {
      const msg = lastJsonMessage as Record<string, unknown>;
      switch (msg.type) {
        case 'session_init': {
          const newUserId = msg.user_id as string;
          const storedUserId = loadStoredUserId();
          if (storedUserId && storedUserId !== newUserId) {
            sendJsonMessage({ type: 'reconnect', user_id: storedUserId });
          }
          storeUserId(newUserId);
          dispatch({ type: 'session_init', userId: newUserId });
          break;
        }
        case 'username_ok':
          dispatch({ type: 'username_ok' });
          sendJsonMessage({ type: 'find_match' });
          break;
        case 'error':
          dispatch({ type: 'error', code: msg.code as string, message: msg.message as string });
          break;
        case 'queue_position':
          dispatch({ type: 'queue_position', position: msg.position as number });
          break;
        case 'queue_timeout':
          dispatch({ type: 'queue_timeout' });
          break;
        case 'match_start':
          dispatch({
            type: 'match_start',
            matchId: msg.match_id as string,
            yourMark: msg.your_mark as string,
            opponentUsername: msg.opponent_username as string,
            moveTimeoutSecs: msg.move_timeout_secs as number,
          });
          break;
        case 'board_update':
          dispatch({
            type: 'board_update',
            board: msg.board as string[][],
            turn: msg.turn as string,
            lastMove: msg.last_move as { row: number; col: number; mark: string; auto: boolean } | undefined,
          });
          break;
        case 'countdown':
          dispatch({ type: 'countdown', remainingSecs: msg.remaining_secs as number });
          break;
        case 'match_end':
          dispatch({
            type: 'match_end',
            result: msg.result as string,
            winnerMark: msg.winner_mark as string,
            winningCells: msg.winning_cells as [number, number][] | null,
            stats: msg.stats as { wins: number; losses: number; draws: number },
            reason: msg.reason as string | undefined,
          });
          break;
        case 'post_match':
          dispatch({ type: 'post_match', rematchDeadlineSecs: msg.rematch_deadline_secs as number });
          break;
        case 'opponent_disconnected':
          dispatch({ type: 'opponent_disconnected', reconnectWindowSecs: msg.reconnect_window_secs as number });
          break;
        case 'opponent_reconnected':
          dispatch({ type: 'opponent_reconnected' });
          break;
        case 'match_cleanup':
          dispatch({ type: 'match_cleanup' });
          break;
      }
    }
  }, [lastJsonMessage]);

  const setUsername = useCallback((username: string) => {
    dispatch({ type: 'set_username', username });
  }, []);

  const sendMessage = useCallback((msg: Record<string, unknown>) => {
    sendJsonMessage(msg);
  }, [sendJsonMessage]);

  const findMatch = useCallback(() => {
    sendMessage({ type: 'find_match' });
  }, [sendMessage]);

  const makeMove = useCallback((row: number, col: number) => {
    sendMessage({ type: 'move', row, col });
  }, [sendMessage]);

  const sendRematchResponse = useCallback((accept: boolean) => {
    sendMessage({ type: 'rematch_response', accept });
  }, [sendMessage]);

  const spectate = useCallback((userId: string) => {
    sendMessage({ type: 'spectate', user_id: userId });
  }, [sendMessage]);

  const reconnect = useCallback((userId: string) => {
    sendMessage({ type: 'reconnect', user_id: userId });
  }, [sendMessage]);

  const goHome = useCallback(() => {
    dispatch({ type: 'match_cleanup' });
  }, []);

  const goToQueue = useCallback(() => {
    dispatch({ type: 'match_cleanup' });
    dispatch({ type: 'set_phase', phase: 'queue' });
  }, []);

  const isConnected = readyState === ReadyState.OPEN;

  return {
    state,
    dispatch,
    isConnected,
    setUsername,
    findMatch,
    makeMove,
    sendRematchResponse,
    spectate,
    reconnect,
    sendMessage,
    goHome,
    goToQueue,
  };
}
