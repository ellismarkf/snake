const canvas = document.getElementById('snake-game');
const ctx = canvas.getContext("2d");
const RIGHT = 1;
const LEFT = 2;
const UP = 3;
const DOWN = 4;
const oppositeDirections = {
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
let then = performance.now();
let running = 1;
let lag = 0.0;
let elapsed = 0;
let x = 250;
let y = 250;
let speed = 3000;
const MAX_SPEED = 250;
let direction = RIGHT;
canvas.height = height;
canvas.width = width;

function moveRight() {
  if (x > width - (cell + cell)) running = 0;
  ctx.fillRect(x, y, cell, cell);
  x += cell;
}
function moveLeft() {
  if (x - cell < 0) running = 0;
  ctx.fillRect(x, y, cell, cell);
  x -= cell;
}
function moveUp() {
  if (y - cell < 0) running = 0;
  ctx.fillRect(x, y, cell, cell);
  y -= cell;
}
function moveDown() {
  if (y > height - (cell + cell)) running = 0;
  ctx.fillRect(x, y, cell, cell);
  y += cell;
}

const moveSnake = {
  [RIGHT]: moveRight,
  [LEFT]: moveLeft,
  [UP]: moveUp,
  [DOWN]: moveDown,
}

function clear() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,width, height);
};

function initDraw() {
  let timeStep = 0;
  return function(delta) {
    ctx.fillStyle = 'white';
    if (timeStep > speed) {
      moveSnake[direction]();
      timeStep = 0;
      let newSpeed = speed - 250;
      speed = newSpeed < MAX_SPEED ? MAX_SPEED : newSpeed;
    } else {
      ctx.fillRect(x,y,cell, cell);
    }
    timeStep += delta;
  };
}

let draw = initDraw();

function bindEvents() {
  document.addEventListener('keydown', function(event) {
    let key = event.keyCode;
    if (key === 32) running = 0;
    let vector = controlsMap[key];
    if (vector) {
      direction = vector;
    }
  });
}

function main() {
  if (running < 1) return;

  requestAnimationFrame(main);
  let now = performance.now();
  let delta = now - then;
  then = now;
  elapsed += delta;
  lag += delta;
  while (lag >= MS_PER_UPDATE) {
    clear();
    draw(delta);
    lag -= MS_PER_UPDATE;
  }
}

bindEvents();
main();