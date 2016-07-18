"use strict";
class Cells extends Array {
}
exports.Cells = Cells;
class Cell {
    constructor(row, column, die) {
        this.row = row;
        this.column = column;
        this.die = die;
    }
    hasDie() {
        return this.die !== null;
    }
    isSame(cell) {
        return this.row === cell.row && this.column === cell.column;
    }
    isHorizontalNeighbor(cell) {
        return this.row === cell.row && Math.abs(this.column - cell.column) === 1;
    }
    isVerticalNeighbor(cell) {
        return this.column === cell.column && Math.abs(this.row - cell.row) == 1;
    }
    isDiagonalNeighbor(cell) {
        return Math.abs(this.row - cell.row) === 1 && Math.abs(this.column - cell.column) === 1;
    }
    isAdjacentTo(cell) {
        return ((Math.abs(this.row - cell.row) + Math.abs(this.column - cell.column)) === 1);
    }
    isAdjacentToOpponentOf(cell) {
        if (!cell.hasDie() || !this.hasDie()) {
            return false;
        }
        return this.isAdjacentTo(cell) && cell.die.player !== this.die.player;
    }
    isAdjacentToOpponentsOf(cell1, cell2) {
        return this.isAdjacentToOpponentOf(cell1) && this.isAdjacentToOpponentOf(cell2);
    }
}
exports.Cell = Cell;
