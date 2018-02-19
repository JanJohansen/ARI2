"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const eventemitter2_1 = require("eventemitter2");
class AriEventEmitter {
    constructor() {
        var emitter = new eventemitter2_1.EventEmitter2({
            wildcard: true,
            delimiter: '.',
            newListener: false,
            maxListeners: 0,
            verboseMemoryLeak: true
        });
        return emitter; // Ensure we stay singleton!
    }
    /**
     * get named instance of event emitter. Call without parameter to get default emitter.
     */
    static getInstance(emitterName = "") {
        if (!AriEventEmitter.instances[emitterName])
            AriEventEmitter.instances[emitterName] = new AriEventEmitter();
        return AriEventEmitter.instances[emitterName];
    }
}
AriEventEmitter.instances = {};
exports.default = AriEventEmitter;
//# sourceMappingURL=C:/Users/jan/Desktop/ARI2/dist/server/AriEventEmitter.js.map