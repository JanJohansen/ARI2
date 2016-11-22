var EventEmitter2 = require('eventemitter2').EventEmitter2;

export default class AriEventEmitter {
    static instances: any = {};
    constructor(){
        var emitter = new EventEmitter2({
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
    static getInstance(emitterName: string = ""): AriEventEmitter{
        if(!AriEventEmitter.instances[emitterName]) AriEventEmitter.instances[emitterName] = new AriEventEmitter();
        return AriEventEmitter.instances[emitterName];
    }
}