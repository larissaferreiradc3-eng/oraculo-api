// api/receiveEvent.js
// ORÁCULO API — RECEBE EVENTOS DO COLETOR (PASSIVO)

import fs from "fs";
import path from "path";

// memória simples por mesa
const mesas = {};

// caminho do histórico
const HISTORY_PATH = path.resolve(
  "storage",
  "history.json"
);

// garante pasta storage
if (!fs.existsSync("storage")) {
  fs.mkdirSync("storage");
}

function salvarEvento(evento) {
  let historico = [];

  if (fs.existsSync(HISTORY_PATH)) {
    const raw = fs.readFileSync(HISTORY_PATH, "utf-8");
    historico = JSON.parse(raw);
  }

  historico.push(evento);

  fs.writeFileSync(
    HISTORY_PATH,
    JSON.stringify(historico, null, 2)
  );
}

export function receiveEvent(req, res) {
  const {
    mesaId,
    mesaNome,
    status,
    rodada,
    alvos,
    ultimoNumero
  } = req.body || {};

  if (!mesaId || ultimoNumero === undefined) {
    console.error("❌ Payload inválido:", req.body);
    return res.status(400).json({
      error: "mesaId e ultimoNumero são obrigatórios"
    });
  }

  const timestamp = Date.now();

  const evento = {
    mesaId,
    mesaNome: mesaNome ?? null,
    status: status ?? "ATIVO",
    rodada: rodada ?? null,
    alvos: Array.isArray(alvos) ? alvos : [],
    ultimoNumero,
    timestamp
  };

  // memória em tempo real
  mesas[mesaId] = evento;

  // histórico em disco
  salvarEvento(evento);

  // log visível
  console.log(
    "📥 EVENTO API |",
    mesaId,
    "|",
    status,
    "| num:",
    ultimoNumero,
    "|",
    new Date(timestamp).toLocaleTimeString()
  );

  return res.status(200).json({ ok: true });
}

// exporta estado para GET /status
export function getStatus(req, res) {
  res.json({
    updatedAt: Date.now(),
    mesas: Object.values(mesas)
  });
}
