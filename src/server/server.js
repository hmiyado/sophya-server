var app = require('express');
var path = require('path');
var http = require('http');
var socketio = require('socket.io');
var express = require('express');
var async = require('async');

var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
var sockets = [];

io.on('connection', function (socket) {
    sockets.push(socket);
    console.log("a user connected");

    socket.on('disconnect', function () {
        console.log("user disconnected");

        // 対戦中断処理
        if(socket.room !== null){
            //対戦相手探す
            var opponent_socket
            //
            opponent_socket.emit('gameDisrupt',null);
        }

        sockets.splice(sockets.indexOf(socket), 1);
        updateRoster();
    });

    socket.on('enter_room', function (player_name) {
        console.log('player name:' + player_name);
        socket.name = String(player_name || 'Anonymous');
        updateRoster();
    });

    socket.on('match', function (opponent_player_id) {
        var new_room_id = Math.random().toString(36);
        var opponent_socket = searchSocketById(opponent_player_id);
        var is_fisrt_mover = ((Math.random() * 10 % 2 === 0) ? true : false);
        startNewMatch(new_room_id, socket, opponent_socket, is_fisrt_mover);
        startNewMatch(new_room_id, opponent_socket, socket, !is_fisrt_mover);
        updateRoster();
    });

    socket.on('move', function (data) {
        console.log(data.moveLog);
        console.log(data.room);
        io.sockets.to(data.room).emit('moveLog', data.moveLog);
    });

    socket.on('gameEnd', function (data) {
        io.to(data.room).emit('gameEnd', data.winner);
    });
});

function startNewMatch(room_id, socket, opponent_socket, isFirstMover) {
    console.log("start_match:" + socket.id);
    socket.join(room_id);
    socket.room = room_id;
    socket.emit('start_match', {
        room_id: room_id,
        opponent_player_id: opponent_socket.id,
        opponent_player_name: opponent_socket.name,
        is_first_mover: isFirstMover
    });
}

function searchSocketById(id) {
    for (var i = 0; i < sockets.length; i++) {
        if (sockets[i].id === id) {
            return sockets[i];
        }
    }
    return null;
}

function updateRoster() {
    async.map(sockets, function (socket, next) {
            console.log(socket.name);
            console.log(socket.id);
            console.log(socket.room);
            console.log(socket.room_id);
        if (socket.name == null || typeof socket.name == 'undefined' || typeof socket.room !== 'undefined') {

            next(null, null);
        }else{
            next(null, { name: socket.name, id: socket.id });
        }
    }, function (err, roster) {
        if(err){}
        var compactRoster=[];
        for(var i=0; i < roster.length; i++){
            if(roster[i] != null){
                compactRoster.push(roster[i]);
            }
        }
        broadcast('roster', compactRoster);
    });
}
function broadcast(event, data) {
    sockets.forEach(function (socket) {
        socket.emit(event, data);
    });
}

//process.env.PORT = 3000;
server.listen(process.env.PORT, function () {
    console.log("start server wiht port " + process.env.PORT);
});
//# sourceMappingURL=server.js.map
