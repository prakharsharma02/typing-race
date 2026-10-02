export default function Lobby({ roomCode, players, isHost, onStart, onLeave }) {
  const copyCode = () => {
    navigator.clipboard?.writeText(roomCode).catch(() => {});
  };

  return (
    <div className="panel">
      <div className="lobby-header">
        <div>
          <span className="eyebrow">ROOM CODE</span>
          <button className="room-code" onClick={copyCode} title="Click to copy">
            {roomCode}
          </button>
        </div>
        <button className="btn-text" onClick={onLeave}>leave</button>
      </div>

      <ul className="player-list">
        {players.map((p) => (
          <li key={p.id}>
            <span>{p.name}</span>
            {p.isHost && <span className="tag">HOST</span>}
          </li>
        ))}
      </ul>

      {isHost ? (
        <button className="btn btn-primary" onClick={onStart}>
          Start Race ({players.length} player{players.length === 1 ? "" : "s"})
        </button>
      ) : (
        <p className="waiting-text">Waiting for the host to start the race…</p>
      )}
    </div>
  );
}
