import { registerOutcome, shouldAllowEntry } from "./learningEngine.js";

/**
 * ESTADOS POSSÍVEIS
 */
const STATES = {
  IDLE: "idle",
  ENTRY: "entrada",
  G1: "1g",
  G2: "2g",
  G3: "3g",
  GREEN: "green",
  LOSS: "loss"
};

/**
 * CONFIGURAÇÃO BASE
 */
const MAX_GALES = 3;
const OPERADOR = "VORTEX_CORE";

/**
 * STATE GLOBAL
 */
let state = STATES.IDLE;
let galeLevel = 0;
let currentContextHash = null;
let activeTargets = [];
let lastDecisionTimestamp = null;

/**
 * GERADOR DE CONTEXTO
 * (simplificado — depois você evolui)
 */
function generateContextHash(history) {
  return history.slice(-6).join("-");
}

/**
 * RESET COMPLETO DO CICLO
 */
function resetCycle() {
  state = STATES.IDLE;
  galeLevel = 0;
  currentContextHash = null;
  activeTargets = [];
  lastDecisionTimestamp = null;
}

/**
 * DISPARO DE ENTRADA
 */
function openEntry(contextHash) {
  state = STATES.ENTRY;
  galeLevel = 0;
  currentContextHash = contextHash;
  lastDecisionTimestamp = Date.now();

  // targets fictícios (exemplo)
  activeTargets = ["X", "X", "X"];

  console.log("🟢 ENTRADA LIBERADA");
  console.log("Targets:", activeTargets.join(" "));
}

/**
 * AVALIA RESULTADO DO SPIN
 */
function evaluateSpin(number) {
  // lógica mock de acerto
  return activeTargets.includes("X"); // você troca isso pela lógica real
}

/**
 * FINALIZA CICLO
 */
function finalize(result) {
  const nivel =
    state === STATES.ENTRY
      ? "entrada"
      : state === STATES.G1
      ? "1g"
      : state === STATES.G2
      ? "2g"
      : "3g";

  registerOutcome({
    operador: OPERADOR,
    contextoHash: currentContextHash,
    nivel,
    resultado: result
  });

  console.log(`📊 CICLO FINALIZADO: ${result.toUpperCase()}`);
  resetCycle();
}

/**
 * LOOP PRINCIPAL — CHAMADO PELO COLETOR
 */
export function onSpin(number, history) {
  const contextHash = generateContextHash(history);

  // ===============================
  // ESTADO IDLE → DECISÃO
  // ===============================
  if (state === STATES.IDLE) {
    const allow = shouldAllowEntry(OPERADOR, contextHash);

    if (allow) {
      openEntry(contextHash);
    } else {
      console.log("⏳ Aguardando melhor contexto");
    }
    return;
  }

  // ===============================
  // AVALIA RESULTADO
  // ===============================
  const hit = evaluateSpin(number);

  if (hit) {
    state = STATES.GREEN;
    finalize("green");
    return;
  }

  // ===============================
  // PROGRESSÃO DE GALE
  // ===============================
  galeLevel++;

  if (galeLevel === 1) {
    state = STATES.G1;
    console.log("⚠️ Indo para 1G");
    return;
  }

  if (galeLevel === 2) {
    state = STATES.G2;
    console.log("⚠️ Indo para 2G");
    return;
  }

  if (galeLevel === 3) {
    state = STATES.G3;
    console.log("⚠️ Indo para 3G");
    return;
  }

  // ===============================
  // LOSS
  // ===============================
  state = STATES.LOSS;
  finalize("loss");
}
