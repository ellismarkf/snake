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

, every: function (fn, start, thisp) {
    var p = start ? this._head.next : this._head
      , i = start || 0
      , len = this.length
      , pass = true;
    while (i < len && p) {
      let val = fn.call(this, p.data, i, this);
      if (val) {
        p = p.next
        i ++
      } else {
        pass = false;
        break;
      }
    }
    return pass;
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
let CURRENT_DIRECTION = RIGHT;
const width = 500;
const height = 500;
const cell = 10;
const MS_PER_UPDATE = 16;
const x = 0;
const y = 1;
let then = performance.now();
let running = 1;
let lag = 0.0;
let DEFAULT_SPEED = 150;
const MAX_SPEED = 50;
let direction = RIGHT;
canvas.height = height;
canvas.width = width;
let food = [0,0]; // [x, y]
let snakeId = 1;
////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
// food
////////////////////////////////////////////////////////////////

function placeFood() {
  food = [
    Math.floor(Math.random() * width/10) * 10,
    Math.floor(Math.random() * height/10) * 10,
  ];
  return food;
}

function drawFood(food, ctx) {
  const [x, y] = food;
  ctx.fillStyle = 'red';
  ctx.fillRect(x,y,cell,cell);
}


////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
// snake
////////////////////////////////////////////////////////////////

function initSnake(init) {
  let startX = 250;
  let snake = new FastList();
  let speed = init.speed || DEFAULT_SPEED;
  let length = init.length || 5;
  let color = init.color || 'white';
  for(let i = 0; i < length; i++) {
    snake.push([startX - (i * 10), 250]);
    // snake.push([0,0]);
  }
  snake.speed = speed || DEFAULT_SPEED;
  snake.direction = CURRENT_DIRECTION;
  snake.color = color;
  snake.id = snakeId;
  snakeId++;
  return snake;
}

function drawSnake(snake, ctx) {
  ctx.fillStyle = snake.color;
  snake.forEach(function(segment) {
    ctx.fillRect(segment[x], segment[y], cell, cell);
  });
}

function outOfBounds(direction, x, y) {
  switch(direction) {
    case RIGHT:
      return x > width - (cell * 2);
    case LEFT:
      return x - cell < 0;
    case UP:
      return y - cell < 0;
    case DOWN:
      return y > height - (cell * 2);
   default:
    return false;
  }
}

function newHeadPos(direction, x, y) {
  switch(direction) {
    case RIGHT:
      return [x + cell, y];
    case LEFT:
      return [x - cell, y];
    case UP:
      return [x, y - cell];
    case DOWN:
      return [x, y + cell];
   default:
    return [x, y];
  }
}

function selfCollision(x,y,bX,bY) {
  return x === bX && y === bY;
}

function advance(snake) {
  let [x, y] = snake.head();
  const autoCannibalism = !snake.every(function(segment, index) {
    let [bX, bY] = segment;
    return !(selfCollision(x,y,bX,bY));
  }, 1);
  if (
    outOfBounds(snake.direction, x, y)
    || autoCannibalism
  ) {
    console.log('game over');
    running = 0;
    return -1;
  }
  let [fX, fY] = food;
  snake.unshift(newHeadPos(snake.direction, x, y));
  if (x === fX && y === fY) {
    placeFood();
    snake.speed -= 10;
  } else {
    snake.pop();
  }
}

function processInput(snake) {
  if (CURRENT_DIRECTION !== opposite[snake.direction]) {
    snake.direction = CURRENT_DIRECTION;
  }
}

function initSnakeUpdate() {
  let interval = 0;
  return function(snake, delta) {
    if (interval > snake.speed) {
      processInput(snake);
      advance(snake);
      interval = 0;
    }
    interval += delta;
  }
}

///////////////////////////////////////////////////////

///////////////////////////////////////////////////////
// controls
///////////////////////////////////////////////////////

function bindEvents() {
  document.addEventListener('keydown', function(event) {
    let key = event.keyCode;
    if (key === 32) running = 0;
    let vector = controlsMap[key];
    if (vector) CURRENT_DIRECTION = vector;
  });
}

////////////////////////////////////////////////////////

////////////////////////////////////////////////////////
// game engine
////////////////////////////////////////////////////////

let snake = initSnake({ length: 5, speed: 200, color: 'blue' });
let snake2 = initSnake({ length: 5, speed: 200, color: 'green' });
let snakes = [snake];
let updateFns = snakes.map(function(snake) {
  return initSnakeUpdate();
});

function clear() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,width, height);
};

function draw() {
  drawFood(food, ctx);
  drawSnake(snake, ctx);
  drawSnake(snake2, ctx);
}

function update(delta) {
  for(let i = 0; i < snakes.length; i++) {
    updateFns[i](snakes[i], delta);
  }
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
    draw();
    lag -= MS_PER_UPDATE;
  }
}

bindEvents();
placeFood();
main();
