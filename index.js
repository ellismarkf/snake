///////////////////////////////////////////////////////////
// constants & defaults
///////////////////////////////////////////////////////////

const canvas = document.getElementById('snake-game');
const ctx = canvas.getContext("2d");
const socket = window.io();
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
let running = 0;
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

function initQSnake(init) {
  let startX = 250;
  let speed = init.speed || DEFAULT_SPEED;
  let length = init.length || 5;
  let color = init.color || 'white';
  let snake = new window.Deque((width * height) / 100);
  for(let i = 0; i < length; i++) {
    snake.push([startX - (i * 10), 250]);
  }
  snake.speed = speed || DEFAULT_SPEED;
  snake.direction = CURRENT_DIRECTION;
  snake.color = color;
  snake.id = snakeId;
  snakeId++;
  return snake;
}

function drawSnake(snake, ctx) {
  ctx.fillStyle = snake.color || 'green';
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
  const autoCannibalism = !snake.everyFrom(function(segment, index) {
    let [bX, bY] = segment;
    return !(selfCollision(x,y,bX,bY));
  }, 1);
  const boundaryViolation = outOfBounds(snake.direction, x, y);
  if (boundaryViolation || autoCannibalism) {
    console.log('game over');
    running = 0;
    socket.emit('game-over');
    return -1;
  }
  let [fX, fY] = food;
  snake.unshift(newHeadPos(snake.direction, x, y));
  if (x === fX && y === fY) {
    socket.emit('update-food-position');
    placeFood();
    snake.speed -= 10;
    socket.emit('opponent-update', {
      snake: snake,
      id: snake.id,
      direction: snake.direction,
      speed: snake.speed,
      front: snake._front,
      length: snake.length,
      color: snake.color,
      capacity: snake._capacity,
    });
  } else {
    snake.pop();
    socket.emit('opponent-update', {
      snake: snake,
      id: snake.id,
      direction: snake.direction,
      speed: snake.speed,
      front: snake._front,
      length: snake.length,
      color: snake.color,
      capacity: snake._capacity,
    });
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

let snake;
let opponent;
let updateSnake;
// let snake2 = initSnake({ length: 5, speed: 200, color: 'green' });

// let snakes = [snake];
// let updateFns = snakes.map(function(snake) {
//   return initSnakeUpdate();
// });

socket.on('connected', function() {
  // socket.emit('snake-request', { width, height });
});

socket.on('init-player', function(data) {
  // snake = initQSnake(data);
  // console.log('init-player');
});

socket.on('init-opponent', function(data) {
  // opponent = initQSnake(data);
  // console.log('init-opponent');
});

socket.on('update-opponent', function(data) {
  // opponent = data;
});

socket.on('game-over', function() { running = 0; });

function clear() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,width, height);
};

function draw() {
  drawFood(food, ctx);
  // drawSnake(opponent.snake, ctx);
  drawSnake(opponent, ctx);
  drawSnake(snake, ctx);
  // drawSnake(snake3, ctx);
}

function update(delta) {
  // for(let i = 0; i < snakes.length; i++) {
  //   updateFns[i](snakes[i], delta);
  // }
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
    draw();
    lag -= MS_PER_UPDATE;
  }
}

function initGame() {
  bindEvents();
  placeFood();
  console.log(snake);
  snake = initQSnake({});
  opponent = initQSnake({ length: 7, color: 'blue' });
  updateSnake = initSnakeUpdate(snake);
  then = performance.now();
  running = 1;
  main();
}

