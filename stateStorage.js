// oraculo-api/stateStorage.js
// RESPONSÁVEL POR MANTER O ESTADO DO ORÁCULO PARA A INTERFACE

// ===============================
// STATE EM MEMÓRIA
// ===============================

// mesas ATIVAS (janela 5–8)
const activeMesas = new Map();

// histórico encerrado (opcional, útil pra debug / log)
const closedMesas = [];

// ===============================
// ATIVO (UPSERT)
// ===============================

export function upsertActiveMesa(payload) {
  const {
    mesaId,
    mesaNome,
    status,
    rodada,
    alvos,
    ultimoNumero,
    timestamp
  } = payload;

  activeMesas.set(mesaId, {
    mesaId,
    mesaNome,
    status,          // ATIVO
    rodada,
    alvos,
    ultimoNumero,
    timestamp
  });
}

// ===============================
// ENCERRAMENTO (GREEN / LOSS)
// ===============================

export function closeMesa(payload) {
  const {
    mesaId,
    mesaNome,
    status,          // GREEN | LOSS
    rodada,
    alvos,
    ultimoNumero,
    timestamp
  } = payload;

  // remove da lista ativa
  activeMesas.delete(mesaId);

  // guarda no histórico (opcional)
  closedMesas.push({
    mesaId,
    mesaNome,
    status,
    rodada,
    alvos,
    ultimoNumero,
    timestamp
  });
}

// ===============================
// EXPOSIÇÃO PARA A INTERFACE
// ===============================

export function getOracleState() {
  return {
    updatedAt: Date.now(),

    // somente mesas ATIVAS aparecem na interface
    mesas: Array.from(activeMesas.values())

    // se quiser depois:
    // encerradas: closedMesas
  };
}
