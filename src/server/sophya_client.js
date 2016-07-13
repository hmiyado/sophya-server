var BOARD_SIDE = 6;
var MAX_MOVE_POWER = 7;

var decideFirstMovePlayer = function (player1, player2) {
    if (Math.floor(Math.random() * 2) === 0) {
        return { firstPlayer: player1, secondPlayer: player2 };
    } else {
        return { firstPlayer: player2, secondPlayer: player1 };
    }
};


/* Game Condition */
var Available_Status = ["Wait_Starting_Game", "Mover_Select", "Move_Location_Select", "Wait_Opponent_Move", "Absorption_Select"];
var GameCondition = function () {
    this.status = "Wait_Starting_Game";
    this.moveLog = null;
    this.firstPlayer = "player1";
    this.secondPlayer = "player2";
    this.viewPlayer = "player0";
    this.movePlayer = 0;
    this.movePower = MAX_MOVE_POWER;
    this.victims = null;
    this.victim = null;
    this.board = null;
    this.moved = false;
};

GameCondition.prototype.reset = function (){
    this.status = "Wait_Starting_Game";
    this.moveLog = null;    
    this.firstPlayer = "player1";
    this.secondPlayer = "player2";
    this.viewPlayer = "player0";
    this.movePlayer = 0;
    this.movePower = MAX_MOVE_POWER;
    this.victimCandidates = null;
    this.victim = null;
    this.board = null;
    this.moved = false;
}

GameCondition.prototype.initialize = function (playerName, opponentPlayerName, isFirstMover) {
    // Set Game Condition    
    this.firstPlayer = (isFirstMover ? playerName : opponentPlayerName);
    this.secondPlayer = (!isFirstMover ? playerName : opponentPlayerName);
    this.movePlayer = this.firstPlayer;
    this.viewPlayer = playerName;
    this.moveLog = new MoveLog;
    this.moveLog.player = this.viewPlayer;
    this.movePower = MAX_MOVE_POWER;
    
    this.initializeBoard();
    this.status = "Mover_Select";

};

GameCondition.prototype.initializeBoard = function () {
    // initialize cells
    var cells = [];
    for (var i = 1; i <= BOARD_SIDE; i++) {
        cells[i] = [];
        for (var j = 1; j <= BOARD_SIDE; j++) {
            cells[i][j] = new Cell(i, j, null);
        }
    }
    
    // Set Dice
    var rowIndex = [];
    rowIndex[this.viewPlayer] = BOARD_SIDE - 1;
    rowIndex[this.opponentPlayer()] = 2;
    for (var i = 1; i <= BOARD_SIDE; i++) {
        cells[rowIndex[this.viewPlayer]][i].die = new Die(this.viewPlayer, i);
        cells[rowIndex[this.opponentPlayer()]][i].die = new Die(this.opponentPlayer(), 7 - i);
    }
    this.board = new Board(cells);
};

GameCondition.prototype.opponentPlayer = function () {
    return this.firstPlayer === this.viewPlayer ? this.secondPlayer : this.firstPlayer;
};

GameCondition.prototype.nextPlayerMove = function () {
    //  switch move player
    this.movePlayer = (this.movePlayer === this.firstPlayer ? this.secondPlayer : this.firstPlayer);
    this.status     = (this.movePlayer === this.viewPlayer  ? "Mover_Select" : "Wait_Opponent_Move");
    
    // reset move power
    this.movePower = MAX_MOVE_POWER;
};

GameCondition.prototype.canMove = function (number) {
    if (this.movePower >= number) {
        return (true);
    } else {
        return (false);
    }
};

GameCondition.prototype.decreaseMovePower = function (number) {
    if (this.canMove(number)) {
        this.movePower -= number;
    } else {
        throw new Error("Illegal move. Move Power is not enough");
    }
};

GameCondition.prototype.moveDieFromTo = function (fromCell, toCell) {
    this.moveLog.fromCell = fromCell;
    this.moveLog.toCell = toCell;    
    
    this.decreaseMovePower(fromCell.die.number);    
    this.board.swapDice(fromCell, toCell);
}

GameCondition.prototype.isStillMovable = function () {
    for (var row = 1; row <= BOARD_SIDE; row++) {
        for (var column = 1; column <= BOARD_SIDE; column++) {
            var cell = this.board.getCell(row, column);
            if (cell.die === null || cell.die.player !== this.movePlayer) continue;
            var numOfDestinations = this.board.listupDestinationCells(cell.row, cell.column).length;
            if (this.movePower >= cell.die.number && numOfDestinations >= 1) return true;
        }
    }
    return false;
}

