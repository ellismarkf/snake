"use strict";

const DEQUE_MAX_CAPACITY = (1 << 30) | 0;
const DEQUE_MIN_CAPACITY = 16;

var isArray = Array.isArray;

function arrayMove(src, srcIndex, dst, dstIndex, len) {
    for (var j = 0; j < len; ++j) {
        dst[j + dstIndex] = src[j + srcIndex];
        src[j + srcIndex] = void 0;
    }
}

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
            return DEQUE_MIN_CAPACITY;
        }
    }
    return nearestPowerOf2(
        Math.min(
            Math.max(DEQUE_MIN_CAPACITY, capacity), DEQUE_MAX_CAPACITY)
    );
}


function Deque(capacity) {
    this._capacity = toBinary(capacity);
    this._length = 0;
    this._front = 0;
    if (isArray(capacity)) {
        var len = capacity.length;
        for (var i = 0; i < len; ++i) {
            this[i] = capacity[i];
        }
        this._length = len;
    }
}

Deque.prototype.toArray = function Deque$toArray() {
    var len = this._length;
    var ret = new Array(len);
    var front = this._front;
    var capacity = this._capacity;
    for (var j = 0; j < len; ++j) {
        ret[j] = this[(front + j) & (capacity - 1)];
    }
    return ret;
};

Deque.prototype.push = function Deque$push(item) {
    var argsLength = arguments.length;
    var length = this._length;
    if (argsLength > 1) {
        var capacity = this._capacity;
        if (length + argsLength > capacity) {
            for (var i = 0; i < argsLength; ++i) {
                this._checkCapacity(length + 1);
                var j = (this._front + length) & (this._capacity - 1);
                this[j] = arguments[i];
                length++;
                this._length = length;
            }
            return length;
        }
        else {
            var j = this._front;
            for (var i = 0; i < argsLength; ++i) {
                this[(j + length) & (capacity - 1)] = arguments[i];
                j++;
            }
            this._length = length + argsLength;
            return length + argsLength;
        }

    }

    if (argsLength === 0) return length;

    this._checkCapacity(length + 1);
    var i = (this._front + length) & (this._capacity - 1);
    this[i] = item;
    this._length = length + 1;
    return length + 1;
};

Deque.prototype.pop = function Deque$pop() {
    var length = this._length;
    if (length === 0) {
        return void 0;
    }
    var i = (this._front + length - 1) & (this._capacity - 1);
    var ret = this[i];
    this[i] = void 0;
    this._length = length - 1;
    return ret;
};

Deque.prototype.shift = function Deque$shift() {
    var length = this._length;
    if (length === 0) {
        return void 0;
    }
    var front = this._front;
    var ret = this[front];
    this[front] = void 0;
    this._front = (front + 1) & (this._capacity - 1);
    this._length = length - 1;
    return ret;
};

Deque.prototype.unshift = function Deque$unshift(item) {
    var length = this._length;
    var argsLength = arguments.length;


    if (argsLength > 1) {
        var capacity = this._capacity;
        if (length + argsLength > capacity) {
            for (var i = argsLength - 1; i >= 0; i--) {
                this._checkCapacity(length + 1);
                var capacity = this._capacity;
                var j = (((( this._front - 1 ) &
                    ( capacity - 1) ) ^ capacity ) - capacity );
                this[j] = arguments[i];
                length++;
                this._length = length;
                this._front = j;
            }
            return length;
        }
        else {
            var front = this._front;
            for (var i = argsLength - 1; i >= 0; i--) {
                var j = (((( front - 1 ) &
                    ( capacity - 1) ) ^ capacity ) - capacity );
                this[j] = arguments[i];
                front = j;
            }
            this._front = front;
            this._length = length + argsLength;
            return length + argsLength;
        }
    }

    if (argsLength === 0) return length;

    this._checkCapacity(length + 1);
    var capacity = this._capacity;
    var i = (((( this._front - 1 ) & ( capacity - 1) ) ^ capacity ) - capacity );
    this[i] = item;
    this._length = length + 1;
    this._front = i;
    return length + 1;
};

