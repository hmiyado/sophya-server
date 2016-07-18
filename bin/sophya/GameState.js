"use strict";
const Player_1 = require('./Player');
const Board_1 = require('./Board');
const Const_1 = require('./Const');
class GameState {
    constructor(gameState) {
        if (gameState) {
            this.initiativePlayer = gameState.initiativePlayer;
            this.board = gameState.board;
            this.movePower = gameState.movePower;
        }
    }
    static newGame() {
        console.log('GameState.newGame');
        return new WaitStartingGame();
    }
    goNextState(cell) {
        if (!this.canGoNextState(cell)) {
            throw new Error(this.toString());
        }
        return this.getNextState(cell);
    }
    isGameEnd() {
        return false;
    }
}
exports.GameState = GameState;
class WaitStartingGame extends GameState {
    constructor() {
        super();
        console.log('WaitStartingGame constructor');
        this.initiativePlayer = Player_1.Move.FIRST;
        this.board = Board_1.Board.newInstance();
        this.movePower = Const_1.MAX_MOVE_POWER;
    }
    canGoNextState(cell) {
        return true;
        // throw new Error("Illegal method call: WaitStartingGame.changeCellStatus()");
    }
    ;
    // public changeCellStatus(cell: Cell): void { }
    getNextState() {
        return new MoverSelect(this);
    }
}
class MoverSelect extends GameState {
    constructor(gameState) {
        super(gameState);
    }
    canGoNextState(cell) {
        if (!cell.hasDie()) {
            return false;
        }
        if (cell.die.player !== this.initiativePlayer) {
            return false;
        }
        if (cell.die.getDots() > this.movePower) {
            return false;
        }
        const destinationCells = this.board.listupDestinationCells(cell);
        return destinationCells.length > 0;
    }
    getNextState(cell) {
        return new MoverLocationSelect(this, cell);
    }
}
exports.MoverSelect = MoverSelect;
class MoverLocationSelect extends GameState {
    constructor(gameState, departureCell) {
        super(gameState);
        this.departureCell = departureCell;
    }
    canGoNextState(cell) {
        return this.board.listupDestinationCells(this.departureCell).indexOf(cell) > -1;
    }
    getNextState(cell) {
        this.moveDieRoute(this.departureCell, cell);
        const victimCandidates = this.board.listupSnatchVictim(cell);
        if (victimCandidates.length > 0) {
            // 強奪候補準備
            return new SelectVictim(this, victimCandidates);
        }
        else {
            return new NextMove(this);
        }
    }
    moveDieRoute(fromCell, toCell) {
        // TODO MoveLog
        // this.moveLog.fromCell = fromCell;
        // this.moveLog.toCell = toCell;
        this.decreaseMovePower(fromCell.die.getDots());
        this.board.swapDice(fromCell, toCell);
    }
    decreaseMovePower(moveCost) {
        if (this.canMove(moveCost)) {
            this.movePower -= moveCost;
        }
        else {
            throw new Error("Illegal move. Move power is not enough");
        }
    }
    canMove(moveCost) {
        return this.movePower >= moveCost;
    }
}
class NextMove extends GameState {
    constructor(gameState) {
        super(gameState);
    }
    canGoNextState() {
        return true;
    }
    getNextState() {
        if (this.isGameEnd()) {
            return new GameEnd();
        }
        else if (!this.isStillMovable()) {
            const nextState = new MoverSelect(this);
            nextState.initiativePlayer = this.initiativePlayer === Player_1.Move.FIRST ? Player_1.Move.SECOND : Player_1.Move.FIRST;
            nextState.movePower = Const_1.MAX_MOVE_POWER;
            return nextState;
        }
        else {
            return new MoverSelect(this);
        }
    }
    isGameEnd() {
        let dice6Num = 0;
        this.board.forEachCell((cell) => {
            if (!cell.hasDie()) {
                return;
            }
            ;
            if (cell.die.getDots() === 6 && cell.die.player === this.initiativePlayer) {
                dice6Num += 1;
            }
            ;
        });
        return dice6Num >= 3;
    }
    nextPlayerMove() {
    }
    isStillMovable() {
        let isStillMovable = false;
        this.board.forEachCell((cell) => {
            if (!cell.hasDie() || cell.die.player !== this.initiativePlayer) {
                return;
            }
            ;
            const numOfDestinations = this.board.listupDestinationCells(cell).length;
            if (this.movePower >= cell.die.getDots() && numOfDestinations >= 1) {
                isStillMovable = true;
            }
        });
        return isStillMovable;
    }
}
class SelectVictim extends GameState {
    constructor(gameState, victimCandidates) {
        super(gameState);
        this.victimCandidates = victimCandidates;
    }
    canGoNextState(cell) {
        return this.victimCandidates.indexOf(cell) > -1;
    }
    getNextState(cell) {
        const victim = cell;
        const snatchers = this.board.listupSnatchers(victim);
        return new SelectSnatcher(this, this.victimCandidates, victim, snatchers);
    }
}
class SelectSnatcher extends GameState {
    constructor(gameState, victimCandidates, victim, snatchers) {
        super(gameState);
        this.victimCandidates = victimCandidates;
        this.victim = victim;
        this.snatchers = snatchers;
    }
    canGoNextState(cell) {
        return this.snatchers.indexOf(cell) > -1;
    }
    getNextState(snatcher) {
        // TODO MoveLog
        // this.moveLog.snatchLog.push(new SnatchLog(this.victim, snatcher));
        // 強奪処理
        snatcher.die.increment();
        this.victim.die.decrement();
        // 強奪終了処理
        this.victimCandidates.splice(this.victimCandidates.indexOf(this.victim), 1);
        // 次状態への遷移
        if (this.victimCandidates.length > 0) {
            return new SelectVictim(this, this.victimCandidates);
        }
        else {
            return new NextMove(this);
        }
    }
}
class GameEnd extends GameState {
    constructor() {
        super();
    }
    canGoNextState() {
        return false;
    }
    getNextState() {
        return this;
    }
    // @override
    isGameEnd() {
        return true;
    }
}