GameCondition.prototype.isGameEnd = function () {
    var dice6Num = 0;
    for (var row = 1; row <= BOARD_SIDE; row++) {
        for (var column = 1; column <= BOARD_SIDE; column++) {
            var cell = this.board.getCell(row, column);
            if (cell.die === null) continue;
            if (cell.die.number === 6 && cell.die.player === this.movePlayer) { dice6Num += 1 }            ;
        }
    }
    return dice6Num >= 3;
}

GameCondition.prototype.nextMove = function (){
    if (this.isGameEnd()) {
        this.status = "Game_End";
    } else if (!this.isStillMovable()) {
        this.nextPlayerMove()
    } else if(this.movePlayer === this.viewPlayer){
        this.status = "Mover_Select";
    }
    this.moved = true;
}

GameCondition.prototype.changeCellStatus = function (row, column) {
    var cell = this.board.getCell(row, column);
    this.moved = false;
    switch (this.status) {
        case "Wait_Starting_Game":
            break;
        case "Mover_Select":
            if (cell.die !== null &&
                this.movePlayer === this.viewPlayer &&
                cell.die.player === this.movePlayer &&
                cell.die.number <= this.movePower) {
                var destinationCells = this.board.listupDestinationCells(row, column);
                if (destinationCells === null || destinationCells.length === 0) return;
                
                cell.setStatus("Departure");
                for (var i = 0; i < destinationCells.length; i++) {
                    var destinationCell = destinationCells[i];
                    destinationCell.setStatus("Destination");
                }
                this.status = "Move_Location_Select";
            }
            break;
        case "Move_Location_Select":
            if (cell.status !== "Destination") {
                this.board.forEachCell(function (_cell) {
                    _cell.setStatus("");
                });
                this.status = "Mover_Select";
            } else {
                // 移動処理
                var departureCell = null;
                for (var row = 1; row <= BOARD_SIDE && departureCell === null; row++) {
                    for (var column = 1; column <= BOARD_SIDE && departureCell === null; column++) {
                        var _cell = this.board.getCell(row, column);
                        if (_cell.status === 'Departure') {
                            departureCell = _cell;
                        }
                    }
                }
                this.moveDieFromTo(departureCell, cell);
                this.board.forEachCell(function (_cell) {
                    _cell.setStatus("");
                });
                
                // 移動終了処理
                var victimCandidates = this.board.listupSnatchVictim(cell);
                if (victimCandidates !== null && victimCandidates.length > 0) {
                    // 強奪候補準備
                    for (var i = 0; i < victimCandidates.length; i++) {
                        victimCandidates[i].setStatus("VictimCandidate");
                    }
                    this.status = "Select_Victim";
                    this.victimCandidates = victimCandidates;
                    return;
                } else {
                    this.nextMove();
                }
            }
            break;
        case "Select_Victim":
            if (cell.status === "VictimCandidate") {
                this.victim = cell;
                this.victim.setStatus("Victim");

                var snatchers = this.board.listupSnatchers(cell);
                for (var i = 0; i < snatchers.length; i++) {
                    snatchers[i].setStatus("Snatcher");
                }
                this.status = "Select_Snatcher";
            }
            break;
        case "Select_Snatcher":
            if (cell.status === "Snatcher") {
                var snatcher = cell;

                // 強奪処理
                this.moveLog.snatchLog.push(new SnatchLog(this.victim, snatcher));
                snatcher.die.increment();
                this.victim.die.decrement();
                snatcher.setStatus("");
                
                // 強奪終了処理
                this.board.forEachCell(function (_cell) {
                    if (_cell.status === 'Snatcher') {
                        _cell.setStatus("");
                    }
                });
                this.victim.setStatus("");
                this.victimCandidates.splice(this.victimCandidates.indexOf(this.victim), 1);
                
                // 次状態への遷移
                if (this.victimCandidates.length > 0) {
                    for (var i = 0; i < this.victimCandidates.length; i++) {
                        this.victimCandidates[i].setStatus("VictimCandidate");
                    }
                    this.status = "Select_Victim";
                } else {
                    this.nextMove();                    
                }
            }
            break;
        case "Wait_Opponent_Move":
            break;
        default:
            // code
            break;
    }
};

