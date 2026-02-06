// vortex27Engine.js
// ENGINE VORTEX 27 + SCORE + STATUS ENTRAR NA RODADA 4

const MAX_HISTORICO = 30;
const ESPERA_ENTRADA = 4;
const MAX_RODADAS = 8;

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
  if (n === 0) return "verde";
  return vermelhos.has(n) ? "vermelho" : "preto";
}

function coluna(n) {
  if (n === 0) return null;
  if (n % 3 === 1) return 1;
  if (n % 3 === 2) return 2;
  if (n % 3 === 0) return 3;
  return null;
}

/**
 * Bloco 2 expandido por soma +2
 */
function gerarBloco2PorSoma(referencia) {
  const eixo = referencia + 2;

  const mapa = {
    2:  [2,12,20,21,22,32],
    4:  [2,12,20,21,22,32],
    6:  [26,29],
    8:  [26,29],
    10: [20,22],
    12: [12,21,32],
    14: [12,21,32],
    16: [26,29],
    18: [20,22],
    20: [20,22],
    22: [22],
    24: [24],
    26: [26,29],
    28: [28],
    30: [32]
  };

  return mapa[eixo] ?? [];
}

/**
 * SCORE baseado em:
 * - força dos alvos (20/22/12/21/32 são "premium")
 * - repetição de cor nas últimas 5
 * - repetição de dúzia nas últimas 5
 * - repetição de coluna nas últimas 5
 */
function calcularScore(history, alvos) {
  let score = 0;

  const premium = new Set([2, 12, 20, 21, 22, 32, 26, 29]);

  // peso por alvo premium
  for (const a of alvos) {
    if (premium.has(a)) score += 12;
    else score += 6;
  }

  // pega janela dos últimos 5
  const janela = history.slice(0, 5);

  const cores = janela.map(cor);
  const duzias = janela.map(duzia);
  const colunas = janela.map(coluna);

  function freq(arr) {
    const map = {};
    for (const x of arr) {
      if (!x) continue;
      map[x] = (map[x] || 0) + 1;
    }
    return map;
  }

  const fCor = freq(cores);
  const fDuzia = freq(duzias);
  const fCol = freq(colunas);

  // soma padrões repetidos
  score += (fCor["vermelho"] || 0) * 6;
  score += (fCor["preto"] || 0) * 6;

  score += (fDuzia[1] || 0) * 7;
  score += (fDuzia[2] || 0) * 7;
  score += (fDuzia[3] || 0) * 7;

  score += (fCol[1] || 0) * 5;
  score += (fCol[2] || 0) * 5;
  score += (fCol[3] || 0) * 5;

  // clamp 0-100
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return score;
}

/**
 * cria mesa caso não exista
 */
function ensureMesa(oraculoState, mesaId, mesaNome) {
  let mesa = oraculoState.mesas.find((m) => m.mesaId === mesaId);

  if (!mesa) {
    mesa = {
      mesaId,
      mesaNome: mesaNome ?? "Mesa desconhecida",
      status: "OBSERVANDO",
      rodada: 0,
      alvos: [],
      referencia: null,
      ultimoNumero: null,
      timestamp: null,
      updatedAt: Date.now(),
      history: [],
      score: 0,
      gatilhoAtivo: false
    };

    oraculoState.mesas.push(mesa);
  }

  if (mesaNome) mesa.mesaNome = mesaNome;

  return mesa;
}

/**
 * PROCESSADOR PRINCIPAL
 */
export function processCollectorEvent(oraculoState, payload) {
  const { mesaId, mesaNome, ultimoNumero, timestamp } = payload;

  const mesa = ensureMesa(oraculoState, mesaId, mesaNome);

  mesa.updatedAt = Date.now();
  mesa.timestamp = timestamp;
  mesa.ultimoNumero = ultimoNumero;

  // atualiza histórico
  mesa.history.unshift(ultimoNumero);
  mesa.history = mesa.history.slice(0, MAX_HISTORICO);

  // =========================
  // DETECTA 27 (gatilho)
  // =========================
  if (!mesa.gatilhoAtivo) {
    if (ultimoNumero === 27 && mesa.history.length >= 3) {
      const anterior1 = mesa.history[1];
      const anterior2 = mesa.history[2];

      const d1 = duzia(anterior1);
      const d2 = duzia(anterior2);

      // filtro obrigatório: 27 após 1ª/2ª dúzia
      if ((d1 === 1 || d1 === 2) && (d2 === 1 || d2 === 2)) {
        mesa.gatilhoAtivo = true;
        mesa.status = "ATIVO";
        mesa.rodada = 0;
        mesa.referencia = anterior1;
        mesa.alvos = [];
        mesa.score = 0;
      }
    }

    return oraculoState;
  }

  // =========================
  // CONTAGEM DE RODADAS
  // =========================
  mesa.rodada += 1;

  // =========================
  // GERA ALVOS NA RODADA 4
  // =========================
  if (mesa.rodada === ESPERA_ENTRADA) {
    mesa.alvos = gerarBloco2PorSoma(mesa.referencia);
    mesa.score = calcularScore(mesa.history, mesa.alvos);
    mesa.status = "ENTRAR"; // status especial
  }

  // =========================
  // GREEN
  // =========================
  if (mesa.alvos.includes(ultimoNumero)) {
    mesa.status = "GREEN";
    mesa.score = calcularScore(mesa.history, mesa.alvos);
    return oraculoState;
  }

  // =========================
  // LOSS (estouro)
  // =========================
  if (mesa.rodada >= MAX_RODADAS) {
    mesa.status = "LOSS";
    mesa.score = calcularScore(mesa.history, mesa.alvos);
    return oraculoState;
  }

  // =========================
  // MANTÉM ATIVO
  // =========================
  if (mesa.rodada < ESPERA_ENTRADA) {
    mesa.status = "ATIVO";
  } else {
    // após rodada 4, se não bateu green ainda, continua ATIVO mas com alvos definidos
    mesa.status = "ATIVO";
    mesa.score = calcularScore(mesa.history, mesa.alvos);
  }

  return oraculoState;
}
