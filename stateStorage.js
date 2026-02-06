import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("./data");
const STATE_FILE = path.join(DATA_DIR, "oraculo-state.json");

// TTL de mesa sem atualizar
const TTL_MINUTES = 15;
const TTL_MS = TTL_MINUTES * 60 * 1000;

export function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(STATE_FILE)) {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify(
        {
          updatedAt: Date.now(),
          mesas: []
        },
        null,
        2
      )
    );
  }
}

export function loadState() {
  try {
    const raw = fs.readFileSync(STATE_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {
      updatedAt: Date.now(),
      mesas: []
    };
  }
}

export function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error("❌ ERRO AO SALVAR ESTADO:", err.message);
  }
}

/* =========================
   CLEANUP (LIMPA MESAS VELHAS)
========================= */

export function cleanupOldMesas(state) {
  const now = Date.now();

  const mesasFiltradas = state.mesas.filter((m) => {
    if (!m.timestamp) return false;
    return now - m.timestamp < TTL_MS;
  });

  return {
    updatedAt: Date.now(),
    mesas: mesasFiltradas
  };
}
