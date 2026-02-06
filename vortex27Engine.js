// vortex27Engine.js
// ENGINE PRINCIPAL DO ORÁCULO VORTEX 27 + SCORE + GREEN/LOSS CORRETO

const MAX_HISTORY = 30;
const ESPERA_ENTRADA = 4;
const MAX_RODADAS = 8;

// cache interno por mesa
const TABLE_STATE = new Map();

/* =========================
   HELPERS
========================= */

function duzia(n) {
  if (n >= 1 && n <= 12) return 1;
  if (n >= 13 && n <= 24) return 2;
  if (n >= 25 && n <= 36) return 3;
  return null;
}

function cor(n) {
  const vermelhos = new Set([
    1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36
  ]);
  if (n === 0) return "VERDE";
  return vermelhos.has(n) ? "VERMELHO" : "PRETO";
}

function coluna(n) {
  if (n === 0) return null;
  const col1 = new Set([1,4,7,10,13,16,19,22,25,28,31,34]);
  const col2 = new Set([2,5,8,11,14,17,20,23,26,29,32,35]);
  const col3 = new Set([3,6,9,12,15,18,21,24,27,30,33,36]);

  if (col1.has(n)) return 1;
  if (col2.has(n)) return 2;
  if (col3.has(n)) return 3;
  return null;
}

/* =========================
   MAPEAMENTO ALVOS
========================= */

function gerarAlvosExpandido(referencia) {
  const eixo = referencia + 2;

  const mapa = {
    2:  [2,12,20,21,22,32],
    4:  [2,12,20,21,22,32],
    6:  [26,29,20,22],
    8:  [26,29,20,22],
    10: [20,22,12],
    12: [12,21,32,20],
    14: [12,21,32,22],
    16: [26,29,32],
    18: [20,22,21],
    20: [20,22,12,32],
    22: [22,20,12],
    24: [24,21,32],
    26: [26,29,20],
    28: [28,26,29],
    30: [32,21,22]
  };

  return mapa[eixo] ?? [];
}

/* =========================
   SCORE
========================= */

function calcularScore(history) {
  // pega últimos 5 resultados (sem contar o atual)
  const ultimos = history.slice(1, 6);

  if (ultimos.length < 5) return 50;

  const cores = ultimos.map(cor);
  const duzias = ultimos.map(duzia);
  const colunas = ultimos.map(coluna);

  function freq(arr, value) {
    return arr.filter((x) => x === value).length;
  }

  const scoreCor = Math.max(
    freq(cores, "VERMELHO"),
    freq(cores, "PRETO")
  ) * 10;

  const scoreDuzia = Math.max(
    freq(duzias, 1),
    freq(duzias, 2),
    freq(duzias, 3)
  ) * 10;

  const scoreColuna = Math.max(
    freq(colunas, 1),
    freq(colunas, 2),
    freq(colunas, 3)
  ) * 10;

  let score = scoreCor + scoreDuzia + scoreColuna;

  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return score;
}

/* =========================
   ENGINE
========================= */

export function processCollectorEvent(oraculoState, evento) {
  const { mesaId, mesaNome, ultimoNumero, timestamp } = evento;

  if (!TABLE_STATE.has(mesaId)) {
    TABLE_STATE.set(mesaId, {
      ativo: false,
      rodada: 0,
      referencia: null,
      alvos: [],
      triggerNumero: null,
      history: [],
      score: 0
    });
  }

  const state = TABLE_STATE.get(mesaId);

  // atualiza histórico
  state.history.unshift(ultimoNumero);
  state.history = state.history.slice(0, MAX_HISTORY);

  // score sempre atualizado
  state.score = calcularScore(state.history);

  /* =========================
     DETECTA GATILHO 27
  ========================= */

  if (!state.ativo) {
    if (ultimoNumero === 27 && state.history.length >= 3) {
      const n1 = state.history[1];
      const n2 = state.history[2];

      const d1 = duzia(n1);
      const d2 = duzia(n2);

      // filtro obrigatório: 1ª e 2ª dúzia
      if ((d1 === 1 || d1 === 2) && (d2 === 1 || d2 === 2)) {
        state.ativo = true;
        state.rodada = 0;
        state.referencia = n1;
        state.alvos = [];
        state.triggerNumero = 27;
      }
    }

    return atualizarMesaNoState(oraculoState, {
      mesaId,
      mesaNome,
      status: "OBSERVAR",
      rodada: null,
      alvos: [],
      ultimoNumero,
      timestamp,
      score: state.score,
      history: state.history
    });
  }

  /* =========================
     SE ESTÁ ATIVO → CONTA RODADA
  ========================= */

  state.rodada += 1;

  /* =========================
     GERA ALVOS NA RODADA 4
  ========================= */

  if (state.rodada === ESPERA_ENTRADA) {
    state.alvos = gerarAlvosExpandido(state.referencia);

    // sempre incluir 0 como alvo opcional (green extra)
    if (!state.alvos.includes(0)) {
      state.alvos.push(0);
    }
  }

  /* =========================
     GREEN (DURANTE O CICLO)
  ========================= */

  if (state.alvos.length > 0 && state.alvos.includes(ultimoNumero)) {
    const snapshot = {
      mesaId,
      mesaNome,
      status: "GREEN",
      rodada: state.rodada,
      rodadaResolucao: state.rodada,
      numeroResolucao: ultimoNumero,
      alvos: state.alvos,
      ultimoNumero,
      timestamp,
      score: state.score,
      history: state.history
    };

    TABLE_STATE.delete(mesaId);
    return atualizarMesaNoState(oraculoState, snapshot);
  }

  /* =========================
     LOSS (PASSOU DA 8ª)
  ========================= */

  if (state.rodada > MAX_RODADAS) {
    const snapshot = {
      mesaId,
      mesaNome,
      status: "LOSS",
      rodada: state.rodada,
      rodadaResolucao: MAX_RODADAS,
      numeroResolucao: ultimoNumero,
      alvos: state.alvos,
      ultimoNumero,
      timestamp,
      score: state.score,
      history: state.history
    };

    TABLE_STATE.delete(mesaId);
    return atualizarMesaNoState(oraculoState, snapshot);
  }

  /* =========================
     ATIVO NORMAL
  ========================= */

  return atualizarMesaNoState(oraculoState, {
    mesaId,
    mesaNome,
    status: "ATIVO",
    rodada: state.rodada,
    alvos: state.alvos,
    ultimoNumero,
    timestamp,
    score: state.score,
    history: state.history
  });
}

/* =========================
   UPSERT NA LISTA DE MESAS
========================= */

function atualizarMesaNoState(oraculoState, mesaAtualizada) {
  const index = oraculoState.mesas.findIndex((m) => m.mesaId === mesaAtualizada.mesaId);

  if (index >= 0) {
    oraculoState.mesas[index] = mesaAtualizada;
  } else {
    oraculoState.mesas.push(mesaAtualizada);
  }

  oraculoState.updatedAt = Date.now();

  return oraculoState;
}
