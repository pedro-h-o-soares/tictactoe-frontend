import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Playing } from '../Playing';
import { PostMatch } from '../PostMatch';
import { MatchEndPayload } from '../../types';

describe('Property: Board rendering consistency', () => {
  it('renders any valid board state without error', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.array(
            fc.constantFrom('' as const, 'X' as const, 'O' as const),
            { minLength: 3, maxLength: 3 }
          ),
          { minLength: 3, maxLength: 3 }
        ),
        (board) => {
          cleanup();
          const props = {
            board: board as any,
            yourMark: 'X' as any,
            opponentUsername: 'bob',
            currentTurn: 'X' as any,
            userId: 'abc',
            username: 'alice',
            stats: { wins: 0, losses: 0, draws: 0 },
            countdownSecs: null,
            winningCells: null,
            connectionStatus: 'connected',
            opponentDisconnected: false,
            onCellClick: () => {},
          };

          const { container } = render(<Playing {...props} />);
          const cells = container.querySelectorAll('[data-testid^="cell-"]');
          expect(cells.length).toBe(9);

          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const cell = container.querySelector(`[data-testid="cell-${r}-${c}"]`);
              expect(cell).not.toBeNull();
              expect(cell?.textContent).toBe(board[r][c]);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property: Countdown display', () => {
  it('renders any non-negative integer countdown value', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 300 }),
        (seconds) => {
          cleanup();
          const props = {
            board: [['', '', ''], ['', '', ''], ['', '', '']] as any,
            yourMark: 'X' as any,
            opponentUsername: 'bob',
            currentTurn: 'X' as any,
            userId: 'abc',
            username: 'alice',
            stats: { wins: 0, losses: 0, draws: 0 },
            countdownSecs: seconds,
            winningCells: null,
            connectionStatus: 'connected',
            opponentDisconnected: false,
            onCellClick: () => {},
          };

          const { container } = render(<Playing {...props} />);
          const countdownEl = container.querySelector('[data-testid="countdown"]');
          expect(countdownEl).not.toBeNull();
          expect(countdownEl?.textContent).toContain(String(seconds));
        }
      ),
      { numRuns: 100 }
    );
  });
});
