import { useEffect, useState, useCallback } from "react";
import "./App.css";
import { socket } from "./socket";
import Home from "./components/Home";
import Lobby from "./components/Lobby";
import Countdown from "./components/Countdown";
import Race from "./components/Race";
import Results from "./components/Results";
import Leaderboard from "./components/Leaderboard";

// view: "home" | "lobby" | "countdown" | "racing" | "results" | "leaderboard"
export default function App() {
  const [view, setView] = useState("home");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [countdownMs, setCountdownMs] = useState(3000);
  const [raceText, setRaceText] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [results, setResults] = useState([]);
  const [previousView, setPreviousView] = useState("lobby");

  useEffect(() => {
    socket.on("players_update", setPlayers);
    socket.on("countdown_start", ({ ms }) => {
      setCountdownMs(ms);
      setView("countdown");
    });
    socket.on("race_start", ({ text, startTime }) => {
      setRaceText(text);
      setStartTime(startTime);
      setView("racing");
    });
    socket.on("race_over", ({ results }) => {
      setResults(results);
      setView("results");
    });
    socket.on("connect_error", () => {
      setError("Can't reach the race server. Is it running?");
      setConnecting(false);
    });

    return () => {
      socket.off("players_update");
      socket.off("countdown_start");
      socket.off("race_start");
      socket.off("race_over");
      socket.off("connect_error");
    };
  }, []);

  const handleJoin = useCallback(({ name, roomCode: codeToJoin }) => {
    setError("");
    setConnecting(true);

    const doJoin = () => {
      socket.emit("join_room", { name, roomCode: codeToJoin }, (res) => {
        setConnecting(false);
        if (res?.error) {
          setError(res.error);
          return;
        }
        setRoomCode(res.roomCode);
        setIsHost(res.isHost);
        setPlayers(res.players);
        setView("lobby");
      });
    };

    if (socket.connected) {
      doJoin();
    } else {
      socket.connect();
      socket.once("connect", doJoin);
    }
  }, []);

  const handleStart = () => socket.emit("start_race");

  const handleLeave = () => {
    socket.emit("leave_room");
    setView("home");
    setRoomCode("");
    setPlayers([]);
  };

  const handlePlayAgain = () => setView("lobby");

  const handleProgress = (payload) => socket.emit("typing_progress", payload);
  const handleFinish = (payload) => socket.emit("finished", payload);

  const openLeaderboard = () => {
    setPreviousView(view);
    setView("leaderboard");
  };

  return (
    <div className="app">
      <header className="app-header">
        <span className="logo">type::race</span>
        {view !== "home" && (
          <button className="btn-text" onClick={openLeaderboard}>leaderboard</button>
        )}
      </header>

      <main className="app-main">
        {view === "home" && (
          <Home onJoin={handleJoin} error={error} connecting={connecting} />
        )}

        {view === "lobby" && (
          <Lobby
            roomCode={roomCode}
            players={players}
            isHost={isHost}
            onStart={handleStart}
            onLeave={handleLeave}
          />
        )}

        {view === "countdown" && <Countdown ms={countdownMs} />}

        {view === "racing" && (
          <Race
            text={raceText}
            startTime={startTime}
            players={players}
            selfId={socket.id}
            onProgress={handleProgress}
            onFinish={handleFinish}
          />
        )}

        {view === "results" && (
          <Results
            results={results}
            selfId={socket.id}
            onPlayAgain={handlePlayAgain}
            onViewLeaderboard={openLeaderboard}
          />
        )}

        {view === "leaderboard" && <Leaderboard onBack={() => setView(previousView)} />}
      </main>
    </div>
  );
}
