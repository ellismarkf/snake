///////////////////////////////////////////////////////////
// constants & defaults
///////////////////////////////////////////////////////////

const canvas = document.getElementById('snake-game');
const ctx = canvas.getContext("2d");
const startBtn = document.getElementById('start');
const createBtn = document.getElementById('create');
const joinBtn = document.getElementById('join');
const heroSprite = new Image();
heroSprite.src = './sprite.gif';
const oppntSprite = new Image();
oppntSprite.src = './pink.gif';
const sprites = [heroSprite, oppntSprite];

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
let then = performance.now();
let running = 0;
let lag = 0.0;
let DEFAULT_SPEED = 150;
const MAX_SPEED = 50;
let direction = RIGHT;
canvas.height = height;
canvas.width = width;
let snakeId = 0;
let gameId;

let hostOpts;
let guestOpts;

let hero;
let opponent;
let updateSnake;
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

function initSnake(init) {
  let startX = init.startX || 250;
  let startY = init.startY || 250
  let speed = init.speed || DEFAULT_SPEED;
  let direction = init.direction || CURRENT_DIRECTION;
  let length = init.length || 5;
  let color = init.color || 'white';
  let frozen = init.frozen || 0;
  let id = init.id || snakeId;
  let snake = new window.Snaque((width * height) / 100);
  for(let i = 0; i < length; i++) {
    snake.push([startX - (i * 10), startY, CURRENT_DIRECTION]);
  }
  snake.speed = speed;
  snake.direction = CURRENT_DIRECTION;
  snake.color = color;
  snake.id = id;
  snake.player = init.player;
  return snake;
}

function pincers(direction,x,y) {
  switch(direction) {
    case RIGHT:
      return [x + (cell - 2), y - 2, 370, 110, 150, 10, 13.6];
    case LEFT:
      return [x - (cell - 2), y - 2, 110, 110, 150, 10, 13.6];
    case UP:
      return [x - 2, y - (cell - 2), 000, 150, 110, 13.6, 10];
    case DOWN:
      return [x - 2, y + (cell - 2), 260, 150, 110, 13.6, 10];
   default:
    return [x - 2, y - (cell - 2), 000, 150, 110, 13.6, 10];
  }
}

function rattler(direction,x,y) {
  switch(direction) {
    case RIGHT:
      return [x - (cell - 2), y + 1, 2550, 90, 90, 8.18, 8.18];
    case LEFT:
      return [x + cell, y + 1, 2370, 90, 90, 8.18, 8.18];
    case UP:
      return [x + 1, y + cell, 2280, 90, 90, 8.18, 8.18];
    case DOWN:
      return [x + 1, y - (cell - 2), 2460, 90, 90, 8.18, 8.18];
   default:
    return [x + 1, y + cell, 2280, 90, 90, 8.18, 8.18];
  }
}

function headOffset(direction) {
  switch(direction) {
    case RIGHT:
      return 850;
    case LEFT:
      return 630;
    case UP:
      return 520;
    case DOWN:
      return 740;
   default:
    return 520;
  }
}

function evenBodyOffset(direction) {
  switch(direction) {
    case RIGHT:
      return 1290;
    case LEFT:
      return 1070;
    case UP:
      return 960;
    case DOWN:
      return 1180;
   default:
    return 960;
  }
}

function oddBodyOffset(direction) {
  switch(direction) {
    case RIGHT:
      return 1730;
    case LEFT:
      return 1510;
    case UP:
      return 1400;
    case DOWN:
      return 1620;
   default:
    return 1400;
  }
}

function tailOffset(direction) {
  switch(direction) {
    case RIGHT:
      return 2170;
    case LEFT:
      return 1950;
    case UP:
      return 1840;
    case DOWN:
      return 2060;
   default:
    return 1840;
  }
}

const sX = 0;
const w = 110;
const h = 110;
const dW = cell;
const dH = cell;

