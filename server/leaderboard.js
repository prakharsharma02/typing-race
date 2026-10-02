import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "leaderboard.json");
const MAX_ENTRIES = 50;

// A plain JSON file is intentionally simple for a resume project: no native
// bindings, no connection strings, works anywhere Node runs. The obvious
// next step (left as a note, not built) is swapping this module for a real
// database — Postgres via something like Supabase, or SQLite via
// better-sqlite3 — without touching any of the calling code in index.js,
// since both just need load()/save() semantics.

function load() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function save(entries) {
  fs.writeFileSync(DB_PATH, JSON.stringify(entries, null, 2));
}

export function getTop(limit = 20) {
  return load()
    .sort((a, b) => b.wpm - a.wpm)
    .slice(0, limit);
}

export function addEntry({ name, wpm, accuracy }) {
  const entries = load();
  entries.push({ name, wpm, accuracy, date: new Date().toISOString() });
  entries.sort((a, b) => b.wpm - a.wpm);
  save(entries.slice(0, MAX_ENTRIES));
}
