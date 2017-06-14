////////////////////////////////////////////////
// fast-list
////////////////////////////////////////////////

;(function() { // closure for web browsers

function Item (data, prev, next) {
  this.next = next
  if (next) next.prev = this
  this.prev = prev
  if (prev) prev.next = this
  this.data = data
}

function FastList () {
  if (!(this instanceof FastList)) return new FastList
  this._head = null
  this._tail = null
  this.length = 0
}

FastList.prototype =
{ push: function (data) {
    this._tail = new Item(data, this._tail, null)
    if (!this._head) this._head = this._tail
    this.length ++
  }

, pop: function () {
    if (this.length === 0) return undefined
    var t = this._tail
    this._tail = t.prev
    if (t.prev) {
      t.prev = this._tail.next = null
    }
    this.length --
    if (this.length === 1) this._head = this._tail
    else if (this.length === 0) this._head = this._tail = null
    return t.data
  }

, unshift: function (data) {
    this._head = new Item(data, null, this._head)
    if (!this._tail) this._tail = this._head
    this.length ++
  }

, shift: function () {
    if (this.length === 0) return undefined
    var h = this._head
    this._head = h.next
    if (h.next) {
      h.next = this._head.prev = null
    }
    this.length --
    if (this.length === 1) this._tail = this._head
    else if (this.length === 0) this._head = this._tail = null
    return h.data
  }

, item: function (n) {
    if (n < 0) n = this.length + n
    var h = this._head
    while (n-- > 0 && h) h = h.next
    return h ? h.data : undefined
  }

, slice: function (n, m) {
    if (!n) n = 0
    if (!m) m = this.length
    if (m < 0) m = this.length + m
    if (n < 0) n = this.length + n

    if (m === n) {
      return []
    }

    if (m < n) {
      throw new Error("invalid offset: "+n+","+m+" (length="+this.length+")")
    }

    var len = m - n
      , ret = new Array(len)
      , i = 0
      , h = this._head
    while (n-- > 0 && h) h = h.next
    while (i < len && h) {
      ret[i++] = h.data
      h = h.next
    }
    return ret
  }

, drop: function () {
    FastList.call(this)
  }

, forEach: function (fn, thisp) {
    var p = this._head
      , i = 0
      , len = this.length
    while (i < len && p) {
      fn.call(thisp || this, p.data, i, this)
      p = p.next
      i ++
    }
  }

, map: function (fn, thisp) {
    var n = new FastList()
    this.forEach(function (v, i, me) {
      n.push(fn.call(thisp || me, v, i, me))
    })
    return n
  }

, filter: function (fn, thisp) {
    var n = new FastList()
    this.forEach(function (v, i, me) {
      if (fn.call(thisp || me, v, i, me)) n.push(v)
    })
    return n
  }

, reduce: function (fn, val, thisp) {
    var i = 0
      , p = this._head
      , len = this.length
    if (!val) {
      i = 1
      val = p && p.data
      p = p && p.next
    }
    while (i < len && p) {
      val = fn.call(thisp || this, val, p.data, this)
      i ++
      p = p.next
    }
    return val
  }
, head: function() {
    return this._head.data;
  }
}

if ("undefined" !== typeof(exports)) module.exports = FastList
else if ("function" === typeof(define) && define.amd) {
  define("FastList", function() { return FastList })
} else (function () { return this })().FastList = FastList

})()

///////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////
// constants & defaults
///////////////////////////////////////////////////////////

const canvas = document.getElementById('snake-game');
const ctx = canvas.getContext("2d");
const RIGHT = 1;
const LEFT = 2;
const UP = 3;
const DOWN = 4;
const opposite = {
	[LEFT]: RIGHT,
	[RIGHT]: LEFT,
	[UP]: DOWN,
	[DOWN]: UP,
};
const controlsMap = {
	37: LEFT,
	38: UP,
	39: RIGHT,
	40: DOWN,
};
const directionMap = {
	[LEFT]: 37,
	[UP]: 38,
	[RIGHT]: 39,
	[DOWN]: 40
};
const width = 500;
const height = 500;
const cell = 10;
const MS_PER_UPDATE = 16;
const xIdx = 0;
const yIdx = 1;
let then = performance.now();
let running = 1;
let lag = 0.0;
let x = 250;
let y = 250;
let DEFAULT_SPEED = 150;
const MAX_SPEED = 50;
let direction = RIGHT;
canvas.height = height;
canvas.width = width;

////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
// snake
////////////////////////////////////////////////////////////////

function initSnake(length) {
  let startX = 250;
  let snake = new FastList();
  for(let i = 0; i < length; i++) {
    snake.push([startX - (i * 10), 250]);
  }
  snake.speed = DEFAULT_SPEED;
  snake.direction = RIGHT;
  return snake;
}

function drawSnake(snake, ctx) {
  ctx.fillStyle = 'white';
  snake.forEach(function(segment) {
    ctx.fillRect(segment[xIdx], segment[yIdx], cell, cell);
  });
}

function moveRight(snake) {
  let [x, y] = snake.head();
  if (x > width - (cell + cell)) running = 0;
  snake.unshift([x + cell, y]);
  snake.pop();
}
function moveLeft(snake) {
  let [x, y] = snake.head();
  if (x - cell < 0) running = 0;
  snake.unshift([x - cell, y]);
  snake.pop();
}
function moveUp(snake) {
  let [x, y] = snake.head();
  if (y - cell < 0) running = 0;
  snake.unshift([x, y - cell]);
  snake.pop();
}
function moveDown(snake) {
  let [x, y] = snake.head();
  if (y > height - (cell + cell)) running = 0;
  snake.unshift([x, y + cell]);
  snake.pop();
}

const moveSnake = {
  [RIGHT]: moveRight,
  [LEFT]: moveLeft,
  [UP]: moveUp,
  [DOWN]: moveDown,
}

function initSnakeUpdate() {
  let interval = 0;
  return function(snake, delta) {
    if (interval > snake.speed) {
      moveSnake[snake.direction](snake);
      interval = 0;
    }
    interval += delta;
  }
}

const updateSnake = initSnakeUpdate();

///////////////////////////////////////////////////////

///////////////////////////////////////////////////////
// controls
///////////////////////////////////////////////////////

function bindEvents() {
  document.addEventListener('keydown', function(event) {
    let key = event.keyCode;
    if (key === 32) running = 0;
    let vector = controlsMap[key];
    if (vector && vector !== opposite[direction]) {
      direction = vector;
    }
  });
}

function initSnakeControls() {
  return function(snake) {
    document.addEventListener('keydown', function(event) {
      let key = event.keyCode;
      if (key === 32) running = 0;
      let vector = controlsMap[key];
      if (vector && vector !== opposite[snake.direction]) {
        snake.direction = vector;
      }
    });
  }
}

const bindSnakeControls = initSnakeControls();

////////////////////////////////////////////////////////

////////////////////////////////////////////////////////
// game engine
////////////////////////////////////////////////////////

let snake = initSnake(5);

function clear() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,width, height);
};

function draw() {
  drawSnake(snake, ctx);
}

function update(delta) {
  updateSnake(snake, delta);
}

function main() {
  if (running < 1) return;

  requestAnimationFrame(main);
  let now = performance.now();
  let delta = now - then;
  then = now;
  lag += delta;
  while (lag >= MS_PER_UPDATE) {
    clear();
    update(delta);
    draw(delta);
    lag -= MS_PER_UPDATE;
  }
}

bindSnakeControls(snake);
main();