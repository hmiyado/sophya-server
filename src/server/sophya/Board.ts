import {Cell, Cells} from './Cell';
import {BOARD_SIDE} from './Const';

export class Board extends Array<Array<Cell>>{

    constructor(cells: Array<Array<Cell>>) {
        super();
    }

    public getCell(rowIndex: number, columnIndex: number) {
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
                func(this.getCell(row, column));
            }
        }
    }

    public listupDestinationCells(row: number, column: number) {
        const cell = this.getCell(row, column);
        if (cell.die === null) {
            return null;
        }
        const destinationCells: Cell[] = [];
        for (var i = -1; i <= 1; i++) {
            for (var j = -1; j <= 1; j++) {
                const destinationCell = this.getCell(cell.row + i, cell.column + j);
                if (destinationCell === null) continue;
                if (this.isMovableFromTo(cell, destinationCell)) {
                    destinationCells.push(destinationCell);
                }
            }
        }
        return destinationCells;
    }

    public isMovableFromTo(fromCell: Cell, toCell: Cell): boolean {
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

    public isAbleToSwapMoveFromTo(fromCell: Cell, toCell: Cell) {
        if (fromCell.die === null ||
            toCell.die === null ||
            !fromCell.isDiagonalNeighbor(toCell)) { return false };
        const crossCell1 = this.getCell(fromCell.row, toCell.column);
        const crossCell2 = this.getCell(toCell.row, fromCell.column);
        if (crossCell1.die !== null && crossCell2.die !== null &&
            crossCell1.die.player !== crossCell2.die.player &&
            fromCell.die.player !== toCell.die.player) {
            return true;
        } else {
            return false;
        }
    }

    public isAbleToDiagonalMoveFromTo(fromCell: Cell, toCell: Cell) {
        if (fromCell.die === null) return null;
        const crossCell1 = this.getCell(fromCell.row, toCell.column);
        const crossCell2 = this.getCell(toCell.row, fromCell.column);
        if (crossCell1.die === null || crossCell2.die === null) return null;
        if (toCell.die == null &&
            fromCell.isDiagonalNeighbor(toCell) &&
            fromCell.die.player !== crossCell1.die.player &&
            fromCell.die.player !== crossCell2.die.player) {
            return true;
        } else {
            return false;
        }
    }

    public listupSnatchVictim(snatchCell: Cell) {
        if (snatchCell.die === null) return null;
        const victims: Cell[] = [];
        for (var row = -1; row <= 1; row++) {
            for (var column = -1; column <= 1; column++) {
                const victim = this.getCell(snatchCell.row + row, snatchCell.column + column);
                const snatchers = this.listupSnatchers(victim);
                if (victim === null || victim.die === null || snatchers === null) continue;
                if (snatchCell.isAdjacentTo(victim) &&
                    victim.die.getDots() > 1 &&
                    victim.die.player !== snatchCell.die.player &&
                    snatchers.length > 0) {
                    victims.push(victim);
                }
            }
        }
        return victims;
    }

    public listupSnatchers(cell: Cell) {
        if (cell === null) { return null };
        const snatchers: Cell[] = [];
        let adjacentOpponentsNum = 0;
        for (let row = -1; row <= 1; row++) {
            for (let column = -1; column <= 1; column++) {
                const snatcher = this.getCell(cell.row + row, cell.column + column);
                if (cell.isAdjacentToOpponentOf(snatcher)) {
                    adjacentOpponentsNum += 1;
                    if (snatcher.die.getDots() < 6) { snatchers.push(snatcher) };
                }
            }
        }
        if (adjacentOpponentsNum >= 2) {
            return snatchers;
        } else {
            return null;
        }
    }

    public isAdjacentToOpponents(cell: Cell): boolean {
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

}
