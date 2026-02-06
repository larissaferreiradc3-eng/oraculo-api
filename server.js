// server.js
// ORÁCULO API — VERSÃO FINAL (CLOUDFLARE WRANGLER COMPATÍVEL)
// CORS liberado + validação + status limpo

import express from "express";
import cors from "cors";
import serverless from "serverless-http";

import { ensureStorage, loadState, saveState } from "./stateStorage.js";
import { processCollectorEvent } from "./vortex27Engine.js";

/* =========================
   BOOT
========================= */

ensureStorage();

let oraculoState = loadState();

if (!oraculoState || !Array.isArray(oraculoState.mesas)) {
  oraculoState = { updatedAt: Date.now(), mesas: [] };
  saveState(oraculoState);
}

console.log("🔁 Estado carregado do disco:");
console.log(`→ mesas: ${oraculoState.mesas.length}`);

/* =========================
   APP
========================= */

const app = express();

/* =========================
   CORS
========================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors());

app.use(express.json());

/* =========================
   HELPERS
========================= */

function isValidMesaId(mesaId) {
  if (!mesaId) return false;
  if (typeof mesaId !== "string") return false;
  if (mesaId.trim().length < 2) return false;
  return true;
}

function isValidNumero(n) {
  if (n === null || n === undefined) return false;
  const num = Number(n);
  if (Number.isNaN(num)) return false;
  if (num < 0 || num > 36) return false;
  return true;
}

/* =========================
   ROTAS
========================= */

app.post("/oraculo/evento", (req, res) => {
  try {
    const body = req.body || {};
    const { mesaId, mesaNome, ultimoNumero } = body;

    if (!isValidMesaId(mesaId)) {
      return res.status(400).json({
        ok: false,
        error: "mesaId inválido",
        recebido: body,
      });
    }

    if (!isValidNumero(ultimoNumero)) {
      return res.status(400).json({
        ok: false,
        error: "ultimoNumero inválido (precisa ser 0 a 36)",
        recebido: body,
      });
    }

    const evento = {
      mesaId: mesaId.trim(),
      mesaNome: mesaNome ? String(mesaNome).trim() : null,
      ultimoNumero: Number(ultimoNumero),
      timestamp: Date.now(),
    };

    oraculoState = processCollectorEvent(oraculoState, evento);

    oraculoState.updatedAt = Date.now();

    saveState(oraculoState);

    return res.status(200).json({
      ok: true,
      message: "Evento processado com sucesso",
      evento,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Erro interno",
      details: err.message,
    });
  }
});

app.get("/oraculo/status", (req, res) => {
  try {
    if (!oraculoState || !Array.isArray(oraculoState.mesas)) {
      oraculoState = { updatedAt: Date.now(), mesas: [] };
      saveState(oraculoState);
    }

    return res.status(200).json({
      ok: true,
      updatedAt: oraculoState.updatedAt,
      mesas: oraculoState.mesas,
      totalMesas: oraculoState.mesas.length,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Erro ao retornar status",
      details: err.message,
    });
  }
});

app.get("/oraculo/mesas", (req, res) => {
  try {
    const mesas = (oraculoState.mesas || []).map((m) => ({
      mesaId: m.mesaId,
      mesaNome: m.mesaNome,
      status: m.status,
      rodada: m.rodada,
      ultimoNumero: m.ultimoNumero,
      score: m.score,
      alvos: m.alvos,
    }));

    return res.status(200).json({
      ok: true,
      total: mesas.length,
      mesas,
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

app.post("/oraculo/reset", (req, res) => {
  oraculoState = { updatedAt: Date.now(), mesas: [] };
  saveState(oraculoState);

  return res.status(200).json({
    ok: true,
    message: "Reset aplicado com sucesso",
  });
});

app.get("/", (req, res) => {
  res.status(200).send("ORÁCULO API ONLINE (WRANGLER)");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    ok: true,
    service: "oraculo-api",
    updatedAt: oraculoState.updatedAt,
    mesas: oraculoState.mesas.length,
  });
});

/* =========================
   EXPORT PARA WRANGLER
========================= */

export default {
  fetch: serverless(app),
};
