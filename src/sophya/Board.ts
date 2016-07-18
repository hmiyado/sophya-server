import {Cell, Cells} from './Cell';
import {BOARD_SIDE, EXPECTATION_TWO_DICE} from './Const';
import {Die} from './Die';
import {Move} from './Player';

export class Board extends Array<Array<Cell>>{

    constructor() {
        super();
        this.initializeCells();
        this.initializeDice();
    }

    public static newInstance(board?: Board): Board{
      if (!board){
        console.log('Board newInstance. Board doesnot exist');
        return new Board();
      }else{
        console.log('Board newInstance. Board exists');
        const returnBoard = new Board();
        returnBoard.forEachCell((cell) => {
          cell = board.getCell(cell.row, cell.column);
        });
        return returnBoard;
      }
    }

    private initializeDice(): void {
      console.log('Board initializeDice');

      const rowIndexOfViewPlayer = BOARD_SIDE -1;
      const rowIndexOfOpponentPlayer = 2;
      for(let i=1; i <= BOARD_SIDE; i ++) {
        this[rowIndexOfViewPlayer][i].die = new Die(Move.FIRST, i);
        this[rowIndexOfOpponentPlayer][i].die = new Die(Move.SECOND, EXPECTATION_TWO_DICE  - i);
      }
    }

    private initializeCells(): void {
      console.log('Board initializeCells');
      for(let i=1; i <= BOARD_SIDE; i++){
        if (i === 1){
          this.push([]);
        }
        this.push([]);
        for(let j=1; j <= BOARD_SIDE; j++){
          if(j===1){
            this[i].push(null);
          }
          this[i].push(new Cell(i,j,null));
        }
      }
    }

    public getCell(rowIndex: number, columnIndex: number): Cell {
        const isInsideIndex = function(index: number) {
            if (index >= 1 && index <= BOARD_SIDE) {
                return true;
            } else {
                return false;
            }
        };
        if (isInsideIndex(rowIndex) && isInsideIndex(columnIndex)) {
            return this[rowIndex][columnIndex];
        } else {
            throw new Error("out of index::" + "rowIndex:" + rowIndex + ", columnIndex" + columnIndex);
        }
    }

    public getTransposeCell(row: number, column: number) {
        const transposeRow = BOARD_SIDE + 1 - row;
        const transposeColumn = BOARD_SIDE + 1 - column;
        return this.getCell(transposeRow, transposeColumn);
    };

    public swapDice(fromCell: Cell, toCell: Cell) {
        const die = toCell.die;
        toCell.die = fromCell.die;
        fromCell.die = die;
    }

    public forEachCell(func: (cell:Cell) => any) {
        for (var row = 1; row <= BOARD_SIDE; row++) {
            for (var column = 1; column <= BOARD_SIDE; column++) {
                func(this[row][column]);
            }
        }
    }

    // NotNullable
    public listupDestinationCells(cell: Cell): Cell[] {
        const destinationCells: Cell[] = [];
        if (! cell.hasDie()) {
            return destinationCells;
        }
        this.forEachCell( (destinationCandidate) => {
            if (this.isMovableFromTo(cell, destinationCandidate)){
                destinationCells.push(destinationCandidate);
            }
        })
        return destinationCells;
    }

    public isMovableFromTo(fromCell: Cell, toCell: Cell): boolean {
        if (fromCell.isSame(toCell)) {
            return false;
        }
        if ((fromCell.isHorizontalNeighbor(toCell) && !toCell.hasDie()) ||
            (fromCell.isVerticalNeighbor(toCell) && !toCell.hasDie()) ||
            this.isAbleToDiagonalMoveFromTo(fromCell, toCell) ||
            this.isAbleToSwapMoveFromTo(fromCell, toCell)) {
            return true;
        } else {
            return false;
        }
    };

    /**
    * fromCell から toCell にスワップ可能かどうかをチェックする
    * 両方のCellにDieがある
    * fromCell,toCellが対角上で隣接する -> 逆の対角上のCellをcrossCell1, 2 とする
    * crossCell1, 2 にDieがある
    *
    */
    public isAbleToSwapMoveFromTo(fromCell: Cell, toCell: Cell) {
        if (!fromCell.hasDie() || !toCell.hasDie() ){return false;}
        if (!fromCell.isDiagonalNeighbor(toCell)) { return false };
        const crossCell1 = this.getCell(fromCell.row, toCell.column);
        const crossCell2 = this.getCell(toCell.row, fromCell.column);
        if (!crossCell1.hasDie() || !crossCell2.hasDie() ){return false}
        if( crossCell1.die.player !== crossCell2.die.player &&
            fromCell.die.player   !== toCell.die.player) {
            return true;
        } else {
            return false;
        }
    }

    public isAbleToDiagonalMoveFromTo(fromCell: Cell, toCell: Cell):boolean {
        if (!fromCell.hasDie()) return false;
        const crossCell1 = this.getCell(fromCell.row, toCell.column);
        const crossCell2 = this.getCell(toCell.row, fromCell.column);
        if (!crossCell1.hasDie() || !crossCell2.hasDie()) return false;
        if (!toCell.hasDie() &&
            fromCell.isDiagonalNeighbor(toCell) &&
            fromCell.die.player !== crossCell1.die.player &&
            fromCell.die.player !== crossCell2.die.player) {
            return true;
        } else {
            return false;
        }
    }

    private isValidIndex(index: number): boolean{
      return index >= 1 && index <= BOARD_SIDE;
    }

    public listupSnatchVictim(snatchCell: Cell): Cell[] {
      const victims: Cell[] = [];
        if ( !snatchCell.hasDie()) return victims;
        for (let row = -1; row <= 1; row++) {
            for (let column = -1; column <= 1; column++) {
                if ( !this.isValidIndex(snatchCell.row + row) ||
                    !this.isValidIndex(snatchCell.column + column) ||
                    row === 0 && column ===0
                ){
                  continue;
                }
                const victim = this.getCell(snatchCell.row + row, snatchCell.column + column);
                const snatchers = this.listupSnatchers(victim);
                if ( !victim.hasDie() ) continue;
                if (snatchCell.isAdjacentTo(victim) &&
                    victim.die.getDots() > 1 &&
                    victim.die.player !== snatchCell.die.player &&
                    snatchers.length >= 2 ) {
                    victims.push(victim);
                }
            }
        }
        return victims;
    }

    public listupSnatchers(victim: Cell): Cell[] {
        const snatchers: Cell[] = [];
        for (let row = -1; row <= 1; row++) {
            for (let column = -1; column <= 1; column++) {
                if ( !this.isValidIndex(victim.row + row) ||
                    !this.isValidIndex(victim.column + column) ||
                    row === 0 && column ===0
                ){
                  continue;
                }
                const snatcher = this.getCell(victim.row + row, victim.column + column);
                if (!snatcher.hasDie() ){ continue;}
                if (victim.isAdjacentToOpponentOf(snatcher) && snatcher.die.getDots() < 6) {
                    snatchers.push(snatcher);
                }
            }
        }
        return snatchers;
    }

    public isAdjacentToOpponents(cell: Cell): boolean {
        if ( !cell.hasDie()) return false;
        const upCell = this.getCell(cell.row - 1, cell.column);
        const downCell = this.getCell(cell.row + 1, cell.column);
        const leftCell = this.getCell(cell.row, cell.column - 1);
        const rightCell = this.getCell(cell.row, cell.column + 1);
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

}
