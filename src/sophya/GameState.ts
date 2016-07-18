import {Move} from './Player';
import {Board} from './Board';
import {MAX_MOVE_POWER, BOARD_SIDE, EXPECTATION_TWO_DICE} from './Const';
import {Cell} from './Cell';
import {Die} from './Die';

export abstract class GameState {
    public initiativePlayer: Move;
    public board: Board;
    public movePower: number;

    constructor(gameState?: GameState) {
        if (gameState) {
            this.initiativePlayer = gameState.initiativePlayer;
            this.board = gameState.board;
            this.movePower = gameState.movePower;
        }
    }

    public static newGame(): GameState{
        console.log('GameState.newGame');
        return new WaitStartingGame();
    }

    abstract canGoNextState(cell: Cell): boolean;

    abstract getNextState(cell: Cell): GameState;

    public goNextState(cell: Cell): GameState {
        if (!this.canGoNextState(cell)) {
            throw new Error(this.toString());
        }
        return this.getNextState(cell);
    }

    public isGameEnd(): boolean{
        return false;
    }
}

class WaitStartingGame extends GameState {
    constructor() {
        super();
        console.log('WaitStartingGame constructor');
        this.initiativePlayer = Move.FIRST;
        this.board = Board.newInstance();
        this.movePower = MAX_MOVE_POWER;
    }

    public canGoNextState(cell: Cell): boolean {
        return true;
        // throw new Error("Illegal method call: WaitStartingGame.changeCellStatus()");
    };

    // public changeCellStatus(cell: Cell): void { }

    public getNextState(): GameState {
        return new MoverSelect(this);
    }
}

export class MoverSelect extends GameState {
    constructor(gameState: GameState) {
        super(gameState);
    }

    public canGoNextState(cell: Cell): boolean {
        if (!cell.hasDie()) { return false; }
        if (cell.die.player !== this.initiativePlayer) { return false; }
        if (cell.die.getDots() > this.movePower) { return false; }
        const destinationCells = this.board.listupDestinationCells(cell);
        return destinationCells.length > 0;
    }

    public getNextState(cell: Cell): GameState {
        return new MoverLocationSelect(this, cell);
    }
}

class MoverLocationSelect extends GameState {
    constructor(gameState: GameState, public departureCell: Cell) {
        super(gameState);
    }

    public canGoNextState(cell: Cell): boolean {
        return this.board.listupDestinationCells(this.departureCell).indexOf(cell) > -1;
    }

    public getNextState(cell: Cell): GameState {
        this.moveDieRoute(this.departureCell, cell);
        const victimCandidates = this.board.listupSnatchVictim(cell);
        if (victimCandidates.length > 0) {
            // 強奪候補準備
            return new SelectVictim(this, victimCandidates);
        } else {
            return new NextMove(this);
        }
    }

    private moveDieRoute(fromCell: Cell, toCell: Cell): void {
        // TODO MoveLog
        // this.moveLog.fromCell = fromCell;
        // this.moveLog.toCell = toCell;

        this.decreaseMovePower(fromCell.die.getDots());
        this.board.swapDice(fromCell, toCell);
    }

    private decreaseMovePower(moveCost: number): void {
        if (this.canMove(moveCost)) {
            this.movePower -= moveCost;
        } else {
            throw new Error("Illegal move. Move power is not enough");
        }
    }

    private canMove(moveCost: number): boolean {
        return this.movePower >= moveCost;
    }


}

class NextMove extends GameState {

    constructor(gameState: GameState) {
        super(gameState);
    }

    public canGoNextState(): boolean {
        return true;
    }

    public getNextState(): GameState {
        if (this.isGameEnd()) {
            return new GameEnd();
        } else if (!this.isStillMovable()) {
            const nextState = new MoverSelect(this);
            nextState.initiativePlayer = this.initiativePlayer === Move.FIRST ? Move.SECOND : Move.FIRST;
            nextState.movePower = MAX_MOVE_POWER;
            return nextState;
        } else {
            return new MoverSelect(this);
        }
    }
    public isGameEnd(): boolean {
        let dice6Num = 0;
        this.board.forEachCell((cell) => {
            if (!cell.hasDie()) { return };
            if (cell.die.getDots() === 6 && cell.die.player === this.initiativePlayer) { dice6Num += 1 };
        });
        return dice6Num >= 3;
    }
    private nextPlayerMove() {

    }
    public isStillMovable(): boolean {
        let isStillMovable = false;
        this.board.forEachCell((cell) => {
            if (!cell.hasDie() || cell.die.player !== this.initiativePlayer) { return };
            const numOfDestinations = this.board.listupDestinationCells(cell).length;
            if (this.movePower >= cell.die.getDots() && numOfDestinations >= 1) { isStillMovable = true }
        })
        return isStillMovable;
    }

}

class SelectVictim extends GameState {
    constructor(gameState: GameState, private victimCandidates: Cell[]) {
        super(gameState);
    }

    public canGoNextState(cell: Cell): boolean {
        return this.victimCandidates.indexOf(cell) > -1;
    }

    public getNextState(cell: Cell): GameState {
        const victim = cell;
        const snatchers = this.board.listupSnatchers(victim);
        return new SelectSnatcher(this, this.victimCandidates, victim, snatchers);
    }
}

class SelectSnatcher extends GameState {
    constructor(gameState: GameState,
        public victimCandidates: Cell[],
        public victim: Cell,
        public snatchers: Cell[]) {
        super(gameState);
    }

    public canGoNextState(cell: Cell): boolean {
        return this.snatchers.indexOf(cell) > -1;
    }

    public getNextState(snatcher: Cell): GameState {
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
        } else {
            return new NextMove(this);
        }
    }
}

class GameEnd extends GameState {
    constructor() {
        super();
    }

    public canGoNextState(): boolean {
        return false;
    }

    public getNextState(): GameState {
        return this;
    }

    // @override
    public isGameEnd(){
      return true;
    }
}
