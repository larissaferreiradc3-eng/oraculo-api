import fs from "fs";

const DB_PATH = "./data/learning-db.json";

let db = {
  total: 0,
  greens: 0,
  losses: 0,
  operadores: {}
};

// carregar base
if (fs.existsSync(DB_PATH)) {
  db = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
}

// salvar base
function persist() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// registrar evento
export function registerOutcome({
  operador,
  contextoHash,
  nivel,
  resultado
}) {
  db.total++;

  if (resultado === "green") db.greens++;
  if (resultado === "loss") db.losses++;

  if (!db.operadores[operador]) {
    db.operadores[operador] = {};
  }

  if (!db.operadores[operador][contextoHash]) {
    db.operadores[operador][contextoHash] = {
      total: 0,
      greens: 0,
      losses: 0,
      porNivel: {
        entrada: { green: 0, loss: 0 },
        "1g": { green: 0, loss: 0 },
        "2g": { green: 0, loss: 0 },
        "3g": { green: 0, loss: 0 }
      }
    };
  }

  const slot = db.operadores[operador][contextoHash];

  slot.total++;
  slot.porNivel[nivel][resultado]++;

  if (resultado === "green") slot.greens++;
  if (resultado === "loss") slot.losses++;

  persist();
}

// score de confiança
export function getConfidence(operador, contextoHash) {
  const slot = db.operadores?.[operador]?.[contextoHash];
  if (!slot || slot.total < 10) return 0.5; // neutro

  return slot.greens / slot.total;
}

// decisão de liberação
export function shouldAllowEntry(operador, contextoHash) {
  const confidence = getConfidence(operador, contextoHash);

  // regra simples (ajustável depois)
  return confidence >= 0.55;
}