function drawSnake(snake, ctx) {
  // ctx.fillStyle = snake.color || 'green';
  let sprite = sprites[snake.player];
  snake.forEach(function(segment, index) {
    // ctx.fillRect(segment[0], segment[1], cell, cell);
    const [x,y,dir] = segment;
    if (index === 0) {
      const [pX,pY,psY,psW,psH,pdW,pdH] = pincers(dir,x,y);
      const sY = headOffset(dir);
      ctx.drawImage(sprite, sX,sY,w,h,x,y,dW,dH);
      ctx.drawImage(sprite, sX,psY,psW,psH,pX,pY,pdW,pdH);
      return 1;
    }
    if (index === snake.length - 1) {
      const [rX,rY,rsY,rsW,rsH,rdW,rdH] = rattler(dir,x,y);
      const sY = tailOffset(dir);
      ctx.drawImage(sprite, sX,sY,w,h,x,y,dW,dH);
      ctx.drawImage(sprite, sX,rsY,rsW,rsH,rX,rY,rdW,rdH);
      return 1;
    }
    if (index > 0 && index % 2 === 0) {
      const sY = evenBodyOffset(dir);
      ctx.drawImage(sprite, sX,sY,w,h,x,y,dW,dH);
      return 1;
    }
    const sY = oddBodyOffset(dir);
    ctx.drawImage(sprite, sX,sY,w,h,x,y,dW,dH);
    return 1;
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
    socket.emit('game-over:hero-self-destruct', gameId);
    alert('You self-destructed.  You lose.');
    return -1;
  }
  const opponentCollisionIdx = opponent.findIndex(function(segment) {
    let [bX, bY] = segment;
    return collision(x,y,bX,bY);
  });
  if (opponent.frozen && opponentCollisionIdx < 0) {
    socket.emit('unfreeze-opponent', gameId);
    opponent.frozen = 0;
  }
  if (opponentCollisionIdx === opponent.headIndex && snake.direction !== opponent.headDirection) {
    running = 0;
    console.log('game over - heads collide!');
    socket.emit('game-over:heads-collide', gameId);
    return -1;
  }
  if (opponentCollisionIdx === opponent.tailIndex) {
    if (!opponent.frozen) {
      socket.emit('freeze-opponent', gameId);
      opponent.frozen = 1;
    }
    if (opponent.tailIndex === opponent.headIndex) {
      running = 0;
      console.log('game over - hero ate opponent and won the game!');
      socket.emit('game-over:hero-win', gameId);
      alert('You ate your opponent and gained his strength. You win!');
      return -1;
    } else {
      socket.emit('pop-opponent', gameId);
      socket.emit('unshift-hero', gameId, newHeadPos(snake.direction,x,y));
      socket.emit('accelerate-hero', gameId);
      opponent.pop();
      snake.unshift(newHeadPos(snake.direction, x, y));
      snake.speed -= 10;
      return 1;
    }
  }
  if (opponentCollisionIdx > -1) {
    socket.emit('slice-opponent', gameId, opponentCollisionIdx);
    let sliced = opponent.sliceFrom(opponentCollisionIdx);
    opponent.speed += sliced.length * 10;
    for (let i = 1; i < sliced.length; i++) {
      socket.emit('add-extra-food', gameId, sliced[i])
      foodLength++;
      food[foodLength] = sliced[i];
    }
  }
  socket.emit('unshift-hero', gameId, newHeadPos(snake.direction,x,y));
  snake.unshift(newHeadPos(snake.direction, x, y));
  let fIdx = food.findIndex(function(food) {
    return collision(x,y,food[0],food[1])
  });
  if (fIdx > -1) {
    const [fX, fY] = food[fIdx];
    if (fIdx === 0) {
      let newFoodPos = placeFood();
      socket.emit('update-food-position', gameId, newFoodPos);
      socket.emit('accelerate-hero', gameId)
      food[0] = newFoodPos;
      snake.speed -= 10;
    } else {
      socket.emit('remove-extra-food', gameId, fIdx);
      socket.emit('accelerate-hero', gameId);
      food[fIdx] = 0;
      foodLength--;
      snake.speed -= 10;
    }
  } else {
    socket.emit('pop-hero', gameId);
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
    if (snake.frozen) return;
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

socket.on('connected', function() {
  console.log('You are connected!');
});

socket.on('pop-hero', function() {
  hero.pop();
});

socket.on('freeze-hero', function() {
  hero.frozen = 1;
});

socket.on('unfreeze-hero', function() {
  hero.frozen = 0;
});

socket.on('slice-hero', function(index) {
  let sliced = hero.sliceFrom(index);
  hero.speed += sliced.length * 10;
});

socket.on('accelerate-opponent', function() {
  opponent.speed -= 10;
});

socket.on('pop-opponent', function() {
  opponent.pop();
});

socket.on('unshift-opponent', function(data) {
  opponent.unshift(data);
});

socket.on('update-food-position', function(data) {
  food[0] = data;
});

socket.on('add-extra-food', function(coords) {
  foodLength++;
  food[foodLength] = coords;
});

socket.on('remove-extra-food', function(index) {
  food[index] = 0;
  foodLength--;
});

socket.on('game-over:opponent-self-destruct', function() {
  running = 0;
  alert('Opponent self-destructed. You win!');
});

socket.on('game-over:MAD', function() {
  running = 0;
  alert('Are you crazy?? You played chicken and everybody lost.');
});

socket.on('game-over:opponent-win', function() {
  running = 0;
  alert('Opponent ate you.  You lose.');
});

function clear() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,width, height);
};

function draw() {
  drawFood(food, ctx);
  if (hero.frozen) {
    drawSnake(hero, ctx);
    drawSnake(opponent, ctx);
    return 1;
  }
  if (opponent.frozen) {
    drawSnake(opponent, ctx);
    drawSnake(hero, ctx);
    return 1;
  }
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
  updateSnake = initSnakeUpdate(hero);
  then = performance.now();
  running = 1;
  main();
}

function createGame() {
  socket.emit('create-game');
};

function joinGame(gameId) {
  socket.emit('join-game', gameId);
};

startBtn.addEventListener('click', function(e) {
  initGame();
});
createBtn.addEventListener('click', function(e) {
  createGame();
});
joinBtn.addEventListener('click', function(e) {
  const roomId = prompt(
    "Enter the game ID of the game you'd like to join."
  );
  if (roomId) {
    joinGame(roomId)
    gameId = roomId;
  }
});
socket.on('new-game-created', function(init) {
  const roomId = prompt(
    'New game successfully created!\n' +
    'Share the following game ID with a friend:',
    socket.id
  );
  if (roomId) {
    gameId = roomId;
    hero = initSnake(init);
  }
});

socket.on('guest-joined-game', function(init) {
  opponent = initSnake(init);
});

socket.on('joined-game', function(heroInit, opponentInit) {
  hero = initSnake(heroInit);
  opponent = initSnake(opponentInit);
});
