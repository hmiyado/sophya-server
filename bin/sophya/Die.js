"use strict";
class Die {
    constructor(player, dots) {
        this.player = player;
        this.dots = dots;
    }
    increment() {
        this.dots += 1;
    }
    decrement() {
        this.dots -= 1;
    }
    getDots() {
        return this.dots;
    }
}
exports.Die = Die;
