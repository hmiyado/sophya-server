"use strict";
class SnatchLog {
    constructor(victim, snatcher) {
        this.victim = victim;
        this.snatcher = snatcher;
    }
}
exports.SnatchLog = SnatchLog;
class MoveLog {
    constructor() {
        this.initiativePlayer = null;
        this.fromCell = null;
        this.toCell = null;
        this.snatchLog = [];
    }
}
exports.MoveLog = MoveLog;