GameCondition.prototype.applyLog = function (moveLog){
    var fromCell = this.board.getTransposeCell(moveLog.fromCell.row, moveLog.fromCell.column);
    var toCell = this.board.getTransposeCell(moveLog.toCell.row, moveLog.toCell.column);
    this.moveDieFromTo(fromCell, toCell);
    for (var i = 0; i < moveLog.snatchLog.length; i++) {
        this.board.getTransposeCell(moveLog.snatchLog[i].victim.row,
                                    moveLog.snatchLog[i].victim.column).die.decrement();
        this.board.getTransposeCell(moveLog.snatchLog[i].snatcher.row,
                                    moveLog.snatchLog[i].snatcher.column).die.increment();
    }
    this.nextMove();
    this.moved = false;
}



/* Board */
// Board[rowIndex][columnIndex] === Cell
var Board = function (cells) {
    this.cells = cells;
};

Board.prototype.getCell = function (rowIndex, columnIndex) {
    var isInsideIndex = function (index) {
        if (index >= 1 && index <= BOARD_SIDE) {
            return true;
        } else {
            return false;
        }
    };
    if (isInsideIndex(rowIndex) && isInsideIndex(columnIndex)) {
        return this.cells[rowIndex][columnIndex];
    } else {
        return null;
        //throw new Error("out of index::" + "rowIndex:"+rowIndex+", columnIndex"+columnIndex);
    }
};

Board.prototype.getTransposeCell = function (row, column) {
    var transposeRow = BOARD_SIDE + 1 - row;
    var transposeColumn = BOARD_SIDE + 1 - column;
    return this.getCell(transposeRow, transposeColumn);
};

Board.prototype.swapDice = function (fromCell, toCell){
    var die = toCell.die;
    toCell.die = fromCell.die;
    fromCell.die = die;
}

Board.prototype.forEachCell = function (func) {
    for (var row = 1; row <= BOARD_SIDE; row++) {
        for (var column = 1; column <= BOARD_SIDE; column++) {
            func(this.getCell(row, column));
        }
    }
}

Board.prototype.listupDestinationCells = function (row, column) {
    var cell = this.getCell(row, column);
    if (cell.die === null) {
        return null;
    }
    var destinationCells = [];
    for (var i = -1; i <= 1; i++) {
        for (var j = -1; j <= 1; j++) {
            var destinationCell = this.getCell(cell.row + i, cell.column + j);
            if (destinationCell === null) continue;
            if (this.isMovableFromTo(cell, destinationCell)) {
                destinationCells.push(destinationCell);
            }
        }
    }
    return destinationCells;
};

Board.prototype.isMovableFromTo = function (fromCell, toCell) {
    if (fromCell.isSame(toCell)) {
        return false;
    }
    if ((fromCell.isHorizontalNeighbor(toCell) && toCell.die === null) ||
         (fromCell.isVerticalNeighbor(toCell) && toCell.die === null) ||
        this.isAbleToDiagonalMoveFromTo(fromCell, toCell) ||
        this.isAbleToSwapMoveFromTo(fromCell, toCell)) {
        return true;
    } else {
        return false;
    }
};

Board.prototype.isAbleToSwapMoveFromTo = function (fromCell, toCell) {
    if (fromCell.die === null ||
        toCell.die === null ||
        !fromCell.isDiagonalNeighbor(toCell)) { return false }    ;
    var crossCell1 = this.getCell(fromCell.row, toCell.column);
    var crossCell2 = this.getCell(toCell.row, fromCell.column);
    if (crossCell1.die !== null && crossCell2.die !== null &&
        crossCell1.die.player !== crossCell2.die.player &&
        fromCell.die.player !== toCell.die.player) {
        return true;
    } else {
        return false;
    }
}

Board.prototype.isAbleToDiagonalMoveFromTo = function (fromCell, toCell) {
    if (fromCell.die === null) return null;
    var crossCell1 = this.getCell(fromCell.row, toCell.column);
    var crossCell2 = this.getCell(toCell.row, fromCell.column);
    if (crossCell1.die === null || crossCell2.die === null) return null;
    if (toCell.die == null &&
        fromCell.isDiagonalNeighbor(toCell) &&
        fromCell.die.player !== crossCell1.die.player &&
        fromCell.die.player !== crossCell2.die.player) {
        return true;
    } else {
        return false;
    }
};

