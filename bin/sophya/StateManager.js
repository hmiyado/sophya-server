"use strict";
const GameState_1 = require('./GameState');
class StateManager {
    // public nextStateManager: StateManager;
    constructor(gameState, previousStateManager) {
        this.gameState = gameState;
        this.previousStateManager = previousStateManager;
        // this.nextStateManager = null;
    }
    static newGame() {
        console.log('StateManager.newGame');
        return new StateManager(GameState_1.GameState.newGame(), null);
    }
    nextState(cell) {
        if (this.gameState.canGoNextState(cell)) {
            // this.nextStateManager = new StateManager(
            //   this.gameState.goNextState(cell),
            //   this
            // );
            // return this.nextStateManager;
            return new StateManager(this.gameState.goNextState(cell), this);
        }
        else {
            return this;
        }
    }
    isGameEnd() {
        return this.gameState.isGameEnd();
    }
}
exports.StateManager = StateManager;
