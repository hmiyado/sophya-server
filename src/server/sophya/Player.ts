export enum Move {
  FIRST,SECOND
}

export class Player {
  public move: Move;
  public name: string;
  public initiative: boolean;

  constructor(move: Move, name: string, initiative: boolean){
    this.move = move;
    this.name = name;
    this.initiative = initiative;
  }
}
