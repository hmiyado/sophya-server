/// <reference path="../../typings/index.d.ts"/>

import * as express from 'express';
import * as path from 'path';
import * as http from 'http';
import * as socketio from 'socket.io';
import * as async from 'async';

const  router = express();
const  server = http.createServer(router);
const io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
const sockets: Array<SocketWithRoom> = [];

interface SocketWithRoom extends SocketIO.Socket{
  room: string,
  name: string
}

io.on('connection', (socket: SocketWithRoom) => {
    sockets.push(socket);
    console.log("a user connected");

    socket.on('disconnect', function () {
        console.log("user disconnected");

        //TODO(20160713) 対戦中断処理
        if(socket.room !== null){
            //対戦相手探す
            // const opponent_socket: SocketIO.Socket;
            //
            // opponent_socket.emit('gameDisrupt',null);
        }

        sockets.splice(sockets.indexOf(socket), 1);
        updateRoster();
    });

    socket.on('enter_room', (player_name: string) => {
        console.log('player name:' + player_name);
        socket.name = String(player_name || 'Anonymous');
        updateRoster();
    });

    socket.on('match', (opponentPlayerId: string) => {
        const newRoomId = Math.random().toString(36);
        const opponentSocket: SocketWithRoom = searchSocketById(opponentPlayerId);
        const isFisrtMover = ((Math.random() * 10 % 2 === 0) ? true : false);
        startNewMatch(newRoomId, socket, opponentSocket, isFisrtMover);
        startNewMatch(newRoomId, opponentSocket, socket, !isFisrtMover);
        updateRoster();
    });

    socket.on('move', (data:any) => {
        console.log(data.moveLog);
        console.log(data.room);
        io.sockets.to(data.room).emit('moveLog', data.moveLog);
    });

    socket.on('gameEnd',  (data: any) =>{
        io.to(data.room).emit('gameEnd', data.winner);
    });
});

function startNewMatch(
  roomId: string,
  socket: SocketWithRoom,
  opponentSocket: SocketWithRoom,
  isFirstMover: boolean) {
    console.log("start_match:" + socket.id);
    socket.join(roomId);
    socket.room = roomId;
    socket.emit('start_match', {
        roomId,
        opponentPlayerId: opponentSocket.id,
        opponentPlayerName: opponentSocket.name,
        isFirstMover
    });
}

function searchSocketById(id: string): SocketWithRoom {
    for (var i = 0; i < sockets.length; i++) {
        if (sockets[i].id === id) {
            return sockets[i];
        }
    }
    return null;
}

function updateRoster() {
    async.map(sockets,
      (socket: SocketWithRoom, next: (a:any, b:any)=> any) => {
            console.log(socket.name);
            console.log(socket.id);
            console.log(socket.room);
        if (socket.name == null || typeof socket.name == 'undefined' || typeof socket.room !== 'undefined') {

            next(null, null);
        }else{
            next(null, { name: socket.name, id: socket.id });
        }
    },
    (err, roster) => {
        if(err){}
        const compactRoster: any[] = [];
        for(var i=0; i < roster.length; i++){
            if(roster[i] != null){
                compactRoster.push(roster[i]);
            }
        }
        broadcast('roster', compactRoster);
    });
}
function broadcast(event: string, data: {}) {
    sockets.forEach(function (socket) {
        socket.emit(event, data);
    });
}

//process.env.PORT = 3000;
server.listen(process.env.PORT, function () {
    console.log("start server wiht port " + process.env.PORT);
});
//# sourceMappingURL=server.js.map
