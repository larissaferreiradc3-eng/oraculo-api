// vortex27Engine.js
// Engine oficial do ORÁCULO VORTEX 27
// Processa eventos recebidos do coletor e atualiza estado por mesa

/* =========================
   HELPERS
========================= */

function isPrimeiraDuzia(n) {
  return n >= 1 && n <= 12;
}

function isSegundaDuzia(n) {
  return n >= 13 && n <= 24;
}

function clampRoulette(n) {
  if (n < 0) return 0;
  if (n > 36) return 36;
  return n;
}

function getMesa(state, mesaId) {
  return state.mesas.find((m) => m.mesaId === mesaId);
}

function upsertMesa(state, mesa) {
  const idx = state.mesas.findIndex((m) => m.mesaId === mesa.mesaId);
  if (idx >= 0) state.mesas[idx] = mesa;
  else state.mesas.push(mesa);
}

/* =========================
   ENGINE PRINCIPAL
========================= */

export function processCollectorEvent(oraculoState, event) {
  const { mesaId, mesaNome, ultimoNumero, timestamp } = event;

  // cria estrutura se não existir
  if (!oraculoState || !Array.isArray(oraculoState.mesas)) {
    oraculoState = {
      updatedAt: Date.now(),
      mesas: []
    };
  }

  let mesa = getMesa(oraculoState, mesaId);

  if (!mesa) {
    mesa = {
      mesaId,
      mesaNome: mesaNome ?? null,

      // status principal exposto pro app/bot
      status: "MONITORANDO", // MONITORANDO | ARMADO | ATIVO | GREEN | LOSS

      // lógica de rodada
      rodada: 0,

      // alvos oficiais
      alvos: [],

      // tracking
      ultimoNumero: null,
      timestamp: null,

      // histórico interno
      history: [],

      // controle interno do VORTEX 27
      vortex27: {
        ativo: false,
        aguardando: false,
        entradaLiberada: false,
        numeroReferencia: null,
        contadorApos27: 0,
        validade: 0,
        cancelado: false
      }
    };
  }

  // atualiza histórico
  mesa.ultimoNumero = ultimoNumero;
  mesa.timestamp = timestamp;

  mesa.history = Array.isArray(mesa.history) ? mesa.history : [];
  mesa.history.push(ultimoNumero);

  // limita histórico
  if (mesa.history.length > 30) {
    mesa.history = mesa.history.slice(-30);
  }

  const v = mesa.vortex27 || {
    ativo: false,
    aguardando: false,
    entradaLiberada: false,
    numeroReferencia: null,
    contadorApos27: 0,
    validade: 0,
    cancelado: false
  };

  const last2 = mesa.history.slice(-2);
  const anterior = last2.length === 2 ? last2[0] : null;

  /* =========================
     REGRA: DETECTAR 27
  ========================= */

  if (ultimoNumero === 27 && anterior !== null) {
    // regra oficial: só considerar se anterior for 1ª ou 2ª dúzia
    if (isPrimeiraDuzia(anterior) || isSegundaDuzia(anterior)) {
      v.ativo = true;
      v.aguardando = true;
      v.entradaLiberada = false;
      v.numeroReferencia = anterior;
      v.contadorApos27 = 0;
      v.validade = 0;
      v.cancelado = false;

      mesa.status = "ARMADO";
      mesa.rodada = 0;
      mesa.alvos = [];

      console.log("🎯 VORTEX27 ARMADO:", mesaId, "| ref:", anterior);
    } else {
      // 27 ignorado se anterior não for 1ª ou 2ª dúzia
      console.log("⚠️ 27 IGNORADO:", mesaId, "| anterior inválido:", anterior);
    }
  }

  /* =========================
     REGRA: CONTAR 4 RODADAS APÓS 27
  ========================= */

  if (v.ativo && v.aguardando && ultimoNumero !== 27) {
    v.contadorApos27 += 1;

    if (v.contadorApos27 >= 4) {
      v.aguardando = false;
      v.entradaLiberada = true;

      // explicar: aplica -2 e +2 no número anterior ao 27
      const alvoMenos2 = clampRoulette(v.numeroReferencia - 2);
      const alvoMais2 = clampRoulette(v.numeroReferencia + 2);

      mesa.alvos = [alvoMenos2, alvoMais2];
      mesa.status = "ATIVO";

      // validade 7 casas (começa aqui)
      v.validade = 1;
      mesa.rodada = 1;

      console.log(
        "🚨 SINAL ATIVO VORTEX27:",
        mesaId,
        "| ref:",
        v.numeroReferencia,
        "| alvos:",
        mesa.alvos.join(", ")
      );
    }
  }

  /* =========================
     REGRA: EXECUÇÃO ATIVA (CASAS 1–7)
  ========================= */

  if (mesa.status === "ATIVO" && v.entradaLiberada) {
    // checa green
    if (mesa.alvos.includes(ultimoNumero)) {
      mesa.status = "GREEN";
      v.ativo = false;
      v.entradaLiberada = false;

      console.log("✅ GREEN:", mesaId, "| caiu:", ultimoNumero);
    } else {
      // avança rodada
      v.validade += 1;
      mesa.rodada = v.validade;

      // LOSS após 7 casas
      if (v.validade > 7) {
        mesa.status = "LOSS";
        v.ativo = false;
        v.entradaLiberada = false;

        console.log("❌ LOSS:", mesaId, "| estourou 7 casas");
      }
    }
  }

  mesa.vortex27 = v;

  // atualiza state global
  oraculoState.updatedAt = Date.now();
  upsertMesa(oraculoState, mesa);

  return oraculoState;
}
