import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Home } from '../Home';
import { Queue } from '../Queue';
import { Playing } from '../Playing';
import { PostMatch } from '../PostMatch';
import type { Mark, MatchEndPayload } from '../../types';

describe('Home', () => {
  it('renders username input and submit button', () => {
    render(
      <Home
        userId=""
        currentUsername=""
        onSetUsername={vi.fn()}
        error={null}
        matchTimeout={false}
      />
    );
    expect(screen.getByPlaceholderText('Enter username')).toBeDefined();
    expect(screen.getByText('Find Match')).toBeDefined();
  });

  it('shows error for empty username', () => {
    const onSetUsername = vi.fn();
    render(
      <Home
        userId=""
        currentUsername=""
        onSetUsername={onSetUsername}
        error={null}
        matchTimeout={false}
      />
    );
    fireEvent.click(screen.getByText('Find Match'));
    expect(screen.getByText('Username is required')).toBeDefined();
    expect(onSetUsername).not.toHaveBeenCalled();
  });

  it('shows user ID when provided', () => {
    render(
      <Home
        userId="550e8400-e29b-41d4-a716-446655440000"
        currentUsername=""
        onSetUsername={vi.fn()}
        error={null}
        matchTimeout={false}
      />
    );
    expect(screen.getByText('550e8400-e29b-41d4-a716-446655440000')).toBeDefined();
  });

  it('shows match timeout notification', () => {
    render(
      <Home
        userId=""
        currentUsername=""
        onSetUsername={vi.fn()}
        error={null}
        matchTimeout={true}
      />
    );
    expect(screen.getByText('Matchmaking timed out. Please try again.')).toBeDefined();
  });
});

describe('Queue', () => {
  it('renders with position', () => {
    render(<Queue position={3} />);
    expect(screen.getByText('Position in queue: 3')).toBeDefined();
  });

  it('renders without position', () => {
    render(<Queue position={null} />);
    expect(screen.getByText('Finding opponent...')).toBeDefined();
  });
});

describe('Playing', () => {
  const baseProps = {
    board: [['', '', ''], ['', '', ''], ['', '', '']] as any,
    yourMark: 'X' as any,
    opponentUsername: 'bob',
    currentTurn: 'X' as any,
    userId: 'abc123',
    username: 'alice',
    stats: { wins: 1, losses: 0, draws: 0 },
    countdownSecs: 15,
    winningCells: null,
    connectionStatus: 'connected',
    opponentDisconnected: false,
    onCellClick: vi.fn(),
  };

  it('renders the board with 9 cells', () => {
    render(<Playing {...baseProps} />);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        expect(screen.getByTestId(`cell-${r}-${c}`)).toBeDefined();
      }
    }
  });

  it('shows correct turn indicator', () => {
    render(<Playing {...baseProps} />);
    expect(screen.getByText("Your turn")).toBeDefined();
  });

  it('shows countdown', () => {
    render(<Playing {...baseProps} />);
    expect(screen.getByText('Time remaining: 15s')).toBeDefined();
  });

  it('shows reconnecting overlay', () => {
    render(<Playing {...baseProps} connectionStatus="reconnecting" />);
    expect(screen.getByText('Reconnecting...')).toBeDefined();
  });

  it('shows connection lost overlay on failure', () => {
    render(<Playing {...baseProps} connectionStatus="failed" />);
    expect(screen.getByText('Connection Lost')).toBeDefined();
  });

  it('disables cells when not your turn', () => {
    const props = { ...baseProps, currentTurn: 'O' as any };
    render(<Playing {...props} />);
    expect(screen.getByTestId('cell-0-0')).toHaveProperty('disabled', true);
  });

  it('disables cells when reconnecting', () => {
    const props = { ...baseProps, connectionStatus: 'reconnecting' };
    render(<Playing {...props} />);
    expect(screen.getByTestId('cell-0-0')).toHaveProperty('disabled', true);
  });

  it('shows filled cells with mark', () => {
    const board: any = [
      ['X', 'O', ''],
      ['', 'X', ''],
      ['', '', 'O']
    ];
    render(<Playing {...baseProps} board={board} />);
    expect(screen.getByTestId('cell-0-0').textContent).toBe('X');
    expect(screen.getByTestId('cell-0-1').textContent).toBe('O');
    expect(screen.getByTestId('cell-2-2').textContent).toBe('O');
  });

  it('highlights winning cells', () => {
    const board: any = [
      ['X', 'X', 'X'],
      ['O', 'O', ''],
      ['', '', '']
    ];

    render(<Playing {...baseProps} board={board} winningCells={[[0, 0], [0, 1], [0, 2]] as any} />);
    const cell0 = screen.getByTestId('cell-0-0');
    expect(cell0.className).toContain('winning');
  });

  it('shows session bar with stats', () => {
    render(<Playing {...baseProps} />);
    expect(screen.getByText(/W: 1/)).toBeDefined();
    expect(screen.getByText(/abc123/)).toBeDefined();
  });
});

