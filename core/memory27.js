class Memory27 {
  constructor(size = 27) {
    this.sizeLimit = size;
    this.buffer = [];
  }

  push(n) {
    if (this.buffer.length >= this.sizeLimit) {
      this.buffer.shift();
    }
    this.buffer.push(n);
  }

  values() {
    return [...this.buffer];
  }

  size() {
    return this.buffer.length;
  }

  isFull() {
    return this.buffer.length === this.sizeLimit;
  }
}

module.exports = Memory27;
