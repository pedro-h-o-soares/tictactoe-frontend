import { useState, useEffect } from 'react';

interface HomeProps {
  userId: string;
  currentUsername: string;
  onSetUsername: (username: string) => void;
  error: string | null;
  matchTimeout: boolean;
}

export function Home({ userId, currentUsername, onSetUsername, error, matchTimeout }: HomeProps) {
  const [username, setUsername] = useState(currentUsername);

  useEffect(() => {
    setUsername(currentUsername);
  }, [currentUsername]);
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    const trimmed = username.trim();
    if (!trimmed) {
      setLocalError('Username is required');
      return;
    }
    if (trimmed.length > 32) {
      setLocalError('Username must be 32 characters or less');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      setLocalError('Username can only contain letters, digits, underscores, and hyphens');
      return;
    }

    onSetUsername(trimmed);
  };

  return (
    <div className="home">
      <h1>Tic-Tac-Toe</h1>
      {matchTimeout && (
        <div className="notification">Matchmaking timed out. Please try again.</div>
      )}
      {userId && (
        <div className="user-id">Your ID: <code>{userId}</code></div>
      )}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          maxLength={32}
          autoFocus
        />
        <button type="submit">Find Match</button>
      </form>
      {(localError || error) && (
        <div className="error">{(localError || error) as string}</div>
      )}
    </div>
  );
}
