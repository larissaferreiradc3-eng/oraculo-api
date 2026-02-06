// cleanup.js
// Remove mesas que ficaram sem atualização por muito tempo

export function cleanupOldTables(state, ttlMs) {
  if (!state || !Array.isArray(state.mesas)) return state;

  const agora = Date.now();
  const antes = state.mesas.length;

  state.mesas = state.mesas.filter((mesa) => {
    if (!mesa.timestamp) return false;

    const diff = agora - mesa.timestamp;

    // se mesa estiver "morta" remove
    if (diff > ttlMs) return false;

    return true;
  });

  const depois = state.mesas.length;

  if (antes !== depois) {
    console.log(`🧹 Cleanup: removidas ${antes - depois} mesas antigas`);
  }

  state.updatedAt = Date.now();
  return state;
}
