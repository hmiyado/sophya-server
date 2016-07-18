"use strict";
(function (Move) {
    Move[Move["FIRST"] = 0] = "FIRST";
    Move[Move["SECOND"] = 1] = "SECOND";
})(exports.Move || (exports.Move = {}));
var Move = exports.Move;
class Player {
    constructor(name) {
        this.name = name;
    }
}
exports.Player = Player;
