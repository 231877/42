var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use("/", express.static(__dirname + "/"));
players = {};

io.on('connection', socket => {
  socket.broadcast.emit('add_player', {
  	'id': socket.id,
  	'x': 64,
  	'y': 96
  });
  socket.emit('list', players);
  players[socket.id] = {
  	'x': 64,
  	'y': 96
  }
  socket.on('move', data => {
  	socket.broadcast.emit('move', {
  		'id': socket.id,
  		'x': data.x,
  		'y': data.y
  	});
  	players[socket.id] = {
	  	'x': data.x,
	  	'y': data.y
	  }
  });
  socket.on('disconnect', () => socket.broadcast.emit('delete_player', { 'id': socket.id }));
});

http.listen(3005, function(){
  console.log('listening on *:3000');
});