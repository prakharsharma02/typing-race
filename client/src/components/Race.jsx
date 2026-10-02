import { useEffect, useMemo, useRef, useState } from "react";

export default function Race({ text, startTime, players, selfId, onProgress, onFinish }) {
  const [typed, setTyped] = useState("");
  const [finished, setFinished] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const { correctChars, selfWpm, selfAccuracy } = useMemo(() => {
    let correct = 0;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] === text[i]) correct++;
    }
    const elapsedMin = Math.max((Date.now() - startTime) / 60_000, 1 / 60_000);
    const wpm = Math.round((correct / 5) / elapsedMin);
    const accuracy = typed.length > 0 ? Math.round((correct / typed.length) * 100) : 100;
    return { correctChars: correct, selfWpm: Math.max(0, wpm), selfAccuracy: accuracy };
  }, [typed, text, startTime]);

  const handleChange = (e) => {
    if (finished) return;
    const value = e.target.value.slice(0, text.length);
    setTyped(value);
    onProgress({ correctChars: countCorrect(value, text), totalTyped: value.length });

    if (value.length >= text.length) {
      setFinished(true);
      onFinish({ correctChars: countCorrect(value, text), totalTyped: value.length });
    }
  };

  const progressPct = Math.round((typed.length / text.length) * 100);
  const opponents = players.filter((p) => p.id !== selfId);

  return (
    <div className="panel race-panel">
      <div className="self-stats">
        <span><strong>{selfWpm}</strong> wpm</span>
        <span><strong>{selfAccuracy}</strong>% accuracy</span>
        <span><strong>{progressPct}</strong>% done</span>
      </div>

      <div className="race-text" onClick={() => inputRef.current?.focus()}>
        {text.split("").map((char, i) => {
          let className = "pending";
          if (i < typed.length) {
            className = typed[i] === char ? "correct" : "incorrect";
          } else if (i === typed.length) {
            className = "current";
          }
          return (
            <span key={i} className={className}>
              {char}
            </span>
          );
        })}
      </div>

      <input
        ref={inputRef}
        className="race-input"
        value={typed}
        onChange={handleChange}
        onPaste={(e) => e.preventDefault()}
        disabled={finished}
        autoFocus
        spellCheck={false}
        autoComplete="off"
        placeholder={finished ? "Waiting for other racers…" : "Start typing here…"}
      />

      <div className="opponents">
        {opponents.map((p) => (
          <div key={p.id} className="opponent-row">
            <span className="opponent-name">{p.name}</span>
            <div className="opponent-bar">
              <div className="opponent-bar-fill" style={{ width: `${p.progress}%` }} />
            </div>
            <span className="opponent-wpm">{p.wpm} wpm</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function countCorrect(typed, text) {
  let correct = 0;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] === text[i]) correct++;
  }
  return correct;
}
