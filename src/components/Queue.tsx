interface QueueProps {
  position: number | null;
}

export function Queue({ position }: QueueProps) {
  return (
    <div className="queue">
      <h2>Finding opponent...</h2>
      <div className="spinner" />
      {position !== null && (
        <p>Position in queue: {position}</p>
      )}
      <p className="hint">Please wait while we find you a match</p>
    </div>
  );
}
