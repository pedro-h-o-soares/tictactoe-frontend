export type Mark = 'X' | 'O' | '';

export type Phase = 'home' | 'queue' | 'playing' | 'post_match' | 'spectating';

export interface Stats {
  wins: number;
  losses: number;
  draws: number;
}



export interface LastMove {
  row: number;
  col: number;
  mark: string;
  auto: boolean;
}

export interface GameState {
  phase: Phase;
  userId: string;
  username: string;
  stats: Stats;
  board: Mark[][];
  yourMark: Mark;
  opponentUsername: string;
  currentTurn: Mark;
  matchId: string;
  countdownSecs: number | null;
  lastResult: MatchEndPayload | null;
  queuePosition: number | null;
  connectionStatus: 'connected' | 'reconnecting' | 'failed';
  error: string | null;
  winningCells: [number, number][] | null;
  matchTimeout: boolean;
  opponentDisconnected: boolean;
}

export interface MatchEndPayload {
  type: string;
  result: string;
  winner_mark: string;
  winning_cells: [number, number][] | null;
  stats: Stats;
  reason?: string;
}

const STORAGE_KEY_USERNAME = 'tictactoe_username';
const STORAGE_KEY_USERID = 'tictactoe_userid';

export function loadStoredUsername(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_USERNAME) || '';
  } catch {
    return '';
  }
}

export function loadStoredUserId(): string {
  try {
    const fromSession = sessionStorage.getItem(STORAGE_KEY_USERID);
    if (fromSession) return fromSession;
    return localStorage.getItem(STORAGE_KEY_USERID) || '';
  } catch {
    return '';
  }
}

export function storeUsername(username: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_USERNAME, username);
  } catch { /* ignore */ }
}

export function storeUserId(userId: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_USERID, userId);
  } catch { /* ignore */ }
}

export function createInitialState(): GameState {
  return {
    phase: 'home',
    userId: loadStoredUserId(),
    username: loadStoredUsername(),
    stats: { wins: 0, losses: 0, draws: 0 },
    board: [['', '', ''], ['', '', ''], ['', '', '']],
    yourMark: '',
    opponentUsername: '',
    currentTurn: '',
    matchId: '',
    countdownSecs: null,
    lastResult: null,
    queuePosition: null,
    connectionStatus: 'connected',
    error: null,
    winningCells: null,
    matchTimeout: false,
    opponentDisconnected: false,
  };
}
