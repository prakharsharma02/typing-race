export default function Results({ results, selfId, onPlayAgain, onViewLeaderboard }) {
  return (
    <div className="panel">
      <h2>Results</h2>
      <ol className="results-list">
        {results.map((p) => (
          <li key={p.id} className={p.id === selfId ? "self" : ""}>
            <span className="place">{p.place ? `#${p.place}` : "DNF"}</span>
            <span className="result-name">{p.name}</span>
            <span className="result-wpm">{p.wpm} wpm</span>
            <span className="result-accuracy">{p.accuracy}%</span>
          </li>
        ))}
      </ol>

      <div className="home-actions">
        <button className="btn btn-primary" onClick={onPlayAgain}>Play Again</button>
        <button className="btn" onClick={onViewLeaderboard}>Leaderboard</button>
      </div>
    </div>
  );
}
