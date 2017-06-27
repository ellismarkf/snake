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
	[DOWN]: 40,
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
let snakeId = 1;
////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
// food
////////////////////////////////////////////////////////////////
let food = new Array(50); // array of food coordinates [x, y]
for (let i = 0; i < food.length; i++) {
  food[i] = 0;
}
let foodLength = 0;

function placeFood() {
  return [
    Math.floor(Math.random() * width/10) * 10,
    Math.floor(Math.random() * height/10) * 10,
  ];
}

function drawFood(food, ctx) {
  for (let i = 0; i < food.length; i++) {
    if (food[i] === 0) continue;
    const [x, y] = food[i];
    ctx.fillStyle = 'red';
    ctx.fillRect(x,y,cell,cell);
  }
}


////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////
// snake
////////////////////////////////////////////////////////////////

function initSnake(opts) {
  let startX = 250;
  let speed = opts.speed || DEFAULT_SPEED;
  let length = opts.length || 5;
  let color = opts.color || 'white';
  let snake = new window.Snaque((width * height) / 100);
  for(let i = 0; i < length; i++) {
    snake.push([startX - (i * 10), 250, CURRENT_DIRECTION]);
  }
  snake.speed = speed;
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
      return [x + cell, y, direction];
    case LEFT:
      return [x - cell, y, direction];
    case UP:
      return [x, y - cell, direction];
    case DOWN:
      return [x, y + cell, direction];
   default:
    return [x, y, direction];
  }
}

function collision(x,y,bX,bY) {
  return x === bX && y === bY;
}

function logTick(x,y,hX,hY,tX,tY) {
  console.log('tick\n' + 'head[x, y]: ' + `[${x}, ${y}]\n` + 'heroHead[x, y]: ' + `[${hX}, ${hY}]\n` + 'heroTail[x, y]: ' + `[${tX}, ${tY}]`);
}

function advance(snake) {
  let [x, y] = snake.head();
  let [oX, oY] = opponent.head();
  const autoCannibalism = !snake.everyFrom(function(segment) {
    let [bX, bY] = segment;
    return !(collision(x,y,bX,bY));
  }, 1);
  const boundaryViolation = outOfBounds(snake.direction, x, y);
  if (boundaryViolation || autoCannibalism) {
    running = 0;
    console.log('game over - hero self destruct');
    socket.emit('game-over:self-destruct');
    return -1;
  }
  const opponentCollisionIdx = opponent.findIndex(function(segment) {
    let [bX, bY] = segment;
    return collision(x,y,bX,bY);
  });
  if (opponent.frozen && opponentCollisionIdx < 0) {
    opponent.frozen = 0;
  }
  if (opponentCollisionIdx === opponent.headIndex && snake.direction !== opponent.direction) {
    running = 0;
    console.log('game over - heads collide!');
    socket.emit('game-over:heads-collide');
    return -1;
  }
  if (opponentCollisionIdx === opponent.tailIndex) {
    if (!opponent.frozen) {
      opponent.frozen = 1;
    }
    if (opponent.tailIndex === opponent.headIndex) {
      running = 0;
      console.log('game over - hero ate opponent and won the game!');
      socket.emit('game-over:hero-win');
      return -1;
    } else {
      opponent.pop();
      // socket.emit('hero-eating');
      snake.unshift(newHeadPos(snake.direction, x, y));
      snake.speed -= 10;
      return 1;
    }
  }
  if (opponentCollisionIdx > -1) {
    let sliced = opponent.sliceFrom(opponentCollisionIdx);
    opponent.speed += sliced.length * 10;
    for (let i = 1; i < sliced.length; i++) {
      foodLength++;
      food[foodLength] = sliced[i];
    }
  }
  snake.unshift(newHeadPos(snake.direction, x, y));
  let fIdx = food.findIndex(function(food) {
    return collision(x,y,food[0],food[1])
  });
  if (fIdx > -1) {
    const [fX, fY] = food[fIdx];
    if (fIdx === 0) {
      food[0] = placeFood();
      // socket.emit('update-food-position');
      snake.speed -= 10;
    } else {
      food[fIdx] = 0;
      foodLength--;
      // socket.emit('update-food-position');
      snake.speed -= 10;
      // socket.emit('opponent-update', [snake.x, snake.y]);
    }
  } else {
    snake.pop();
    // socket.emit('opponent-update', [snake.x, snake.y]);

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

function bindLocalTwoPlayerEvents() {
  document.addEventListener('keydown', function(event) {
    let key = event.keyCode;
    if (key === 32) running = 0;
    let snakeVector = controlsMap[key];
    let opponentVector = o_controlsMap[key];
    if (snakeVector) CURRENT_DIRECTION = snakeVector;
    if (opponentVector) OPPONENT_DIRECTION = opponentVector;
  });
}

////////////////////////////////////////////////////////

////////////////////////////////////////////////////////
// game engine
////////////////////////////////////////////////////////

let hero;
let opponent;
let updateSnake;

socket.on('connected', function() {
  // socket.emit('snake-request', { width, height });
});

socket.on('init-player', function(data) {
  // snake = initSnake(data);
  // console.log('init-player');
});

socket.on('init-opponent', function(data) {
  // opponent = initSnake(data);
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
  drawSnake(hero, ctx);
}

function update(delta) {
  updateSnake(hero, delta);
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
  // bindLocalTwoPlayerEvents();
  food[foodLength] = placeFood();
  hero = initSnake({});
  // opponent = initOpponent({ length: 7, color: 'blue' });
  updateSnake = initSnakeUpdate(hero);
  then = performance.now();
  running = 1;
  main();
}

