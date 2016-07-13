import {Player, Move} from './Player';
import {Die} from './Die';
import {BOARD_SIDE, MAX_MOVE_POWER, EXPECTATION_TWO_DICE} from './Const';
import {Board} from './Board';
import {Cell, CellStatus} from './Cell';
import {MoveLog, SnatchLog} from './MoveLog';

enum GameStatus{
  WAIT_STARTING_GAME,
  MOVER_SELECT,
  MOVE_LOCATION_SELECT,
  WAIT_OPPONENT_MOVE,
  ABSORPTION_SELECT,
  SELECT_VICTIM,
  SELECT_SNATCHER,
  GAME_END
}

// 手番: initiative
export class GameCondition {
  private status: GameStatus;
  private moveLog: MoveLog;
  private firstPlayer: string;
  private secondPlayer: string;
  private viewPlayer: Move;
  private initiativePlayer: Move;
  private movePower: number;
  private victimCandidates: Cell[];
  private victims: Cell[];
  private victim: Cell;
  private board: Board;
  private moved: boolean;

  constructor(){
    this.reset();
  }

  public  reset(): void{
    this.status = GameStatus.WAIT_STARTING_GAME;
    this.moveLog = null;
    this.firstPlayer = '';
    this.secondPlayer = '';
    this.initiativePlayer = Move.FIRST;
    this.movePower = MAX_MOVE_POWER;
    this.victims = [];
    this.victim = null;
    this.board = null;
    this.moved = false;
  }

  public init(playerName: string, opponentPlayerName: string, isFirstMover: boolean) {
    this.firstPlayer = (isFirstMover ? playerName : opponentPlayerName);
    this.secondPlayer = (!isFirstMover ? playerName : opponentPlayerName);
    this.initiativePlayer = (isFirstMover? Move.FIRST : Move.SECOND);
    this.viewPlayer = this.initiativePlayer;
    this.moveLog = new MoveLog();
    this.moveLog.initiativePlayer = this.viewPlayer;
    this.movePower = MAX_MOVE_POWER;

    this.initializeBoard();
    this.status = GameStatus.MOVER_SELECT;
  }

  private initializeBoard(): void {
    const cells = this.initializeCells();
    this.setDice(cells);
    this.board = new Board(cells);
  }

  private setDice(cells: Array<Array<Cell>>): void {
    const rowIndexOfViewPlayer = BOARD_SIDE -1;
    const rowIndexOfOpponentPlayer = 2;
    for(let i=1; i <= BOARD_SIDE; i ++) {
      cells[rowIndexOfViewPlayer][i].die = new Die(this.viewPlayer, i);
      cells[rowIndexOfOpponentPlayer][i].die = new Die(this.opponentPlayer(), EXPECTATION_TWO_DICE  - i);
    }
  }

  private initializeCells(): Array<Array<Cell>> {
    const cells: Array<Array<Cell>> = new Array<Array<Cell>>();
    for(let i=1; i <= BOARD_SIDE; i++){
      for(let j=1; j <= BOARD_SIDE; j++){
        cells[i][j] = new Cell(i,j,null);
      }
    }
    return cells;
  }

  private opponentPlayer() {
    return this.viewPlayer == Move.FIRST ? Move.SECOND : Move.FIRST;
  }

  private nextPlayerMove() {

  }

  private switchMovePlayer() {
    this.initiativePlayer = (this.initiativePlayer === Move.FIRST ? Move.SECOND : Move.FIRST);
    this.status = (this.initiativePlayer === this.viewPlayer ? GameStatus.MOVER_SELECT : GameStatus.WAIT_OPPONENT_MOVE);
  }

  private resetMovePower() {
    this.movePower = MAX_MOVE_POWER;
  }

  public canMove(moveCost: number) {
    return this.movePower >= moveCost;
  }

  public decreaseMovePower(moveCost: number): void {
    if ( this.canMove(moveCost) ){
      this.movePower -= moveCost;
    }else{
      throw new Error("Illegal move. Move power is not enough");
    }
  }

  public moveDieRoute(fromCell: Cell, toCell: Cell) {
    this.moveLog.fromCell = fromCell;
    this.moveLog.toCell = toCell;

    this.decreaseMovePower(fromCell.die.getDots());
    this.board.swapDice(fromCell, toCell);
  }

  public isStillMovable(): boolean {
    let isStillMovable = false;
    processAllCells( (row, column) => {
      const cell = this.board.getCell(row, column);
      if (cell.die === null || cell.die.player !== this.initiativePlayer){ return };
      const numOfDestinations = this.board.listupDestinationCells(cell.row, cell.column).length;
      if (this.movePower >= cell.die.getDots() && numOfDestinations >= 1){ isStillMovable = true}
    })
    return isStillMovable;
  }

  public isGameEnd(): boolean {
    let dice6Num = 0;
    processAllCells((row, column) => {
      var cell = this.board.getCell(row, column);
      if (cell.die === null){return};
      if (cell.die.getDots() === 6 && cell.die.player === this.initiativePlayer) { dice6Num += 1 };
    });
    return dice6Num >= 3;
  }

