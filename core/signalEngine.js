import fs from "fs";
import path from "path";

const FILE_PATH = path.resolve("./database/history.json");

// garante arquivo
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

/**
 * Registra resultado final de uma leitura
 */
export function registrarResultado({
  mesaId,
  leituraId,
  resultado,
  numeroResolucao,
  rodadaResolucao,
  pagouAposLoss
}) {
  const history = readAll();

  history.push({
    mesaId,
    leituraId,
    resultado, // GREEN | LOSS
    numeroResolucao,
    rodadaResolucao,
    pagouAposLoss: Boolean(pagouAposLoss),
    timestamp: Date.now()
  });

  writeAll(history);
}

/**
 * Consulta histórico por mesa
 */
export function getHistoricoPorMesa(mesaId) {
  const history = readAll();
  return history.filter(h => h.mesaId === mesaId);
}
