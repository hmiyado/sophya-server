app.controller('RoomController', ['$scope', '$location','socket', 'game',function ($scope, $location, socket, game) {
        $scope.roster = [];
        $scope.name = '';

        socket.on('roster', function (roster) {
            $scope.roster = roster;
        });
        
        socket.on('start_match', function (data) {
            game.start($scope.name, data.opponent_player_name, data.is_first_mover);
            socket.room = data.room_id;
            $location.path('/match');
        });
        
        
        $scope.tutorial = function tutorial(){
            $location.path('/tutorial');
        }
        
        $scope.send = function send() {

            socket.emit('enter_room', $scope.name);
        };
        
        $scope.match = function match(id) {
            console.log("match to " + id + " is clicked");
            socket.emit('match', id);
        };
        
        $scope.isDisavailableMatchButton = function isDisavailableMatchButton(id){
            return(socket.id() == id);
        }
    }]);

app.controller('TutorialController', ['$scope',function($scope){}]);

app.controller('MatchController', ['$scope', 'socket', 'game', '$window', '$location',
    function ($scope, socket, game, $window, $location) {
        $scope.game = game;
        
        socket.on('moveLog', function (moveLog) {
            console.log(moveLog);            
            if (moveLog.player !== game.condition.viewPlayer) {
                game.condition.applyLog(moveLog);
            }
        });
        
        socket.on("gameDisrupt",function(data){
            socket.room = null;
            $window.alert("対戦相手が退出しました");
            $location.path("/");
        })
        
        socket.on('gameEnd', function (winner) {
            socket.room = null;
            $window.alert(winner + " win!");
            $location.path("/");
        })
        
        $scope.move = function (row, column){
            game.condition.changeCellStatus(row, column);
            if (game.condition.moved) {
                socket.emit('move', { moveLog: game.condition.moveLog, room: socket.room });
                game.condition.moveLog.reset();
            }
            if (game.condition.status === "Game_End") {
                socket.emit('gameEnd', { room: socket.room, winner: game.condition.movePlayer });
            }
        }

        $scope.getCellClass = function (row, column) {
            var cell = game.condition.board.getCell(row, column);
            var classes = [];
            classes.push(cell.status);

            if (cell.die !== null) {
                if (cell.die.player === game.condition.firstPlayer) {
                    classes.push("firstPlayer");
                } else {
                    classes.push("secondPlayer");
                }
            }
            return classes;
        }
        $scope.getMovePlayer = function (row, column){
            var cell = game.condition.board.getCell(row, column);
            if(cell.die === null) return "";
            return (cell.die.player === game.condition.firstPlayer ? "firstPlayer" : "secondPlayer");
        }
        
        $scope.getPlayerClass = function (playerName) {
            var classes = [];
            if (playerName === game.condition.firstPlayer) {
                classes.push("firstPlayer");
            } else if (playerName === game.condition.secondPlayer) {
                classes.push("secondPlayer");
            }
            if (playerName === game.condition.movePlayer) {
                classes.push("movePlayer");
            }
            return classes;
        }

        $scope.existsDice = function (row, column){
            var cell = game.condition.board.getCell(row, column);
            return(cell.die !== null);
        }
        


    }]);