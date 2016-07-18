import {Player, Move} from './Player';
import {MoveLog} from './MoveLog';
import {GameState} from './GameState';
import {Cell} from './Cell';

export class StateManager {
    // public nextStateManager: StateManager;

    constructor(
        public gameState: GameState,
        public previousStateManager: StateManager) {
        // this.nextStateManager = null;
    }

    public static newGame(): StateManager {
        console.log('StateManager.newGame');
        return new StateManager(GameState.newGame(), null);
    }

    public nextState(cell: Cell): StateManager {
        if (this.gameState.canGoNextState(cell)) {
            // this.nextStateManager = new StateManager(
            //   this.gameState.goNextState(cell),
            //   this
            // );
            // return this.nextStateManager;
            return new StateManager(
              this.gameState.goNextState(cell),
              this
            );
        }else {
          return this;
        }
    }

    public isGameEnd(): boolean{
        return this.gameState.isGameEnd();
    }
}
