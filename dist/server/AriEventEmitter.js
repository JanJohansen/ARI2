"use strict";
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var AriEventEmitter = (function () {
    function AriEventEmitter() {
        var emitter = new EventEmitter2({
            wildcard: true,
            delimiter: '.',
            newListener: true,
            maxListeners: 0,
            verboseMemoryLeak: true
        });
        return emitter; // Ensure we stay singleton!
    }
    /**
     * get named instance of event emitter. Call without parameter to get default emitter.
     */
    AriEventEmitter.getInstance = function (emitterName) {
        if (emitterName === void 0) { emitterName = ""; }
        if (!AriEventEmitter.instances[emitterName])
            AriEventEmitter.instances[emitterName] = new AriEventEmitter();
        else
            return AriEventEmitter.instances[emitterName];
    };
    AriEventEmitter.instances = {};
    return AriEventEmitter;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AriEventEmitter;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/AriEventEmitter.js.map