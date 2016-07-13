import {Move} from './Player';
import {Cell} from './Cell';

export class SnatchLog {
  victim: Cell;
  snatcher: Cell;

  constructor(victim: Cell, snatcher: Cell){
    this.victim = victim;
    this.snatcher = snatcher;
  }
}

export class MoveLog{
  public initiativePlayer: Move;
  public fromCell: Cell;
  public toCell: Cell;
  public snatchLog: Array<SnatchLog>;

  constructor(){
    this.initiativePlayer = null;
    this.fromCell = null;
    this.toCell = null;
    this.snatchLog = [];
  }

}
