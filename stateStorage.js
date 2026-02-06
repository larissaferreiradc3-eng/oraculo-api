// stateStorage.js
// Persistência simples em disco (Render-safe)

import fs from "fs";
import path from "path";

const DB_FOLDER = path.resolve("./database");
const DB_FILE = path.resolve("./database/oraculoState.json");

export function ensureStorage() {
  if (!fs.existsSync(DB_FOLDER)) {
    fs.mkdirSync(DB_FOLDER);
  }

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ updatedAt: Date.now(), mesas: [] }, null, 2)
    );
  }
}

export function loadState() {
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(raw);

    if (!data || !Array.isArray(data.mesas)) {
      return { updatedAt: Date.now(), mesas: [] };
    }

    return data;
  } catch {
    return { updatedAt: Date.now(), mesas: [] };
  }
}

export function saveState(state) {
  try {
    state.updatedAt = Date.now();
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("❌ Erro ao salvar estado:", err.message);
  }
}
