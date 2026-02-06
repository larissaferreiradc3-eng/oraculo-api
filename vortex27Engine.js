// server.js
// ORÁCULO API — VERSÃO FINAL (PERSISTENTE + ENGINE VORTEX 27)
// Compatível com Render (Express + app.listen)
// Mantém estado no disco e aplica lógica automática do VORTEX 27 por mesa

import express from "express";
import cors from "cors";

import { ensureStorage, loadState, saveState } from "./stateStorage.js";
import { processCollectorEvent } from "./vortex27Engine.js";

/* =========================
   CONFIG
========================= */

const PORT = process.env.PORT || 10000;

/* =========================
   BOOT SEGURO
========================= */

let oraculoState = { updatedAt: Date.now(), mesas: [] };

try {
  ensureStorage();

  const stateFromDisk = loadState();

  if (stateFromDisk && Array.isArray(stateFromDisk.mesas)) {
    oraculoState = stateFromDisk;
  } else {
    saveState(oraculoState);
  }

  console.log("🔁 Estado carregado do disco:");
  console.log(`→ mesas: ${oraculoState.mesas.length}`);
} catch (err) {
  console.error("❌ Erro ao carregar estado do disco. Iniciando vazio:", err.message);
  oraculoState = { updatedAt: Date.now(), mesas: [] };

  try {
    saveState(oraculoState);
  } catch (e) {
    console.error("⚠️ Falha ao salvar estado inicial:", e.message);
  }
}

/* =========================
   APP
========================= */

const app = express();

/* =========================
   CORS (LIBERA PARA OUTROS SITES)
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
   PROTEÇÃO EXTRA (LOGA ERROS GERAIS)
========================= */

process.on("uncaughtException", (err) => {
  console.error("🔥 uncaughtException:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 unhandledRejection:", err);
});

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

// HEALTHCHECK
app.get("/health", (req, res) => {
  return res.status(200).json({
    ok: true,
    service: "oraculo-api",
    updatedAt: oraculoState.updatedAt,
    totalMesas: oraculoState.mesas?.length ?? 0,
  });
});

// HOME
app.get("/", (req, res) => {
  res.status(200).send("ORÁCULO API ONLINE");
});

// RECEBE EVENTOS DO COLETOR
app.post("/oraculo/evento", (req, res) => {
  try {
    const body = req.body || {};
    const { mesaId, mesaNome, ultimoNumero } = body;

    if (!isValidMesaId(mesaId)) {
      console.error("❌ Evento rejeitado: mesaId inválido:", body);
      return res.status(400).json({
        ok: false,
        error: "mesaId inválido",
        recebido: body,
      });
    }

    if (!isValidNumero(ultimoNumero)) {
      console.error("❌ Evento rejeitado: ultimoNumero inválido:", body);
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

    console.log("📥 EVENTO RECEBIDO:", evento);

    // aplica engine
    oraculoState = processCollectorEvent(oraculoState, evento);

    // atualiza timestamp global
    oraculoState.updatedAt = Date.now();

    // salva persistente
    saveState(oraculoState);

    return res.status(200).json({
      ok: true,
      message: "Evento processado com sucesso",
      evento,
    });
  } catch (err) {
    console.error("❌ Erro interno ao processar evento:", err);

    return res.status(500).json({
      ok: false,
      error: "Erro interno ao processar evento",
      details: err.message,
    });
  }
});

// STATUS GLOBAL
app.get("/oraculo/status", (req, res) => {
  try {
    if (!oraculoState || !Array.isArray(oraculoState.mesas)) {
      oraculoState = { updatedAt: Date.now(), mesas: [] };
      saveState(oraculoState);
    }

    return res.status(200).json({
      ok: true,
      updatedAt: oraculoState.updatedAt,
      totalMesas: oraculoState.mesas.length,
      mesas: oraculoState.mesas,
    });
  } catch (err) {
    console.error("❌ Erro ao retornar status:", err.message);

    return res.status(500).json({
      ok: false,
      error: "Erro ao retornar status",
      details: err.message,
    });
  }
});

// LISTA RESUMIDA (DEBUG)
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
      updatedAt: m.timestamp,
    }));

    return res.status(200).json({
      ok: true,
      total: mesas.length,
      mesas,
    });
  } catch (err) {
    console.error("❌ Erro ao listar mesas:", err.message);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// RESET (limpa tudo manualmente)
app.post("/oraculo/reset", (req, res) => {
  oraculoState = { updatedAt: Date.now(), mesas: [] };
  saveState(oraculoState);

  console.log("🧹 RESET aplicado: todas as mesas apagadas.");

  return res.status(200).json({
    ok: true,
    message: "Reset aplicado com sucesso",
  });
});

/* =========================
   START
========================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🔮 ORÁCULO API rodando na porta ${PORT}`);
});
