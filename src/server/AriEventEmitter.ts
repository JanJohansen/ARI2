var EventEmitter2 = require('eventemitter2').EventEmitter2;
    

export default class AriEventEmitter {
    static EE2: any;
    constructor(){
        if(AriEventEmitter.EE2) return AriEventEmitter.EE2; // Ensure we stay singleton!
        AriEventEmitter.EE2 = new EventEmitter2({
            wildcard: true,
            delimiter: '.', 
            newListener: true, 
            maxListeners: 0,
            verboseMemoryLeak: true
        });
        return AriEventEmitter.EE2; // Ensure we stay singleton!
    }
    static getInstance(){
        return new AriEventEmitter();
    }
}