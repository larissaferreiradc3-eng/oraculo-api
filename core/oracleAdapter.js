import { getEstadoAtual } from './signalEngine.js';

export function getOracleSignal(mesaId) {
  const result = getEstadoAtual(mesaId);

  return {
    mesa_id: String(mesaId),
    status: result.status,
    alvos: result.targets || []
  };
}
