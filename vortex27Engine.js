// vortex27Engine.js
// ENGINE DO ORÁCULO — VORTEX 27 + SCORE + CONFLUÊNCIA
// Gera sinais ATIVO somente na rodada 4 com score >= SCORE_MINIMO
// Encerra automaticamente em GREEN ou LOSS
// Nunca envia alvos vazios e nunca envia 0 sozinho
// Compatível com Render + Bot Telegram (mesa.score)

const MAX_HISTORICO = 30;
const MAX_RODADAS = 8;
const RODADA_ENTRADA = 4;

// 🔥 Agora configurável por ENV (Render)
const SCORE_MINIMO = Number(process.env.SCORE_MINIMO || 50);

const MAX_ALVOS = 6;

/* ============================
   HELPERS BÁSICOS
============================ */

function duzia(n) {
  if (n >= 1 && n <= 12) return 1;
  if (n >= 13 && n <= 24) return 2;
  if (n >= 25 && n <= 36) return 3;
  return null;
}

function coluna(n) {
  if (n === 0) return null;
  const mod = n % 3;
  if (mod === 1) return 1;
  if (mod === 2) return 2;
  return 3;
}

function cor(n) {
  if (n === 0) return "verde";

  const vermelhos = new Set([
    1, 3, 5, 7, 9, 12, 14, 16, 18,
    19, 21, 23, 25, 27, 30, 32, 34, 36
  ]);

  return vermelhos.has(n) ? "vermelho" : "preto";
}

/* ============================
   GÊMEOS (11/22/33)
============================ */

function expandirGemeos(alvos) {
  const set = new Set(alvos);

  const gemeos = [11, 22, 33];

  const temGemeo = gemeos.some((n) => set.has(n));
  if (!temGemeo) return [...set];

  for (const n of gemeos) {
    if (set.size >= MAX_ALVOS) break;
    set.add(n);
  }

  return [...set];
}

/* ============================
   MAPA DE SOMA (BASE)
============================ */

function gerarBasePorSoma(referencia) {
  const eixo = referencia + 2;

  const mapa = {
    2: [2, 12, 20, 21, 22, 32],
    4: [2, 12, 20, 21, 22, 32],
    6: [26, 29],
    8: [26, 29],
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
    30: [32],
  };

  return mapa[eixo] ?? [];
}

/* ============================
   CONFLUÊNCIA: ESPELHOS / SUBSTITUIÇÕES
============================ */

function substituicoes(n) {
  const map = {
    0: [11, 22, 33],
    1: [0, 10, 11, 22, 33],
    2: [1, 3, 11, 20],
    3: [2, 4, 12, 13, 24, 31, 35],
    4: [3, 5, 13, 14, 25, 36, 30, 33],
    5: [4, 6, 14, 15, 26, 22, 31],
    6: [5, 7, 15, 16, 27, 14, 23, 32],
    7: [6, 8, 16, 17, 28],
    8: [7, 9, 17, 18, 29],
    9: [8, 10, 18, 19, 26, 35],
    10: [9, 11, 19, 20],
    11: [10, 12, 20, 22, 33],
    12: [11, 13, 21, 22],
    13: [12, 14, 23, 24, 31],
    14: [13, 15, 24, 25, 34],
    15: [14, 16, 25, 26],
    16: [15, 17, 32],
    17: [16, 18, 34],
    18: [17, 19, 36],
    19: [18, 20, 33],
    20: [19, 21, 16],
    21: [20, 22, 2],
    22: [21, 23, 11, 33],
    23: [22, 24, 32],
    24: [23, 25, 12],
    25: [24, 26, 15],
    26: [25, 27, 29],
    27: [26, 28, 13],
    28: [27, 29],
    29: [28, 30, 26],
    30: [29, 31, 26],
    31: [30, 32, 13],
    32: [31, 33, 16, 23],
    33: [32, 34, 11, 22],
    34: [33, 35, 14],
    35: [34, 36, 17],
    36: [35, 18],
  };

  return map[n] ?? [];
}

/* ============================
   SCORE POR CONFLUÊNCIA
============================ */

function calcularScoreConfluencia(historico, candidatos) {
  if (!historico || historico.length < 5) return 50;

  const ultimos5 = historico.slice(0, 5);

  let score = 0;

  const freqCor = {};
  const freqDuzia = {};
  const freqColuna = {};

  for (const n of ultimos5) {
    const c = cor(n);
    const d = duzia(n);
    const col = coluna(n);

    freqCor[c] = (freqCor[c] ?? 0) + 1;
    if (d) freqDuzia[d] = (freqDuzia[d] ?? 0) + 1;
    if (col) freqColuna[col] = (freqColuna[col] ?? 0) + 1;
  }

  for (const cand of candidatos) {
    const c = cor(cand);
    const d = duzia(cand);
    const col = coluna(cand);

    score += (freqCor[c] ?? 0) * 4;
    if (d) score += (freqDuzia[d] ?? 0) * 3;
    if (col) score += (freqColuna[col] ?? 0) * 3;
  }

  const maxPossivel = candidatos.length * (5 * 4 + 5 * 3 + 5 * 3);
  let final = Math.round((score / maxPossivel) * 100);

  if (final > 100) final = 100;
  if (final < 0) final = 0;

  return final;
}

/* ============================
   GERAÇÃO DE ALVOS POR CONFLUÊNCIA
============================ */

