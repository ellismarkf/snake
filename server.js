const fs = require('fs');
const path = require('path'); 
const express = require('express');
const helmet = require('helmet');
const parser = require('body-parser');
const PORT = process.env.PORT || 5000;

const dq = require('./dq');
 
let id = 1;
let snakeCount = 0;
let snakes = []; // array of two snake objects, reset when length > 2
let rooms = []; // array of ids
let games = []; // array of snakes<Array>
const DEFAULT_SPEED = 200;
const DEFAULT_DIRECTION = 1;
const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 500;
let width = DEFAULT_WIDTH;
let height = DEFAULT_HEIGHT;

function initSnake(init) {
  let startX = 250;
  let speed = init.speed || DEFAULT_SPEED;
  let length = init.length || 5;
  let color = init.color || 'white';
  let width = init.width || DEFAULT_WIDTH;
  let height = init.height || DEFAULT_HEIGHT;
  let snake = new dq((width * height) / 100);
  for(let i = 0; i < length; i++) {
    snake.push([startX - (i * 10), 250]);
  }
  snake.speed = speed;
  snake.direction = DEFAULT_DIRECTION;
  snake.color = color;
  snake.id = init.id || id;
  snakeCount++;
  return snake;
}

let food = [0,0]; // [x, y]
function placeFood() {
  return [
    Math.floor(Math.random() * width/10) * 10,
    Math.floor(Math.random() * height/10) * 10,
  ];
}

const app = express();
app.use(helmet());
app.use(parser.json());

app.use(express.static(__dirname));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

var server = require('http').createServer(app);
var io = require('socket.io')(server);

io.on('connection', function(socket) {
  if (snakeCount % 2 === 1) {

  }
  socket.emit('connected');
  if (snakes.length > 0) {
    socket.emit('init-opponent', snakes[0]);
  }
  socket.on('game-over', function() {
    socket.broadcast.emit('game-over');
  });
  socket.on('snake-request', function(data) {
    let snake;
    if (snakes.length > 0) {
      console.log('init second player snake');
      snake = initSnake(data);
      snakes.push(snake);
      socket.emit('init-player', {
        snake: snake,
        id: snake.id,
        direction: snake.direction,
        speed: snake.speed,
        front: snake._front,
        length: snake.length,
        color: snake.color,
        capacity: snake._capacity,
      });
      socket.broadcast.emit('init-opponent', {
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
      snake = initSnake(data);
      snakes.push(snake);
      socket.emit('init-player', {
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
  });
  socket.on('opponent-update', function(data) {
    socket.broadcast.emit('update-opponent', data);
  });
  socket.on('update-food-position', function() {
    io.emit('new-food', placeFood());
  });
});



server.listen(PORT, () => {
  console.log('snake socket server lisenting on port', PORT);
});