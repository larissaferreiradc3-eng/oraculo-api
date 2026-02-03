// mesaRegistry.js
// Tradução de mesa técnica para mesa humana

export const mesaRegistry = {
  gamblingcounting: {
    0: { nome: 'Auto Roulette', provedor: 'Evolution' },
    1: { nome: 'Lightning Roulette', provedor: 'Evolution' },
    2: { nome: 'Brazilian Roulette', provedor: 'Evolution' },
    3: { nome: 'Speed Roulette', provedor: 'Evolution' },
    4: { nome: 'Immersive Roulette', provedor: 'Evolution' }
    // você pode ir enriquecendo isso com o tempo
  }
};

export function getMesaHumana(source, mesaIndex) {
  const sourceMap = mesaRegistry[source];
  if (!sourceMap) return null;

  return sourceMap[mesaIndex] || {
    nome: 'Mesa ao vivo',
    provedor: 'Desconhecido'
  };
}
