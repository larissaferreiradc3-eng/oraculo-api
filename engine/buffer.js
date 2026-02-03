// buffer.js
class CircularBuffer {
  constructor(maxSize = 200) {
    this.maxSize = maxSize;
    this.buffer = [];
  }

  push(value) {
    this.buffer.unshift(value);

    if (this.buffer.length > this.maxSize) {
      this.buffer.pop();
    }
  }

  getAll() {
    return [...this.buffer];
  }

  getLast(n) {
    return this.buffer.slice(0, n);
  }

  getLatest() {
    return this.buffer[0] ?? null;
  }

  size() {
    return this.buffer.length;
  }

  clear() {
    this.buffer = [];
  }
}

module.exports = CircularBuffer;
