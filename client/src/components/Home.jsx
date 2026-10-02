import { useState } from "react";

export default function Home({ onJoin, error, connecting }) {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const submit = (e, withCode) => {
    e.preventDefault();
    if (!name.trim()) return;
    onJoin({ name: name.trim(), roomCode: withCode ? roomCode.trim() : undefined });
  };

  return (
    <div className="panel home-panel">
      <h1>type::race</h1>
      <p className="subtitle">Real-time typing races. No signup, just a name.</p>

      <form className="field-group">
        <label htmlFor="name">Your name</label>
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Prakhar"
          maxLength={20}
          autoFocus
        />
      </form>

      <div className="home-actions">
        <button
          className="btn btn-primary"
          disabled={!name.trim() || connecting}
          onClick={(e) => submit(e, false)}
        >
          Create Room
        </button>

        <div className="join-row">
          <input
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="ROOM CODE"
            maxLength={4}
          />
          <button
            className="btn"
            disabled={!name.trim() || roomCode.trim().length !== 4 || connecting}
            onClick={(e) => submit(e, true)}
          >
            Join
          </button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