  public nextMove() {
    if (this.isGameEnd()) {
        this.status = GameStatus.GAME_END;
    } else if (!this.isStillMovable()) {
        this.nextPlayerMove();
    } else if(this.initiativePlayer === this.viewPlayer){
        this.status = GameStatus.MOVER_SELECT;
    }
    this.moved = true;
  }

  public changeCellStatus(row:number, column:number) {
      const cell = this.board.getCell(row, column);
      this.moved = false;
      switch (this.status) {
          case GameStatus.WAIT_STARTING_GAME:
              break;
          case GameStatus.MOVER_SELECT:
              if (cell.hasDie() &&
                  this.initiativePlayer === this.viewPlayer &&
                  cell.die.player === this.initiativePlayer &&
                  cell.die.getDots() <= this.movePower) {
                  const destinationCells = this.board.listupDestinationCells(row, column);
                  if (destinationCells === null || destinationCells.length === 0) return;

                  cell.setStatus(CellStatus.Departure);
                  for (let i = 0; i < destinationCells.length; i++) {
                      const destinationCell = destinationCells[i];
                      destinationCell.setStatus(CellStatus.Destination);
                  }
                  this.status = GameStatus.MOVE_LOCATION_SELECT;
              }
              break;
          case GameStatus.MOVE_LOCATION_SELECT:
              if (cell.status !== CellStatus.Destination) {
                  this.board.forEachCell(function (_cell) {
                      _cell.setStatus(CellStatus.Normal);
                  });
                  this.status = GameStatus.MOVER_SELECT;
              } else {
                  // 移動処理
                  let departureCell:Cell = null;
                  for (let row = 1; row <= BOARD_SIDE && departureCell === null; row++) {
                      for (let column = 1; column <= BOARD_SIDE && departureCell === null; column++) {
                          let _cell = this.board.getCell(row, column);
                          if (_cell.status === CellStatus.Departure) {
                              departureCell = _cell;
                          }
                      }
                  }
                  this.moveDieRoute(departureCell, cell);
                  this.board.forEachCell(function (_cell) {
                      _cell.setStatus(CellStatus.Normal);
                  });

                  // 移動終了処理
                  const victimCandidates = this.board.listupSnatchVictim(cell);
                  if (victimCandidates !== null && victimCandidates.length > 0) {
                      // 強奪候補準備
                      for (let i = 0; i < victimCandidates.length; i++) {
                          victimCandidates[i].setStatus(CellStatus.VictimCandidate);
                      }
                      this.status = GameStatus.SELECT_VICTIM;
                      this.victimCandidates = victimCandidates;
                      return;
                  } else {
                      this.nextMove();
                  }
              }
              break;
          case GameStatus.SELECT_VICTIM:
              if (cell.status === CellStatus.VictimCandidate) {
                  this.victim = cell;
                  this.victim.setStatus(CellStatus.Victim);

                  var snatchers = this.board.listupSnatchers(cell);
                  for (var i = 0; i < snatchers.length; i++) {
                      snatchers[i].setStatus(CellStatus.Snatcher);
                  }
                  this.status = GameStatus.SELECT_SNATCHER;
              }
              break;
          case GameStatus.SELECT_SNATCHER:
              if (cell.status === CellStatus.Snatcher) {
                  const snatcher = cell;

                  // 強奪処理
                  this.moveLog.snatchLog.push(new SnatchLog(this.victim, snatcher));
                  snatcher.die.increment();
                  this.victim.die.decrement();
                  snatcher.setStatus(CellStatus.Normal);

                  // 強奪終了処理
                  this.board.forEachCell(function (_cell) {
                      if (_cell.status === CellStatus.Snatcher) {
                          _cell.setStatus(CellStatus.Normal);
                      }
                  });
                  this.victim.setStatus(CellStatus.Normal);
                  this.victimCandidates.splice(this.victimCandidates.indexOf(this.victim), 1);

                  // 次状態への遷移
                  if (this.victimCandidates.length > 0) {
                      for (var i = 0; i < this.victimCandidates.length; i++) {
                          this.victimCandidates[i].setStatus(CellStatus.VictimCandidate);
                      }
                      this.status = GameStatus.SELECT_VICTIM;
                  } else {
                      this.nextMove();
                  }
              }
              break;
          case GameStatus.WAIT_OPPONENT_MOVE:
              break;
          default:
              // code
              break;
      }
  };

  public applyLog(moveLog: MoveLog){
      const fromCell = this.board.getTransposeCell(moveLog.fromCell.row, moveLog.fromCell.column);
      const toCell = this.board.getTransposeCell(moveLog.toCell.row, moveLog.toCell.column);
      this.moveDieRoute(fromCell, toCell);
      for (var i = 0; i < moveLog.snatchLog.length; i++) {
          this.board.getTransposeCell(moveLog.snatchLog[i].victim.row,
                                      moveLog.snatchLog[i].victim.column).die.decrement();
          this.board.getTransposeCell(moveLog.snatchLog[i].snatcher.row,
                                      moveLog.snatchLog[i].snatcher.column).die.increment();
      }
      this.nextMove();
      this.moved = false;
  }

}

function processAllCells(callback: (row: number, column: number) => void): void {
  for(let row = 1; row <= BOARD_SIDE; row++){
    for(let column = 1; column <= BOARD_SIDE; column++) {
      callback(row, column);
    }
  }
}