describe('PostMatch', () => {
  const result: MatchEndPayload = {
    type: 'match_end',
    result: 'win',
    winner_mark: 'X',
    winning_cells: [[0, 0], [1, 1], [2, 2]],
    stats: { wins: 2, losses: 0, draws: 1 },
  };
  const board: Mark[][] = [['X', 'O', 'X'], ['X', 'O', ''], ['O', '', '']];

  it('renders win result and stats', () => {
    render(
      <PostMatch
        result={result}
        yourMark="X"
        board={board}
        winningCells={result.winning_cells as [number, number][] | null}
        stats={{ wins: 2, losses: 0, draws: 1 }}
        onRematch={vi.fn()}
        onNewOpponent={vi.fn()}
        onReturnHome={vi.fn()}
        countdownSecs={30}
      />
    );
    expect(screen.getByText('You won!')).toBeDefined();
    expect(screen.getByText('Wins: 2')).toBeDefined();
    expect(screen.getByText('Rematch')).toBeDefined();
    expect(screen.getByText('Find New Opponent')).toBeDefined();
  });

  it('renders loss result', () => {
    render(
      <PostMatch
        result={result}
        yourMark="O"
        board={board}
        winningCells={result.winning_cells as [number, number][] | null}
        stats={{ wins: 2, losses: 0, draws: 1 }}
        onRematch={vi.fn()}
        onNewOpponent={vi.fn()}
        onReturnHome={vi.fn()}
        countdownSecs={30}
      />
    );
    expect(screen.getByText('You lose!')).toBeDefined();
  });

  it('shows "Waiting..." after rematch clicked', () => {
    render(
      <PostMatch
        result={result}
        yourMark="X"
        board={board}
        winningCells={result.winning_cells as [number, number][] | null}
        stats={{ wins: 2, losses: 0, draws: 1 }}
        onRematch={vi.fn()}
        onNewOpponent={vi.fn()}
        onReturnHome={vi.fn()}
        countdownSecs={30}
      />
    );
    fireEvent.click(screen.getByText('Rematch'));
    expect(screen.getByText('Waiting...')).toBeDefined();
  });

  it('shows countdown', () => {
    render(
      <PostMatch
        result={result}
        yourMark="X"
        board={board}
        winningCells={result.winning_cells as [number, number][] | null}
        stats={{ wins: 2, losses: 0, draws: 1 }}
        onRematch={vi.fn()}
        onNewOpponent={vi.fn()}
        onReturnHome={vi.fn()}
        countdownSecs={30}
      />
    );
    expect(screen.getByText('Rematch deadline: 30s')).toBeDefined();
  });

  it('calls onNewOpponent when Find New Opponent clicked', () => {
    const onNewOpponent = vi.fn();
    render(
      <PostMatch
        result={result}
        yourMark="X"
        board={board}
        winningCells={result.winning_cells as [number, number][] | null}
        stats={{ wins: 2, losses: 0, draws: 1 }}
        onRematch={vi.fn()}
        onNewOpponent={onNewOpponent}
        onReturnHome={vi.fn()}
        countdownSecs={null}
      />
    );
    fireEvent.click(screen.getByText('Find New Opponent'));
    expect(onNewOpponent).toHaveBeenCalled();
  });
});
