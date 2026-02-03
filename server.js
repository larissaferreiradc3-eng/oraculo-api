// ORÁCULO API — VERSÃO COM PERSISTÊNCIA (RENDER FREE SAFE)
// Mantém estado mesmo quando o Render dorme/reinicia

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

/* =========================
   CONFIG
========================= */

const PORT = process.env.PORT || 3000;

// arquivo de persistência (fica no disco do Render)
const DATA_DIR = path.resolve("./data");
const STATE_FILE = path.join(DATA_DIR, "oraculo-state.json");

/* =========================
   HELPERS DE PERSISTÊNCIA
========================= */

function ensureStorage() {
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

function loadState() {
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

function saveState(state) {
  try {
    fs.writeFileSync(
      STATE_FILE,
      JSON.stringify(state, null, 2)
    );
  } catch (err) {
    console.error("❌ ERRO AO SALVAR ESTADO:", err.message);
  }
}

/* =========================
   BOOT
========================= */

ensureStorage();

let oraculoState = loadState();

console.log("🔁 Estado carregado do disco:");
console.log(
  `→ mesas: ${oraculoState.mesas.length}`
);

/* =========================
   APP
========================= */

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   ROTAS
========================= */

// RECEBE EVENTOS DO COLETOR
app.post("/oraculo/evento", (req, res) => {
  const body = req.body || {};

  const {
    mesaId,
    mesaNome,
    status,
    rodada,
    alvos,
    ultimoNumero
  } = body;

  if (!mesaId) {
    console.error("❌ Evento rejeitado: mesaId ausente");
    return res
      .status(400)
      .json({ error: "mesaId é obrigatório" });
  }

  const index = oraculoState.mesas.findIndex(
    m => m.mesaId === mesaId
  );

  const mesaAtualizada = {
    mesaId,
    mesaNome: mesaNome ?? null,
    status: status ?? "DESCONHECIDO",
    rodada: rodada ?? null,
    alvos: Array.isArray(alvos) ? alvos : [],
    ultimoNumero: ultimoNumero ?? null,
    timestamp: Date.now()
  };

  if (index >= 0) {
    oraculoState.mesas[index] = mesaAtualizada;
  } else {
    oraculoState.mesas.push(mesaAtualizada);
  }

  oraculoState.updatedAt = Date.now();

  saveState(oraculoState);

  console.log(
    "📥 EVENTO SALVO:",
    mesaAtualizada.mesaId,
    mesaAtualizada.status
  );

  return res.status(200).json({ ok: true });
});

// STATUS GLOBAL
app.get("/oraculo/status", (req, res) => {
  return res.status(200).json(oraculoState);
});

// HEALTHCHECK (útil pro Render / keep-alive)
app.get("/", (req, res) => {
  res.send("ORÁCULO API ONLINE");
});

/* =========================
   START
========================= */

app.listen(PORT, () => {
  console.log(
    `🔮 ORÁCULO API rodando na porta ${PORT}`
  );
});
