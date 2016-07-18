/// <reference path="../../typings/index.d.ts"/>

import * as express from 'express';
import * as path from 'path';
import * as http from 'http';
import * as socketio from 'socket.io';
import * as async from 'async';

import {StateManager} from '../sophya/StateManager';
import {Player} from '../sophya/Player';
import {Cell} from '../sophya/Cell';

const app  = express();
const server = http.createServer(app);
const io = socketio.listen(server);

const sockets: PlayerSocket[] = [];
const rooms: Room[] = [];

app.use(express.static('public'));

interface PlayerSocket extends SocketIO.Socket{
  player: Player
}

class Room {
  public stateManager: StateManager;
  public roomId: string;
  public secondPlayerSocketId: string

  constructor(
    public firstPlayerSocketId: string
  ){
      console.log('room constructor');
      this.roomId = Math.random().toString(36);
      this.stateManager = StateManager.newGame();
      this.secondPlayerSocketId = null;
  }

  private decideFirstMover(): void {
    const isFirstMover:boolean = (Math.random() * 10 % 2 === 0);
    if (!isFirstMover) {
      const tmp = this.firstPlayerSocketId;
      this.firstPlayerSocketId = this.secondPlayerSocketId;
      this.secondPlayerSocketId = tmp;
    }
  }

  public setOpponentPlayerSocket(opponentPlayerSocketId: string): void{
    this.secondPlayerSocketId = opponentPlayerSocketId;
    this.decideFirstMover();
  }

  public getOpponentPlayerSocket(playerSocketId: string): string {
    if (playerSocketId === this.firstPlayerSocketId) {
      return this.secondPlayerSocketId;
    }else if (playerSocketId === this.secondPlayerSocketId){
      return this.firstPlayerSocketId;
    }else{
      throw new Error("Illegal player socket");
    }
  }

  public startGame(): void{
    this.stateManager = this.stateManager.nextState(null);
  }

  public nextState(cell: Cell): void {
    this.stateManager = this.stateManager.nextState(cell);
  }

  public isGameEnd():boolean {
    return this.stateManager.isGameEnd();
  }

  public emit(identifier: string, data: any): void{
      const firstPlayerSocket = sockets.find((socket) =>{return socket.id == this.firstPlayerSocketId;});
      const secondPlayerSocket = sockets.find((socket) =>{return socket.id == this.secondPlayerSocketId;});

      firstPlayerSocket.emit(identifier, data);
      secondPlayerSocket.emit(identifier, data);
  }

  public isWaiting(): boolean {
    return this.secondPlayerSocketId === null;
  }

  public hasSocket(socketId: string): boolean{
    return this.firstPlayerSocketId === socketId || this.secondPlayerSocketId === socketId;
  }

}

io.on('connection', (socket: PlayerSocket) => {
    sockets.push(socket);
    console.log("a user connected");
    updateWaitingRooms();

    socket.on('disconnect',  () => {
        console.log("user disconnected");

        //TODO(20160713) 対戦中断処理

        sockets.splice(sockets.indexOf(socket), 1);
        updateWaitingRooms();
    });

    socket.on('create_room', (playerName='Anonymous') => {
        console.log('player name:' + playerName);
        socket.player = new Player(playerName);

        const waitingRoom = findRoomBySocket(socket);
        if (waitingRoom === null){
          const room = new Room(socket.id);
          rooms.push(room);
          updateWaitingRooms();
        }

    });

    socket.on('enter_room', (roomId: string) => {
        console.log('enter_room');
        console.log(roomId);
        const room = rooms.find( (room)=> {return room.roomId === roomId});

        room.setOpponentPlayerSocket(socket.id);
        room.startGame();
        room.emit('start_match', room);
        updateWaitingRooms();
    });

    socket.on('move', (cellJson: Cell) => {
        console.log('move');
        console.log(cellJson);
        const room = findRoomBySocket(socket);
        const cell = room.stateManager.gameState.board.getCell(cellJson.row, cellJson.column);
        room.nextState(cell);
        room.emit('moved', room);

        if (room.isGameEnd()) {
          room.emit('game_end', room);
        }
    });
});

function findRoomBySocket(socket: PlayerSocket): Room{
    const matchedRooms = rooms.filter((room) => {
      return room.hasSocket(socket.id);
    });
    if (matchedRooms.length === 0){
      return null;
    }
    if ( matchedRooms.length === 1){
      return matchedRooms[0];
    }
    throw new Error('too match rooms');
}

function updateWaitingRooms(): void{
  const waitingRooms = rooms.filter((room) => {return room.isWaiting();});
  console.log(waitingRooms);
  if (waitingRooms.length === 0 ){return};
  console.log(waitingRooms);

  async.each(sockets, (socket, callback) =>{
      setTimeout(() => {
       console.log('async each socket');
       socket.emit('waiting_rooms', waitingRooms);
     }, 100);
  },(err) => {
    console.log(err);
  });


  // sockets.forEach( (socket) => {
  //     socket.emit('waiting_rooms', waitingRooms);
  // });
}

//process.env.PORT = 3000;
const port = process.env.PORT || 3000
server.listen(port, function () {
    console.log("start server wiht port:" + port);
});
//# sourceMappingURL=server.js.map
