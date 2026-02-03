class DeltaEngine {
  constructor() {
    this.last = null;
  }

  /**
   * Retorna true APENAS se o número for novo
   */
  push(n) {
    if (n === this.last) return false;
    this.last = n;
    return true;
  }
}

module.exports = DeltaEngine;
