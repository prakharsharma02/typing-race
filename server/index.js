import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { randomText } from "./texts.js";
import { getTop, addEntry } from "./leaderboard.js";

const PORT = process.env.PORT || 4000;
const COUNTDOWN_MS = 3000;
const RACE_TIMEOUT_MS = 120_000; // auto-end a race that's dragged on too long
const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I ambiguity

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/leaderboard", (req, res) => {
  res.json(getTop(20));
});

app.get("/health", (req, res) => res.send("ok"));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

/** @type {Map<string, Room>} */
const rooms = new Map();

function makeRoomCode() {
  let code;
  do {
    code = Array.from({ length: 4 }, () =>
      ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)]
    ).join("");
  } while (rooms.has(code));
  return code;
}

function publicPlayers(room) {
  return [...room.players.values()].map((p) => ({
    id: p.id,
    name: p.name,
    progress: p.progress,
    wpm: p.wpm,
    accuracy: p.accuracy,
    finished: p.finished,
    place: p.place,
    isHost: p.id === room.hostId,
  }));
}

function broadcastPlayers(room) {
  io.to(room.code).emit("players_update", publicPlayers(room));
}

// The theoretical fastest a human could finish this text — used to flag
// (not silently trust) suspiciously fast submissions rather than letting
// console-edited client state land straight on the leaderboard.
function minPossibleMs(textLength) {
  const MAX_PLAUSIBLE_WPM = 260; // world-class speedrunner territory
  const words = textLength / 5;
  return (words / MAX_PLAUSIBLE_WPM) * 60_000;
}

function computeStats(room, player) {
  const elapsedMs = Math.max(Date.now() - room.startTime, 1);
  const words = player.correctChars / 5;
  const minutes = elapsedMs / 60_000;
  const wpm = Math.round(words / minutes);
  const accuracy = player.totalTyped > 0
    ? Math.round((player.correctChars / player.totalTyped) * 100)
    : 100;
  return { wpm: Math.max(0, wpm), accuracy: Math.min(100, Math.max(0, accuracy)), elapsedMs };
}

function endRaceIfDone(room) {
  const players = [...room.players.values()];
  const allDone = players.length > 0 && players.every((p) => p.finished);
  if (allDone) finishRace(room);
}

function finishRace(room) {
  if (room.status !== "racing") return;
  room.status = "finished";
  clearTimeout(room.timeoutHandle);

  const players = [...room.players.values()];
  const ranked = players
    .filter((p) => p.finished)
    .sort((a, b) => a.finishTime - b.finishTime);
  const unfinished = players.filter((p) => !p.finished);

  ranked.forEach((p, i) => (p.place = i + 1));
  unfinished.forEach((p) => (p.place = null));

  ranked.forEach((p) => {
    if (!p.flagged) {
      addEntry({ name: p.name, wpm: p.wpm, accuracy: p.accuracy });
    }
  });

  io.to(room.code).emit("race_over", {
    results: publicPlayers(room).sort((a, b) => (a.place ?? 999) - (b.place ?? 999)),
  });
}

io.on("connection", (socket) => {
  socket.on("join_room", ({ roomCode, name }, callback) => {
    const trimmedName = (name || "Player").trim().slice(0, 20) || "Player";
    let room;

    if (roomCode) {
      room = rooms.get(roomCode.toUpperCase());
      if (!room) return callback?.({ error: "Room not found." });
      if (room.status !== "waiting") return callback?.({ error: "Race already in progress." });
    } else {
      const code = makeRoomCode();
      room = {
        code,
        hostId: socket.id,
        players: new Map(),
        status: "waiting",
        text: "",
        startTime: null,
        timeoutHandle: null,
      };
      rooms.set(code, room);
    }

    room.players.set(socket.id, {
      id: socket.id,
      name: trimmedName,
      progress: 0,
      wpm: 0,
      accuracy: 100,
      finished: false,
      finishTime: null,
      place: null,
      correctChars: 0,
      totalTyped: 0,
      flagged: false,
    });

    socket.join(room.code);
    socket.data.roomCode = room.code;

    callback?.({
      roomCode: room.code,
      isHost: room.hostId === socket.id,
      players: publicPlayers(room),
    });

    socket.to(room.code).emit("players_update", publicPlayers(room));
  });

  socket.on("start_race", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.status !== "waiting") return;
    if (room.players.size === 0) return;

    room.status = "countdown";
    room.text = randomText();
    io.to(room.code).emit("countdown_start", { ms: COUNTDOWN_MS });

    setTimeout(() => {
      if (!rooms.has(room.code)) return;
      room.status = "racing";
      room.startTime = Date.now();
      for (const p of room.players.values()) {
        p.progress = 0;
        p.wpm = 0;
        p.accuracy = 100;
        p.finished = false;
        p.finishTime = null;
        p.place = null;
        p.correctChars = 0;
        p.totalTyped = 0;
        p.flagged = false;
      }
      io.to(room.code).emit("race_start", { text: room.text, startTime: room.startTime });

      room.timeoutHandle = setTimeout(() => finishRace(room), RACE_TIMEOUT_MS);
    }, COUNTDOWN_MS);
  });

  socket.on("typing_progress", ({ correctChars, totalTyped }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "racing") return;
    const player = room.players.get(socket.id);
    if (!player || player.finished) return;

    player.correctChars = Math.max(0, Math.min(correctChars, room.text.length));
    player.totalTyped = Math.max(player.correctChars, totalTyped || 0);
    player.progress = Math.round((player.correctChars / room.text.length) * 100);

    const { wpm, accuracy } = computeStats(room, player);
    player.wpm = wpm;
    player.accuracy = accuracy;

    broadcastPlayers(room);
  });

  socket.on("finished", ({ correctChars, totalTyped }) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "racing") return;
    const player = room.players.get(socket.id);
    if (!player || player.finished) return;

    player.correctChars = Math.min(correctChars, room.text.length);
    player.totalTyped = Math.max(player.correctChars, totalTyped || 0);
    player.progress = Math.round((player.correctChars / room.text.length) * 100);

    const { wpm, accuracy, elapsedMs } = computeStats(room, player);
    player.wpm = wpm;
    player.accuracy = accuracy;
    player.finished = player.progress >= 100;
    player.finishTime = Date.now();
    player.flagged = elapsedMs < minPossibleMs(room.text.length);

    broadcastPlayers(room);
    endRaceIfDone(room);
  });

  socket.on("leave_room", () => handleLeave(socket));
  socket.on("disconnect", () => handleLeave(socket));

  function handleLeave(socket) {
    const code = socket.data.roomCode;
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;

    room.players.delete(socket.id);
    socket.leave(code);

    if (room.players.size === 0) {
      clearTimeout(room.timeoutHandle);
      rooms.delete(code);
      return;
    }

    if (room.hostId === socket.id) {
      room.hostId = room.players.keys().next().value;
    }

    broadcastPlayers(room);
    if (room.status === "racing") endRaceIfDone(room);
  }
});

httpServer.listen(PORT, () => {
  console.log(`Typing race server listening on :${PORT}`);
});