Board.prototype.listupSnatchVictim = function (snatchCell) {
    if (snatchCell.die === null) return null;
    var victims = [];
    for (var row = -1; row <= 1; row++) {
        for (var column = -1; column <= 1; column++) {
            var victim = this.getCell(snatchCell.row + row, snatchCell.column + column);
            var snatchers = this.listupSnatchers(victim);
            if (victim === null || victim.die === null || snatchers === null) continue;
            if (snatchCell.isAdjacentTo(victim) &&
                victim.die.number > 1 &&
                victim.die.player !== snatchCell.die.player &&
                snatchers.length > 0) {
                victims.push(victim);
            }
        }
    }
    return victims;
}

Board.prototype.listupSnatchers = function (cell) {
    if (cell === null) { return null }    ;
    var snatchers = [];
    var adjacentOpponentsNum = 0;
    for (var row = -1; row <= 1; row++) {
        for (var column = -1; column <= 1; column++) {
            var snatcher = this.getCell(cell.row + row, cell.column + column);
            if (cell.isAdjacentToOpponentOf(snatcher)) {
                adjacentOpponentsNum += 1;
                if (snatcher.die.number < 6) { snatchers.push(snatcher) }                ;
            }            ;
        }
    }
    if (adjacentOpponentsNum >= 2) {
        return snatchers;
    } else {
        return null;
    }
}

Board.prototype.isAdjacentToOpponents = function (cell) {
    if (cell.die === null) return null;
    var upCell = this.getCell(cell.row - 1, cell.column);
    var downCell = this.getCell(cell.row + 1, cell.column);
    var leftCell = this.getCell(cell.row, cell.column - 1);
    var rightCell = this.getCell(cell.row, cell.column + 1);
    if (cell.isAdjacentToOpponentsOf(upCell, downCell) ||
        cell.isAdjacentToOpponentsOf(upCell, leftCell) ||
        cell.isAdjacentToOpponentsOf(upCell, rightCell) ||
        cell.isAdjacentToOpponentsOf(downCell, leftCell) ||
        cell.isAdjacentToOpponentsOf(downCell, rightCell) ||
        cell.isAdjacentToOpponentsOf(leftCell, rightCell)) {
        return true;
    } else {
        return false;
    }
}

/* Cell */
function Cell(row, column, die) {
    this.row = row;
    this.column = column;
    this.status = "Normal";
    this.die = die;
}

Cell.prototype.isSame = function (cell) {
    if (this.row === cell.row && this.column === cell.column) {
        return true;
    } else {
        return false;
    }
};
Cell.prototype.isHorizontalNeighbor = function (cell) {
    if (this.row === cell.row && Math.abs(this.column - cell.column) === 1) {
        return true;
    } else {
        return false;
    }
};
Cell.prototype.isVerticalNeighbor = function (cell) {
    if (this.column === cell.column && Math.abs(this.row - cell.row) === 1) {
        return true;
    } else {
        return false;
    }
};
Cell.prototype.isDiagonalNeighbor = function (cell) {
    if (Math.abs(this.row - cell.row) === 1 && Math.abs(this.column - cell.column) === 1) {
        return true;
    } else {
        return false;
    }
};
Cell.prototype.isAdjacentTo = function (cell) {
    return ((Math.abs(this.row - cell.row) + Math.abs(this.column - cell.column)) === 1)
}
Cell.prototype.isAdjacentToOpponentOf = function (cell1) {
    if (cell1 !== null &&
        this.isAdjacentTo(cell1) &&
        cell1.die !== null && this.die !== null &&
        cell1.die.player !== this.die.player) {
        return true;
    } else {
        return false;
    }
}

Cell.prototype.setStatus = function (status) {
    switch (status) {
        case 'Departure':
            this.status = status;
            break;
        case 'Destination':
            this.status = status;
            break;
        case 'Victim':
            this.status = status;
            break;
        case 'VictimCandidate':
            this.status = status;
            break;
        case 'Snatcher':
            this.status = status;
            break;
        default:
            this.status = "Normal";
    }
};

/* Die */
function Die(player, number) {
    this.player = player;
    this.number = number;
}

Die.prototype.increment = function () {
    this.number += 1;
}
Die.prototype.decrement = function () {
    this.number -= 1;
}

/* Move Log*/
function MoveLog(){
    this.player = null;
    this.fromCell = null;
    this.toCell = null;
    this.snatchLog = [];
}

MoveLog.prototype.reset = function (){
    this.fromCell = null;
    this.toCell = null;
    this.snatchLog = [];
}



function SnatchLog(victim, snatcher){
    this.victim = victim;
    this.snatcher = snatcher;
}