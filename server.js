// api/index.js
// ORÁCULO API — RECEPÇÃO DE EVENTOS DO COLLECTOR

import express from "express";
import cors from "cors";

const app = express();

/* ============================
   CONFIGURAÇÃO BÁSICA
============================ */

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json());

/* ============================
   ESTADO GLOBAL DO ORÁCULO
============================ */

const oraculoState = {
  updatedAt: Date.now(),
  mesas: []
};

/* ============================
   ROTA: RECEBE EVENTO
============================ */

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
    console.error("❌ Evento rejeitado: mesaId ausente", body);
    return res.status(400).json({ error: "mesaId é obrigatório" });
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

  console.log("📥 EVENTO RECEBIDO:", mesaAtualizada);

  return res.status(200).json({ ok: true });
});

/* ============================
   ROTA: STATUS (LEITURA)
============================ */

app.get("/oraculo/status", (req, res) => {
  return res.status(200).json(oraculoState);
});

/* ============================
   START DO SERVIDOR
============================ */

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🔮 ORÁCULO API rodando em http://localhost:${PORT}`);
});
