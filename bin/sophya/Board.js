"use strict";
const Cell_1 = require('./Cell');
const Const_1 = require('./Const');
const Die_1 = require('./Die');
const Player_1 = require('./Player');
class Board extends Array {
    constructor() {
        super();
        this.initializeCells();
        this.initializeDice();
    }
    static newInstance(board) {
        if (!board) {
            console.log('Board newInstance. Board doesnot exist');
            return new Board();
        }
        else {
            console.log('Board newInstance. Board exists');
            const returnBoard = new Board();
            returnBoard.forEachCell((cell) => {
                cell = board.getCell(cell.row, cell.column);
            });
            return returnBoard;
        }
    }
    initializeDice() {
        console.log('Board initializeDice');
        const rowIndexOfViewPlayer = Const_1.BOARD_SIDE - 1;
        const rowIndexOfOpponentPlayer = 2;
        for (let i = 1; i <= Const_1.BOARD_SIDE; i++) {
            this[rowIndexOfViewPlayer][i].die = new Die_1.Die(Player_1.Move.FIRST, i);
            this[rowIndexOfOpponentPlayer][i].die = new Die_1.Die(Player_1.Move.SECOND, Const_1.EXPECTATION_TWO_DICE - i);
        }
    }
    initializeCells() {
        console.log('Board initializeCells');
        for (let i = 1; i <= Const_1.BOARD_SIDE; i++) {
            if (i === 1) {
                this.push([]);
            }
            this.push([]);
            for (let j = 1; j <= Const_1.BOARD_SIDE; j++) {
                if (j === 1) {
                    this[i].push(null);
                }
                this[i].push(new Cell_1.Cell(i, j, null));
            }
        }
    }
    getCell(rowIndex, columnIndex) {
        const isInsideIndex = function (index) {
            if (index >= 1 && index <= Const_1.BOARD_SIDE) {
                return true;
            }
            else {
                return false;
            }
        };
        if (isInsideIndex(rowIndex) && isInsideIndex(columnIndex)) {
            return this[rowIndex][columnIndex];
        }
        else {
            throw new Error("out of index::" + "rowIndex:" + rowIndex + ", columnIndex" + columnIndex);
        }
    }
    getTransposeCell(row, column) {
        const transposeRow = Const_1.BOARD_SIDE + 1 - row;
        const transposeColumn = Const_1.BOARD_SIDE + 1 - column;
        return this.getCell(transposeRow, transposeColumn);
    }
    ;
    swapDice(fromCell, toCell) {
        const die = toCell.die;
        toCell.die = fromCell.die;
        fromCell.die = die;
    }
    forEachCell(func) {
        for (var row = 1; row <= Const_1.BOARD_SIDE; row++) {
            for (var column = 1; column <= Const_1.BOARD_SIDE; column++) {
                func(this[row][column]);
            }
        }
    }
    // NotNullable
    listupDestinationCells(cell) {
        const destinationCells = [];
        if (!cell.hasDie()) {
            return destinationCells;
        }
        this.forEachCell((destinationCandidate) => {
            if (this.isMovableFromTo(cell, destinationCandidate)) {
                destinationCells.push(destinationCandidate);
            }
        });
        return destinationCells;
    }
    isMovableFromTo(fromCell, toCell) {
        if (fromCell.isSame(toCell)) {
            return false;
        }
        if ((fromCell.isHorizontalNeighbor(toCell) && !toCell.hasDie()) ||
            (fromCell.isVerticalNeighbor(toCell) && !toCell.hasDie()) ||
            this.isAbleToDiagonalMoveFromTo(fromCell, toCell) ||
            this.isAbleToSwapMoveFromTo(fromCell, toCell)) {
            return true;
        }
        else {
            return false;
        }
    }
    ;
    /**
    * fromCell から toCell にスワップ可能かどうかをチェックする
    * 両方のCellにDieがある
    * fromCell,toCellが対角上で隣接する -> 逆の対角上のCellをcrossCell1, 2 とする
    * crossCell1, 2 にDieがある
    *
    */
    isAbleToSwapMoveFromTo(fromCell, toCell) {
        if (!fromCell.hasDie() || !toCell.hasDie()) {
            return false;
        }
        if (!fromCell.isDiagonalNeighbor(toCell)) {
            return false;
        }
        ;
        const crossCell1 = this.getCell(fromCell.row, toCell.column);
        const crossCell2 = this.getCell(toCell.row, fromCell.column);
        if (!crossCell1.hasDie() || !crossCell2.hasDie()) {
            return false;
        }
        if (crossCell1.die.player !== crossCell2.die.player &&
            fromCell.die.player !== toCell.die.player) {
            return true;
        }
        else {
            return false;
        }
    }
    isAbleToDiagonalMoveFromTo(fromCell, toCell) {
        if (!fromCell.hasDie())
            return false;
        const crossCell1 = this.getCell(fromCell.row, toCell.column);
        const crossCell2 = this.getCell(toCell.row, fromCell.column);
        if (!crossCell1.hasDie() || !crossCell2.hasDie())
            return false;
        if (!toCell.hasDie() &&
            fromCell.isDiagonalNeighbor(toCell) &&
            fromCell.die.player !== crossCell1.die.player &&
            fromCell.die.player !== crossCell2.die.player) {
            return true;
        }
        else {
            return false;
        }
    }
    isValidIndex(index) {
        return index >= 1 && index <= Const_1.BOARD_SIDE;
    }
    listupSnatchVictim(snatchCell) {
        const victims = [];
        if (!snatchCell.hasDie())
            return victims;
        for (let row = -1; row <= 1; row++) {
            for (let column = -1; column <= 1; column++) {
                if (!this.isValidIndex(snatchCell.row + row) ||
                    !this.isValidIndex(snatchCell.column + column) ||
                    row === 0 && column === 0) {
                    continue;
                }
                const victim = this.getCell(snatchCell.row + row, snatchCell.column + column);
                const snatchers = this.listupSnatchers(victim);
                if (!victim.hasDie())
                    continue;
                if (snatchCell.isAdjacentTo(victim) &&
                    victim.die.getDots() > 1 &&
                    victim.die.player !== snatchCell.die.player &&
                    snatchers.length >= 2) {
                    victims.push(victim);
                }
            }
        }
        return victims;
    }
    listupSnatchers(victim) {
        const snatchers = [];
        for (let row = -1; row <= 1; row++) {
            for (let column = -1; column <= 1; column++) {
                if (!this.isValidIndex(victim.row + row) ||
                    !this.isValidIndex(victim.column + column) ||
                    row === 0 && column === 0) {
                    continue;
                }
                const snatcher = this.getCell(victim.row + row, victim.column + column);
                if (!snatcher.hasDie()) {
                    continue;
                }
                if (victim.isAdjacentToOpponentOf(snatcher) && snatcher.die.getDots() < 6) {
                    snatchers.push(snatcher);
                }
            }
        }
        return snatchers;
    }
    isAdjacentToOpponents(cell) {
        if (!cell.hasDie())
            return false;
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
        }
        else {
            return false;
        }
    }
}
exports.Board = Board;
