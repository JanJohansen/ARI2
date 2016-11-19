"use strict";
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var AriEventEmitter = (function () {
    function AriEventEmitter() {
        if (AriEventEmitter.EE2)
            return AriEventEmitter.EE2; // Ensure we stay singleton!
        AriEventEmitter.EE2 = new EventEmitter2({
            wildcard: true,
            delimiter: '.',
            newListener: true,
            maxListeners: 0,
            verboseMemoryLeak: true
        });
        return AriEventEmitter.EE2; // Ensure we stay singleton!
    }
    AriEventEmitter.getInstance = function () {
        return new AriEventEmitter();
    };
    return AriEventEmitter;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AriEventEmitter;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/AriEventEmitter.js.map