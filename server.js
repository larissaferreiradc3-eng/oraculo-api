// server.js
// ORÁCULO API — VERSÃO FINAL (PERSISTENTE + ENGINE VORTEX 27)
// Mantém estado no disco e aplica lógica automática do VORTEX 27 por mesa

import express from "express";
import cors from "cors";

import {
  ensureStorage,
  loadState,
  saveState
} from "./stateStorage.js";

import { processCollectorEvent } from "./vortex27Engine.js";

/* =========================
   CONFIG
========================= */

const PORT = process.env.PORT || 3000;

/* =========================
   BOOT
========================= */

ensureStorage();

let oraculoState = loadState();

console.log("🔁 Estado carregado do disco:");
console.log(`→ mesas: ${oraculoState.mesas.length}`);

/* =========================
   APP
========================= */

const app = express();

app.use(cors());
app.use(express.json());

/* =========================
   ROTAS
========================= */

// RECEBE EVENTOS DO COLETOR (somente mesaId, mesaNome, ultimoNumero)
app.post("/oraculo/evento", (req, res) => {
  try {
    const body = req.body || {};

    const { mesaId, mesaNome, ultimoNumero } = body;

    if (!mesaId || ultimoNumero === undefined || ultimoNumero === null) {
      console.error("❌ Evento rejeitado: payload inválido:", body);
      return res.status(400).json({
        error: "mesaId e ultimoNumero são obrigatórios"
      });
    }

    // aplica engine VORTEX 27 e atualiza estado
    oraculoState = processCollectorEvent(oraculoState, {
      mesaId,
      mesaNome: mesaNome ?? null,
      ultimoNumero: Number(ultimoNumero),
      timestamp: Date.now()
    });

    // salva persistente
    saveState(oraculoState);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("❌ Erro interno ao processar evento:", err.message);
    return res.status(500).json({ error: "Erro interno" });
  }
});

// STATUS GLOBAL
app.get("/oraculo/status", (req, res) => {
  return res.status(200).json(oraculoState);
});

// HEALTHCHECK
app.get("/", (req, res) => {
  res.send("ORÁCULO API ONLINE");
});

/* =========================
   START
========================= */

app.listen(PORT, () => {
  console.log(`🔮 ORÁCULO API rodando na porta ${PORT}`);
});
