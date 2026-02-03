// oracleEvents.js
// Tradução de eventos do coletor em estado inicial do Oráculo

import { getState } from './oracleState.js';

export function applyCollectorEvent(event) {
  const state = getState();

  // Não inicia novo ciclo se já houver um ativo
  if (state.estado !== 'IDLE') return;

  // Evento inicial vindo do coletor
  if (event.eventType === 'ROULETTE_27_DETECTED') {
    state.estado = 'GATILHO_CONFIRMADO';
    state.mesa = {
      nome: event.mesaNome,
      provedor: event.mesaProvedor
    };
    state.rodada = 1;
    state.mensagem = 'Gatilho identificado. Preparando cenário.';
    state.updatedAt = new Date().toISOString();
  }
}