function gerarAlvosPorConfluencia(referencia, historico) {
  const baseSoma = gerarBasePorSoma(referencia);
  const candidatos = new Set();

  for (const n of baseSoma) candidatos.add(n);

  for (const b of baseSoma) {
    const subs = substituicoes(b);
    for (const s of subs) candidatos.add(s);
  }

  const subsRef = substituicoes(referencia);
  for (const s of subsRef) candidatos.add(s);

  candidatos.delete(null);
  candidatos.delete(undefined);
  candidatos.delete(27);

  const lista = [...candidatos].filter(
    (n) => Number.isInteger(n) && n >= 0 && n <= 36
  );

  const freq = {};
  for (const n of historico) {
    freq[n] = (freq[n] ?? 0) + 1;
  }

  lista.sort((a, b) => (freq[b] ?? 0) - (freq[a] ?? 0));

  let final = lista.slice(0, MAX_ALVOS);

  final = expandirGemeos(final);

  final = final.slice(0, MAX_ALVOS);

  if (final.length === 1 && final[0] === 0) return [];
  if (final.length < 2) return [];

  return final;
}

/* ============================
   RESET CICLO COMPLETO
============================ */

function resetarCiclo(mesa) {
  mesa.status = "IDLE";
  mesa.rodada = 0;
  mesa.alvos = [];
  mesa.score = 0;

  mesa.numeroResolucao = null;
  mesa.rodadaResolucao = null;

  mesa.vortex27.ativo = false;
  mesa.vortex27.referencia = null;
  mesa.vortex27.gatilhoNumero = null;
  mesa.vortex27.gatilhoTimestamp = null;
  mesa.vortex27.score = 0;
  mesa.vortex27.entradaEnviada = false;
}

/* ============================
   ENGINE PRINCIPAL
============================ */

export function processCollectorEvent(oraculoState, evento) {
  const { mesaId, mesaNome, ultimoNumero, timestamp } = evento;

  if (!oraculoState.mesas) oraculoState.mesas = [];

  let mesa = oraculoState.mesas.find((m) => m.mesaId === mesaId);

  if (!mesa) {
    mesa = {
      mesaId,
      mesaNome: mesaNome ?? "Mesa desconhecida",
      status: "IDLE",
      rodada: 0,
      alvos: [],
      score: 0,
      ultimoNumero: ultimoNumero,
      timestamp: timestamp,
      history: [],
      vortex27: {
        ativo: false,
        referencia: null,
        gatilhoNumero: null,
        gatilhoTimestamp: null,
        score: 0,
        entradaEnviada: false,
      },
    };

    oraculoState.mesas.push(mesa);
  }

  if (mesaNome) mesa.mesaNome = mesaNome;

  mesa.history.unshift(ultimoNumero);
  mesa.history = mesa.history.slice(0, MAX_HISTORICO);

  mesa.ultimoNumero = ultimoNumero;
  mesa.timestamp = timestamp;

  const vortex = mesa.vortex27;

  if (mesa.status === "GREEN" || mesa.status === "LOSS" || mesa.status === "CANCELADO") {
    resetarCiclo(mesa);
  }

  // DETECTA 27
  if (!vortex.ativo && ultimoNumero === 27) {
    vortex.ativo = true;
    vortex.referencia = mesa.history[1] ?? null;
    vortex.gatilhoNumero = 27;
    vortex.gatilhoTimestamp = timestamp;
    vortex.score = 0;
    vortex.entradaEnviada = false;

    mesa.status = "OBSERVANDO";
    mesa.rodada = 0;
    mesa.alvos = [];
    mesa.score = 0;

    return oraculoState;
  }

  // SE NÃO ESTÁ EM CICLO
  if (!vortex.ativo) {
    mesa.status = "IDLE";
    mesa.rodada = 0;
    mesa.alvos = [];
    mesa.score = 0;
    return oraculoState;
  }

  // AVANÇA RODADA
  mesa.rodada += 1;

  if (mesa.rodada < RODADA_ENTRADA) {
    mesa.status = "OBSERVANDO";
    return oraculoState;
  }

  // GERA ALVOS NA RODADA 4
  if (mesa.rodada === RODADA_ENTRADA && !vortex.entradaEnviada) {
    const referencia = vortex.referencia;

    if (referencia === null || referencia === undefined) {
      mesa.status = "CANCELADO";
      vortex.ativo = false;
      mesa.alvos = [];
      mesa.score = 0;
      return oraculoState;
    }

    const alvos = gerarAlvosPorConfluencia(referencia, mesa.history);

    if (!alvos || alvos.length < 2) {
      mesa.status = "CANCELADO";
      vortex.ativo = false;
      mesa.alvos = [];
      mesa.score = 0;
      return oraculoState;
    }

    const score = calcularScoreConfluencia(mesa.history, alvos);

    vortex.score = score;
    mesa.score = score;

    if (score < SCORE_MINIMO) {
      mesa.status = "CANCELADO";
      vortex.ativo = false;
      mesa.alvos = [];
      mesa.score = 0;
      return oraculoState;
    }

    mesa.alvos = alvos;
    mesa.status = "ATIVO";
    vortex.entradaEnviada = true;

    return oraculoState;
  }

  // GREEN
  if (mesa.status === "ATIVO" && Array.isArray(mesa.alvos) && mesa.alvos.includes(ultimoNumero)) {
    mesa.status = "GREEN";
    mesa.numeroResolucao = ultimoNumero;
    mesa.rodadaResolucao = mesa.rodada;

    vortex.ativo = false;
    vortex.referencia = null;

    return oraculoState;
  }

  // LOSS
  if (mesa.status === "ATIVO" && mesa.rodada >= MAX_RODADAS) {
    mesa.status = "LOSS";
    mesa.numeroResolucao = ultimoNumero;
    mesa.rodadaResolucao = mesa.rodada;

    vortex.ativo = false;
    vortex.referencia = null;

    return oraculoState;
  }

  return oraculoState;
}
