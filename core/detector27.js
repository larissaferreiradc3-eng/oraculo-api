// detector27.js

class Detector27 {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;      // existe um 27 ativo?
    this.round = 0;           // quantas rodadas após o 27
    this.triggerIndex = null; // posição no buffer (opcional)
  }

  onNewNumber(number) {
    // Se caiu 27, reinicia o gatilho
    if (number === 27) {
      this.active = true;
      this.round = 0;
      this.triggerIndex = Date.now(); // timestamp como identidade
      return {
        event: 'TRIGGER_27',
        round: 0
      };
    }

    // Se já existe um 27 ativo, avança a rodada
    if (this.active) {
      this.round += 1;

      return {
        event: 'POST_27',
        round: this.round
      };
    }

    return null;
  }

  isActive() {
    return this.active;
  }

  getRound() {
    return this.round;
  }

  isInsideWindow(min, max) {
    return this.active && this.round >= min && this.round <= max;
  }

  shouldExpire(maxRound = 8) {
    return this.active && this.round > maxRound;
  }
}

module.exports = Detector27;
