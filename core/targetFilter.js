// targetFilter.js

class TargetFilter {
  constructor() {
    this.reset();
  }

  reset() {
    this.targets = new Map(); // numero -> contagem
    this.roundsObserved = 0;
    this.locked = false;
  }

  hasDigitTwo(number) {
    return number.toString().includes('2');
  }

  observe(number) {
    if (this.locked) return;

    this.roundsObserved++;

    if (!this.hasDigitTwo(number)) return;

    const count = this.targets.get(number) || 0;
    this.targets.set(number, count + 1);

    // trava se passar de 3 alvos
    if (this.targets.size > 3) {
      this.locked = true;
    }
  }

  getTargets() {
    return Array.from(this.targets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([num]) => num);
  }

  getProfile() {
    if (this.targets.size === 0) return 'AUSENCIA';

    if (this.targets.size === 1) return 'REPETICAO';

    if (this.targets.size === 2) return 'ALTERNANCIA';

    return 'DISPERSAO';
  }

  isConflicted() {
    return this.locked || this.targets.size > 3;
  }

  getStatus() {
    return {
      roundsObserved: this.roundsObserved,
      targets: this.getTargets(),
      profile: this.getProfile(),
      conflicted: this.isConflicted()
    };
  }
}

module.exports = TargetFilter;
