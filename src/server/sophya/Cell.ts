import {Player} from './Player';
import {Die} from './Die';

export class Cells extends   Array<Array<Cell>>{
}

export enum CellStatus {
    Departure,
    Destination,
    Victim,
    VictimCandidate,
    Snatcher,
    Normal
}

export class Cell {
    public row: number;
    public column: number;
    public status: CellStatus;
    public die: Die;

    constructor(row: number, column: number, die: Die) {
        this.row = row;
        this.column = column;
        this.die = die;
    }

    public hasDie() {
      return this.die !== null;
    }

    public isSame(cell: Cell) {
        return this.row === cell.row && this.column === cell.column;
    }

    public isHorizontalNeighbor(cell: Cell) {
        return this.row === cell.row && Math.abs(this.column - cell.column) === 1;
    }

    public isVerticalNeighbor(cell: Cell) {
        return this.column === cell.column && Math.abs(this.row - cell.row) == 1;
    }

    public isDiagonalNeighbor(cell: Cell) {
        return Math.abs(this.row - cell.row) === 1 && Math.abs(this.column - cell.column) === 1;
    }

    public isAdjacentTo(cell: Cell) {
        return ((Math.abs(this.row - cell.row) + Math.abs(this.column - cell.column)) === 1);
    }

    public isAdjacentToOpponentOf(cell: Cell): boolean {
      return this.isAdjacentTo(cell) && cell.die.player !== this.die.player;
    }

    public isAdjacentToOpponentsOf(cell1: Cell, cell2: Cell){
      return this.isAdjacentToOpponentOf(cell1) && this.isAdjacentToOpponentOf(cell2);
    }

    public setStatus(newStatus: CellStatus) {
      switch (newStatus) {
          case CellStatus.Departure:
              this.status = newStatus;
              break;
          case CellStatus.Destination:
              this.status = newStatus;
              break;
          case CellStatus.Victim:
              this.status = newStatus;
              break;
          case CellStatus.VictimCandidate:
              this.status = newStatus;
              break;
          case CellStatus.Snatcher:
              this.status = newStatus;
              break;
          default:
              this.status = CellStatus.Normal;
      }

    }
}
