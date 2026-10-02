import { useEffect, useState } from "react";

export default function Countdown({ ms }) {
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(ms / 1000));

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const remaining = Math.max(0, ms - (Date.now() - start));
      setSecondsLeft(Math.ceil(remaining / 1000));
    }, 100);
    return () => clearInterval(timer);
  }, [ms]);

  return (
    <div className="panel countdown-panel">
      <span className="countdown-number" key={secondsLeft}>
        {secondsLeft > 0 ? secondsLeft : "GO"}
      </span>
      <p className="subtitle">Get ready to type…</p>
    </div>
  );
}
