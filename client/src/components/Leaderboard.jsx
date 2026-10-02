import { useEffect, useState } from "react";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function Leaderboard({ onBack }) {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${SERVER_URL}/api/leaderboard`)
      .then((res) => res.json())
      .then(setEntries)
      .catch(() => setError("Couldn't load the leaderboard right now."));
  }, []);

  return (
    <div className="panel">
      <h2>Leaderboard</h2>
      {error && <p className="error-text">{error}</p>}
      {!error && !entries && <p className="waiting-text">Loading…</p>}
      {entries && entries.length === 0 && <p className="waiting-text">No races finished yet — be the first.</p>}
      {entries && entries.length > 0 && (
        <ol className="results-list">
          {entries.map((e, i) => (
            <li key={i}>
              <span className="place">#{i + 1}</span>
              <span className="result-name">{e.name}</span>
              <span className="result-wpm">{e.wpm} wpm</span>
              <span className="result-accuracy">{e.accuracy}%</span>
            </li>
          ))}
        </ol>
      )}
      <button className="btn" onClick={onBack}>Back</button>
    </div>
  );
}
