import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve("./data");
const FILE_PATH = path.join(DATA_DIR, "history.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify([]));
}

function readAll() {
  const raw = fs.readFileSync(FILE_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeAll(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

export function registrarResultado({
  mesaId,
  leituraId,
  resultado,
  numeroResolucao,
  rodadaResolucao,
  score,
  alvos
}) {
  const history = readAll();

  history.push({
    mesaId,
    leituraId,
    resultado,
    numeroResolucao,
    rodadaResolucao,
    score: score ?? 0,
    alvos: Array.isArray(alvos) ? alvos : [],
    timestamp: Date.now()
  });

  writeAll(history);
}

export function getHistoricoPorMesa(mesaId) {
  const history = readAll();
  return history.filter((h) => h.mesaId === mesaId);
}
