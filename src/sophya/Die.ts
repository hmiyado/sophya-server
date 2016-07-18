import {Move} from './Player';

export class Die {
  public player: Move;
  private dots: number;

  constructor(player: Move, dots: number){
    this.player = player;
    this.dots = dots;
  }

  public increment(): void {
    this.dots += 1;
  }

  public decrement(): void {
    this.dots -= 1;
  }

  public getDots(){
    return this.dots;
  }

}