Deque.prototype.forEach = function Deque$forEach(fn) {
  for (var n = 0; n < this._length; n++) {
    var i = (this._front + n) & (this._capacity - 1);
    fn.call(this, this[i], n, i, this);
  }
}

Deque.prototype.every = function Deque$every(fn) {
  let pass = true;
  for (var n = 0; n < this._length; n++) {
    var i = (this._front + n) & (this._capacity - 1);
    let val = fn.call(this, this[i], n, i, this);
    if (!val) {
      pass = false;
      break;
    }
  }
  return pass;
}

Deque.prototype.everyFrom = function Deque$everyFrom(fn, start) {
  let pass = true;
  for (var n = start || 0; n < this._length; n++) {
    var i = (this._front + n) & (this._capacity - 1);
    let val = fn.call(this, this[i], n, i, this);
    if (!val) {
      pass = false;
      break;
    }
  }
  return pass;
}

Deque.prototype.findIndex = function Deque$findIndex(fn) {
  let index = -1;
  for (var n = 0; n < this._length; n++) {
    var i = (this._front + n) & (this._capacity - 1);
    let val = fn.call(this, this[i], n, i, this);
    if (val) {
      index = i;
      break;
    }
  }
  return index;
}

Deque.prototype.sliceFrom = function Deque$sliceFrom(begin) {
  let sliced = [];
  let length = this._length;
  for (var n = 0; n < this._length; n++) {
    var i = (this._front + n) & (this._capacity - 1);
    if (i >= begin) {
      sliced.push(this[i]);
      this[i] = void 0;
      // this._length = length - 1;
    }
  }
  this._length = length - sliced.length;
  return sliced;
}

Deque.prototype.peekBack = function Deque$peekBack() {
  var length = this._length;
  if (length === 0) {
    return void 0;
  }
  var index = (this._front + length - 1) & (this._capacity - 1);
  return this[index];
};

Deque.prototype.peekFront = function Deque$peekFront() {
  if (this._length === 0) {
    return void 0;
  }
  return this[this._front];
};

Deque.prototype.get = function Deque$get(index) {
  var i = index;
  if ((i !== (i | 0))) {
    return void 0;
  }
  var len = this._length;
  if (i < 0) {
    i = i + len;
  }
  if (i < 0 || i >= len) {
    return void 0;
  }
  return this[(this._front + i) & (this._capacity - 1)];
};

Deque.prototype.isEmpty = function Deque$isEmpty() {
    return this._length === 0;
};

Deque.prototype.clear = function Deque$clear() {
  var len = this._length;
  var front = this._front;
  var capacity = this._capacity;
  for (var j = 0; j < len; ++j) {
    this[(front + j) & (capacity - 1)] = void 0;
  }
  this._length = 0;
  this._front = 0;
};

Deque.prototype.toString = function Deque$toString() {
    return this.toArray().toString();
};

Deque.prototype.valueOf = Deque.prototype.toString;
Deque.prototype.removeFront = Deque.prototype.shift;
Deque.prototype.removeBack = Deque.prototype.pop;
Deque.prototype.insertFront = Deque.prototype.unshift;
Deque.prototype.insertBack = Deque.prototype.push;
Deque.prototype.enqueue = Deque.prototype.push;
Deque.prototype.dequeue = Deque.prototype.shift;
Deque.prototype.toJSON = Deque.prototype.toArray;
Deque.prototype.head = Deque.prototype.peekFront;

Object.defineProperty(Deque.prototype, "length", {
  get: function() {
    return this._length;
  },
  set: function() {
    throw new RangeError("");
  }
});

Deque.prototype._checkCapacity = function Deque$_checkCapacity(size) {
  if (this._capacity < size) {
    this._resizeTo(toBinary(this._capacity * 1.5 + 16));
  }
};

Deque.prototype._resizeTo = function Deque$_resizeTo(capacity) {
  var oldCapacity = this._capacity;
  this._capacity = capacity;
  var front = this._front;
  var length = this._length;
  if (front + length > oldCapacity) {
    var moveItemsCount = (front + length) & (oldCapacity - 1);
    arrayMove(this, 0, this, oldCapacity, moveItemsCount);
  }
};

if (typeof exports !== "undefined") {
  module.exports = Deque;
}
