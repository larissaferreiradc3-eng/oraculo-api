import {
  ativarLeitura,
  onNumeroAposEvento
} from './signalEngine.js';

const Memory27 = require('./memory27');
const StateMachine = require('./stateMachine');
const SignalManager = require('./signalManager');
const HouseBlockReader = require('./houseBlockReader');

const memory27 = new Memory27();
const stateMachine = new StateMachine();
const signalManager = new SignalManager();
const houseReader = new HouseBlockReader();

function processNumber(n) {
  memory27.push(n);

  const stateSnapshot = stateMachine.step(n, memory27);
  const signal = signalManager.evaluate(stateSnapshot);

// EVENTO ESTRUTURANTE — 27
if (n === 27) {
  ativarLeitura(mesaId);
  return;
}

// APÓS EVENTO — alimenta leitura
onNumeroAposEvento(mesaId, n);


  let houseContext = null;

  // 🔑 leitura só acontece quando o campo está legível
  if (
    stateSnapshot.state === 'PRESSAO' ||
    stateSnapshot.state === 'RUPTURA' ||
    stateSnapshot.state === 'EXTENSAO'
  ) {
    houseContext = houseReader.read(memory27.values());
  }

  return {
    number: n,
    state: stateSnapshot.state,
    prevState: stateSnapshot.prevState,
    signal,
    houseContext
  };
}

module.exports = { processNumber };
