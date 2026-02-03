// vortex.js
// ⚠️ NÚCLEO PURO — NÃO IMPORTA API, ROTAS OU EXPRESS

export const VORTEX = {
  state: {
    lastSpin: null,
    history: []
  },

  read(spin) {
    this.state.lastSpin = spin.number;
    this.state.history.push(spin);

    // 🔍 aqui entra TODA a lógica do VORTEX
    // operadores, janelas, scores, etc.

    console.log('[VORTEX] lendo spin:', spin.number);

    return {
      accepted: true,
      spin
    };
  }
};
