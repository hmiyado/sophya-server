import {Player} from './Player';
import {Die} from './Die';

export class Cells extends   Array<Array<Cell>>{
}

export class Cell {

    constructor(public row: number,public column: number,public die?: Die) {
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
      if(!cell.hasDie() || !this.hasDie()){
        return false;
      }
      return this.isAdjacentTo(cell) && cell.die.player !== this.die.player;
    }

    public isAdjacentToOpponentsOf(cell1: Cell, cell2: Cell){
      return this.isAdjacentToOpponentOf(cell1) && this.isAdjacentToOpponentOf(cell2);
    }

    // public setStatus(newStatus: CellStatus) {
    //   switch (newStatus) {
    //       case CellStatus.Departure:
    //           this.status = newStatus;
    //           break;
    //       case CellStatus.Destination:
    //           this.status = newStatus;
    //           break;
    //       case CellStatus.Victim:
    //           this.status = newStatus;
    //           break;
    //       case CellStatus.VictimCandidate:
    //           this.status = newStatus;
    //           break;
    //       case CellStatus.Snatcher:
    //           this.status = newStatus;
    //           break;
    //       default:
    //           this.status = CellStatus.Normal;
    //   }
    // }
}
