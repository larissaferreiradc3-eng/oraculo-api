// oracleState.js
// Estado central do Oráculo com controle de rodada

const state = {
  estado: "IDLE", // IDLE | EXECUTANDO
  mesa: null,
  rodada: 0,
  mensagem: "Aguardando oportunidade",
  updatedAt: new Date().toISOString()
};

export function getState() {
  return state;
}

export function resetState() {
  state.estado = "IDLE";
  state.mesa = null;
  state.rodada = 0;
  state.mensagem = "Aguardando oportunidade";
  state.updatedAt = new Date().toISOString();
}

export function startExecution(mesa) {
  state.estado = "EXECUTANDO";
  state.mesa = mesa;
  state.rodada = 1;
  state.mensagem = "Executando sinal";
  state.updatedAt = new Date().toISOString();
}

export function advanceRodada() {
  state.rodada += 1;
  state.updatedAt = new Date().toISOString();
}
