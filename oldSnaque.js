"use strict";

const MAX_CAPACITY = (1 << 30) | 0;
const MIN_CAPACITY = 16;
const X = 0;
const Y = 1;
const DIR = 2;

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
    if (isArray(capacity)) {
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

function Snaque(capacity) {
  this._capacity = toBinary(capacity);
  this._length = 0;
  this._head = 0;
  this._tail = 0;
  this._x = new Int32Array(this._capacity).fill(-1);
  this._y = new Int32Array(this._capacity).fill(-1);
  this._directions = new Int32Array(this._capacity).fill(-1);
}

Snaque.prototype._nextTailIdx = function Snaque$_nextTailIdx() {
  return (this._head + this._length) & (this._capacity - 1);
}

Snaque.prototype._getTailIdx = function Snaque$_getTailIdx() {
  return (this._head + this._length - 1) & (this._capacity - 1);
}

Snaque.prototype._nextHeadIdx = function Snaque$_nextHeadIdx() {
  return (this._head + 1) & (this._capacity - 1);
}

Snaque.prototype._prevHeadIdx = function Snaque$_prevHeadIdx() {
  let capacity = this._capacity;
  return ((((this._head - 1) & (capacity - 1)) ^ capacity) - capacity);
}

Snaque.prototype._getIdx = function Snaque$_getIdx(n) {
  return (this._head + n) & (this._capacity - 1);
}

Snaque.prototype.push = function Snaque$push(data) {
  let i = this._nextTailIdx();
  if (i > this._capacity || i < 0) {
    throw new RangeError('New index out of bounds. ', i);
  }
  this._x[i] = data[X];
  this._y[i] = data[Y];
  this._directions[i] = data[DIR];
  this._length += 1;
  this._tail = i;
  return this._length;
}

Snaque.prototype.pop = function Snaque$pop() {
  if (this._length === 0) {
    return [-1, -1, -1];
  }
  let i = this._getTailIdx();
  let ret = [this._x[i], this._y[i], this._directions[i]];
  this._x[i] = -1;
  this._y[i] = -1;
  this._directions[i] = -1;
  this._length -= 1;
  this._tail = this._getTailIdx();
  return ret;
}

Snaque.prototype.shift = function Snaque$shift() {
  if (this._length === 0) {
    return [-1, -1, -1];
  }
  let head = this._head;
  let ret = [this._x[head], this._y[head], this._directions[head]];
  this._x[head] = -1;
  this._y[head] = -1;
  this._directions[head] = -1;
  this._head = this._nextHeadIdx();
  this._length -= 1;
  return ret;
}

Snaque.prototype.unshift = function Snaque$unshift(data) {
  let capacity = this._capacity;
  let i = this._prevHeadIdx();
  if (i > capacity || i < 0) {
    throw new RangeError('New index out of bounds. ', i);
  }
  this._x[i] = data[X];
  this._y[i] = data[Y];
  this._directions[i] = data[DIR];
  this._length += 1;
  this._head = i;
  return length + 1;

}

Snaque.prototype.forEach = function Snaque$forEach(fn) {
  for (let n = 0; n < this._length; n++) {
    let i = this._getIdx(n);
    fn.call(this, [this._x[i], this._y[i], this._directions[i]], n, i, this);
  }
}

Snaque.prototype.every = function Snaque$every(fn) {
  let pass = true;
  for (let n = 0; n < this._length; n++) {
    let i = this._getIdx(n);
    let val = fn.call(this, [this._x[i], this._y[i], this._directions[i]], n, i, this);
    if (!val) {
      pass = false;
      break;
    }
  }
  return pass;
}

Snaque.prototype.everyFrom = function Snaque$everyFrom(fn, start) {
  let pass = true;
  for (let n = start || 0; n < this._length; n++) {
    let i = this._getIdx(n);
    let val = fn.call(this, [this._x[i], this._y[i], this._directions[i]], n, i, this);
    if (!val) {
      pass = false;
      break;
    }
  }
  return pass;
}

Snaque.prototype.findIndex = function Snaque$findIndex(fn) {
  let index = -1;
  for (let n = 0; n < this._length; n++) {
    let i = this._getIdx(n);
    let val = fn.call(this, [this._x[i], this._y[i], this._directions[i]], n, i, this);
    if (val) {
      index = i;
      break;
    }
  }
  return index;
}

Snaque.prototype.sliceFrom = function Snaque$sliceFrom(begin) {
  let sliced = [];
  let length = this._length;
  for (let n = 0; n < length; n++) {
    let i = this._getIdx(n);
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

Snaque.prototype.peekTail = function Snaque$peekTail() {
  if (this._length === 0) {
    return [-1, -1, -1];
  }
  return [this._x[this._tail], this._y[this._tail], this._directions[this._tail]];
};

Snaque.prototype.peekHead = function Snaque$peekHead() {
  if (this._length === 0) {
    return [-1, -1, -1];
  }
  return [this._x[this._head], this._y[this._head], this._directions[this._head]];
};


Snaque.prototype.get = function Snaque$get(index) {
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
  let i = this._getIdx(n);
  return [this._x[i], this._y[i], this._directions[i]];
};

Snaque.prototype.isEmpty = function Snaque$isEmpty() {
  return this._length === 0;
};

Snaque.prototype.clear = function Snaque$clear() {
  let len = this._length;
  let head = this._head;
  let capacity = this._capacity;
  for (let j = 0; j < len; ++j) {
    let i = this._getIdx(j);
    this._x[i] = -1;
    this._y[i] = -1;
    this._directions[i] = -1;
  }
  this._length = 0;
  this._head = 0;
  this._tail = 0;
};

Snaque.prototype.toArray = function Snaque$toArray() {
  let len = this._length;
  let ret = new Array(len);
  let head = this._head;
  let capacity = this._capacity;
  for (let j = 0; j < len; ++j) {
    let i = this._getIdx(j);
    ret[j] = [this.x[i], this.y[i], this._directions[i]];
  }
  return ret;
};

Snaque.prototype.toString = function Snaque$toString() {
  return this.toArray().toString();
};

Snaque.prototype.toJSON = Snaque.prototype.toArray;
Snaque.prototype.head = Snaque.prototype.peekHead;
Snaque.prototype.tail = Snaque.prototype.peekTail;

Object.defineProperties(Snaque.prototype, {
  length: {
    get() {
      return this._length;
    },
    set() {
      throw new RangeError('Length is an internal property, and cannot be set.');
    }
  },
  headIndex: {
    get() {
      return this._head;
    }
  },
  headDirection: {
    get() {
      return this._directions[this._head];
    }
  },
  tailIndex: {
    get() {
      return this._tail;
    }
  },
  capacity: {
    get() {
      return this._capacity;
    },
    set() {
      throw new RangeError('Capacity is an interal property and cannot be set.')
    }
  },
  segments: {
    get() {
      return this.toArray();
    }
  },
  x: {
    get() {
      return this._x;
    }
  },
  y: {
    get() {
      return this._y;
    }
  }
});

if (typeof exports !== "undefined") {
  module.exports = Snaque;
}
