"use strict";

const MAX_CAPACITY = (1 << 30) | 0;
const MIN_CAPACITY = 16;
const X = 0;
const Y = 1;
const DIR = 2;

const DEFAULT_DIRECTION = 1;
const DEFAULT_SPEED = 150;
const DEFAULT_COLOR = 'white';

function nearestPowerOf2(n) {
  n = n >>> 0;
  n = n - 1;
  n = n | (n >> 1);
  n = n | (n >> 2);
  n = n | (n >> 4);
  n = n | (n >> 8);
  n = n | (n >> 16);
  return n + 1;
}

function toBinary(capacity) {
  if (typeof capacity !== "number") {
    if (Array.isArray(capacity)) {
      capacity = capacity.length;
    }
    else {
      return MIN_CAPACITY;
    }
  }
  return nearestPowerOf2(
    Math.min(
      Math.max(MIN_CAPACITY, capacity), MAX_CAPACITY)
  );
}

class Snaque {
  constructor(options) {
    this._capacity = toBinary(options.capacity);
    this._length = 0;
    this._head = 0;
    this._tail = 0;
    this._x = new Int32Array(this._capacity).fill(-1);
    this._y = new Int32Array(this._capacity).fill(-1);
    this._directions = new Int32Array(this._capacity).fill(-1);
    this.speed = options.speed || DEFAULT_SPEED;
    this.direction = options.direction || DEFAULT_DIRECTION;
    this.color = options.color || DEFAULT_COLOR;
    this.frozen = options.frozen || 0;
    this.id = options.id;
  }

  _getNextTailIdx() {
    return (this._head + this._length) & (this._capacity - 1);
  }

  _getTailIdx() {
    return (this._head + this._length - 1) & (this._capacity - 1);
  }

  _getNextHeadIdx() {
    return (this._head + 1) & (this._capacity - 1);
  }

  _getPrevHeadIdx() {
    const capacity = this._capacity;
    return ((((this._head - 1) & (capacity - 1)) ^ capacity) - capacity);
  }

  _getIdx(n) {
    return (this._head + n) & (this._capacity - 1);
  }

  push(data) {
    const next = this._getNextTailIdx();
    if (next > this._capacity || next < 0) {
      throw new RangeError('New index out of bounds. ', i);
    }
    this._x[next] = data[X];
    this._y[next] = data[Y];
    this._directions[next] = data[DIR];
    this._length += 1;
    this._tail = next;
    return this._length;
  }

  pop() {
    if (this._length === 0) {
      return [-1, -1, -1];
    }
    const tail = this._getTailIdx();
    const ret = [this._x[tail], this._y[tail], this._directions[tail]];
    this._x[tail] = -1;
    this._y[tail] = -1;
    this._directions[tail] = -1;
    this._length -= 1;
    this._tail = this._getTailIdx();
    return ret;
  }

  shift() {
    if (this._length === 0) {
      return [-1, -1, -1];
    }
    const head = this._head;
    const ret = [this._x[head], this._y[head], this._directions[head]];
    this._x[head] = -1;
    this._y[head] = -1;
    this._directions[head] = -1;
    this._head = this._getNextHeadIdx();
    this._length -= 1;
    return ret;
  }

  unshift(data) {
    const capacity = this._capacity;
    const prevHead = this._getPrevHeadIdx();
    if (prevHead > capacity || prevHead < 0) {
      throw new RangeError('New index out of bounds. ', i);
    }
    this._x[prevHead] = data[X];
    this._y[prevHead] = data[Y];
    this._directions[prevHead] = data[DIR];
    this._length += 1;
    this._head = prevHead;
    return length + 1;
  }

  forEach(fn) {
    for (let n = 0; n < this._length; n++) {
      const i = this._getIdx(n);
      fn.call(this, [this._x[i], this._y[i], this._directions[i]], n, i, this);
    }
  }

  every(fn) {
    let pass = true;
    for (let n = 0; n < this._length; n++) {
      const i = this._getIdx(n);
      const val = fn.call(this, [this._x[i], this._y[i], this._directions[i]], n, i, this);
      if (!val) {
        pass = false;
        break;
      }
    }
    return pass;
  }

  everyAfter(fn, index) {
    let pass = true;
    for (let n = index || 0; n < this._length; n++) {
      const i = this._getIdx(n);
      const val = fn.call(this, [this._x[i], this._y[i], this._directions[i]], n, i, this);
      if (!val) {
        pass = false;
        break;
      }
    }
    return pass;
  }

  findIndex(fn) {
    let index = -1;
    for (let n = 0; n < this._length; n++) {
      const i = this._getIdx(n);
      const val = fn.call(this, [this._x[i], this._y[i], this._directions[i]], n, i, this);
      if (val) {
        index = i;
        break;
      }
    }
    return index;
  }

  sliceAfter(begin) {
    const sliced = [];
    const length = this._length;
    for (let n = 0; n < length; n++) {
      const i = this._getIdx(n);
      if (i >= begin) {
        sliced.push([this._x[i], this._y[i], this._directions[i]]);
        this._x[i] = -1;
        this._y[i] = -1;
        this._directions[i] = -1;
      }
    }
    this._length = length - sliced.length;
    return sliced;
  }

  peekTail() {
    if (this._length === 0) {
      return [-1, -1, -1];
    }
    return [this._x[this._tail], this._y[this._tail], this._directions[this._tail]];
  }

  peekHead() {
    if (this._length === 0) {
      return [-1, -1, -1];
    }
    return [this._x[this._head], this._y[this._head], this._directions[this._head]];
  }

  get(index) {
    let n = index;
    if ((n !== (n | 0))) {
      return [-1, -1, -1];
    }
    let len = this._length;
    if (n < 0) {
      n += len;
    }
    if (n < 0 || n >= len) {
      return [-1, -1, -1];
    }
    const i = this._getIdx(n);
    return [this._x[i], this._y[i], this._directions[i]];
  }

  clear() {
    const len = this._length;
    for (let j = 0; j < len; ++j) {
      const i = this._getIdx(j);
      this._x[i] = -1;
      this._y[i] = -1;
      this._directions[i] = -1;
    }
    this._length = 0;
    this._head = 0;
    this._tail = 0;
  }

  freeze() {
    this.frozen = 1;
    return this.frozen;
  }

  unfreeze() {
    this.frozen = 0;
    return this.frozen;
  }

  toArray() {
    const ret = [];
    this.forEach(segment => { ret.push(segment) });
    return ret;
  }

  toString() {
    return this.toArray().toString();
  }

  get capacity() {
    return this._capacity;
  }

  get length() {
    return this._length;
  }

  get headIndex() {
    return this._head;
  }

  get tailIndex() {
    return this._tail;
  }

}

if (typeof exports !== "undefined") {
  module.exports = Snaque;
}
