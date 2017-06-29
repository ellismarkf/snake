const fs = require('fs');
const path = require('path'); 
const express = require('express');
const helmet = require('helmet');
const parser = require('body-parser');
const PORT = process.env.PORT || 5000;
const width = 500;
const height = 500;

function placeFood() {
  return [
    Math.floor(Math.random() * width/10) * 10,
    Math.floor(Math.random() * height/10) * 10,
  ];
}

function buildHostInit(id) {
  return {
    startX: 250,
    startY: 250,
    speed: 250,
    direction: 1,
    length: 5,
    color: 'white',
    frozen: 0,
    id: id,
    player: 0,
  };
}

function buildGuestInit(id) {
  return {
    startX: 250,
    startY: 50,
    speed: 250,
    direction: 1,
    length: 5,
    color: 'blue',
    frozen: 0,
    id: id,
    player: 1,
  };
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
  socket.emit('connected');

  socket.on('create-game', function() {
    socket.emit('new-game-created', buildHostInit(socket.id.toString()));
    socket.join(socket.id.toString());
  });

  socket.on('join-game', function(room) {
    let host = buildHostInit(room);
    let guest = buildGuestInit(room);
    socket.emit('joined-game', guest, host);
    socket.join(room);
    socket.to(room).broadcast.emit('guest-joined-game', guest);
    io.to(room).emit('update-food-position', placeFood());
  });

  socket.on('pop-opponent', function(roomId) {
    socket.to(roomId).broadcast.emit('pop-hero');
  });
  socket.on('freeze-opponent', function(roomId) {
    socket.to(roomId).broadcast.emit('freeze-hero');
  });
  socket.on('unfreeze-opponent', function(roomId) {
    socket.to(roomId).broadcast.emit('unfreeze-hero');
  });
  socket.on('slice-opponent', function(roomId, index) {
    socket.to(roomId).broadcast.emit('slice-hero', index);
  });
  socket.on('accelerate-hero', function(roomId) {
    socket.to(roomId).broadcast.emit('accelerate-opponent');
  });
  socket.on('unshift-hero', function(roomId, data) {
    socket.to(roomId).broadcast.emit('unshift-opponent', data);
  });
  socket.on('pop-hero', function(roomId) {
    socket.to(roomId).broadcast.emit('pop-opponent');
  });
  socket.on('update-food-position', function(roomId, pos) {
    socket.to(roomId).broadcast.emit('update-food-position', pos);
  });
  socket.on('add-extra-food', function(roomId, coords) {
    socket.to(roomId).broadcast.emit('add-extra-food', coords);
  });
  socket.on('remove-extra-food', function(roomId, index) {
    socket.to(roomId).broadcast.emit('remove-extra-food', index);
  });
  socket.on('game-over:hero-self-destruct', function(roomId) {
    socket.to(roomId).broadcast.emit('game-over:opponent-self-destruct');
  });
  socket.on('game-over:heads-collide', function(roomId) {
    socket.to(roomId).broadcast.emit('game-over:MAD');
  });
  socket.on('game-over:hero-win', function(roomId) {
    socket.to(roomId).broadcast.emit('game-over:opponent-win');
  });
});

server.listen(PORT, () => {
  console.log('snake socket server lisenting on port', PORT);
});