// vortex27Engine.js
// ENGINE FINAL — VORTEX 27 + EQUIVALÊNCIAS + CONTROLE TOTAL

const MAX_HISTORICO = 30;
const ESPERA_ENTRADA = 4;
const MAX_RODADAS = 8;
const MAX_ALVOS = 6;

/* =========================
   EQUIVALÊNCIAS OFICIAIS
========================= */

const EQUIVALENTES = {
  11: [22, 33],
  22: [11, 33],
  33: [11, 22],

  16: [23, 32],
  23: [16, 32],
  32: [16, 23],

  13: [31],
  31: [13],

  15: [25],
  25: [15],

  14: [34],
  34: [14],

  12: [21, 32],
  21: [12, 32]
};

/* =========================
   HELPERS
========================= */

function gerarBloco2PorSoma(referencia) {
  const eixo = referencia + 2;
  const mapa = {
    10: [20, 22],
    12: [12, 21, 32],
    14: [12, 21, 32],
    16: [26, 29],
    18: [20, 22],
    20: [20, 22],
    22: [22],
    24: [24],
    26: [26, 29],
    28: [28],
    30: [32]
  };
  return mapa[eixo] ?? [];
}

function expandirComEquivalentes(alvos) {
  const set = new Set(alvos);

  for (const n of alvos) {
    if (EQUIVALENTES[n]) {
      EQUIVALENTES[n].forEach(eq => set.add(eq));
    }
  }

  let resultado = Array.from(set);

  // zero nunca pode ficar sozinho
  if (resultado.length === 1 && resultado[0] === 0) {
    resultado.push(20, 22);
  }

  return resultado.slice(0, MAX_ALVOS);
}

/* =========================
   ESTADO POR MESA
========================= */

const STATE = new Map();

/* =========================
   ENGINE
========================= */

export function processCollectorEvent(oraculoState, evento) {
  const { mesaId, mesaNome, ultimoNumero, timestamp } = evento;

  if (!STATE.has(mesaId)) {
    STATE.set(mesaId, {
      historico: [],
      ativo: false,
      rodada: 0,
      referencia: null,
      alvos: []
    });
  }

  const state = STATE.get(mesaId);

  // histórico
  state.historico.unshift(ultimoNumero);
  state.historico = state.historico.slice(0, MAX_HISTORICO);

  /* =========================
     GATILHO 27
  ========================= */

  if (!state.ativo) {
    if (ultimoNumero === 27 && state.historico.length >= 3) {
      state.ativo = true;
      state.rodada = 0;
      state.referencia = state.historico[1];
      state.alvos = [];
    }
    return oraculoState;
  }

  /* =========================
     CONTAGEM
  ========================= */

  state.rodada += 1;

  /* =========================
     GERAÇÃO DE ALVOS (RODADA 4)
  ========================= */

  if (state.rodada === ESPERA_ENTRADA) {
    const base = gerarBloco2PorSoma(state.referencia);
    state.alvos = expandirComEquivalentes(base);

    if (!state.alvos.length) {
      STATE.delete(mesaId);
      return oraculoState;
    }

    atualizarMesa(oraculoState, {
      mesaId,
      mesaNome,
      status: "ATIVO",
      rodada: state.rodada,
      alvos: state.alvos,
      ultimoNumero,
      timestamp
    });

    return oraculoState;
  }

  /* =========================
     GREEN
  ========================= */

  if (state.alvos.includes(ultimoNumero)) {
    atualizarMesa(oraculoState, {
      mesaId,
      mesaNome,
      status: "GREEN",
      rodada: state.rodada,
      alvos: state.alvos,
      ultimoNumero,
      timestamp
    });

    STATE.delete(mesaId);
    return oraculoState;
  }

  /* =========================
     LOSS
  ========================= */

  if (state.rodada >= MAX_RODADAS) {
    atualizarMesa(oraculoState, {
      mesaId,
      mesaNome,
      status: "LOSS",
      rodada: state.rodada,
      alvos: state.alvos,
      ultimoNumero,
      timestamp
    });

    STATE.delete(mesaId);
    return oraculoState;
  }

  return oraculoState;
}

/* =========================
   ATUALIZA MESA GLOBAL
========================= */

function atualizarMesa(state, snapshot) {
  const idx = state.mesas.findIndex(m => m.mesaId === snapshot.mesaId);
  if (idx >= 0) state.mesas[idx] = snapshot;
  else state.mesas.push(snapshot);
}
