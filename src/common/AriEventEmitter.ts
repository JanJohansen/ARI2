//var EventEmitter2 = require('eventemitter2').EventEmitter2;
import { EventEmitter2 } from 'eventemitter2';

var log = (...args) => { };//console.log;

export default class AriEventEmitter extends EventEmitter2 {
    name: string;
    throttle: number = 0;
    serverMode = false;
    private _nextCallId = 0;
    private _pendingCalls = {};
    private _functions = {};
    private collection = null;

    constructor(name, options: any = {}) {
        super({ wildcard: true, delimiter: '.', newListener: true, maxListeners: 20, verboseMemoryLeak: true });
        this.name = name;
        this.throttle = options.throtlle || 0; // -1: Synchronus callback, 0: Callback in nextTick, 1+: ms delay before sending.
        this.serverMode = options.serverMode || false;
        this._nextCallId = 0;
        this._pendingCalls = {};
        this._functions = {};
        var self = this;
        this.on(this.name + ".newListener", function (evt) {
            log(this.name, "NEW listener:", evt);
            var path = evt.split(".");
            if (path[0] != this.name) {
                self.send({ cmd: "on", name: evt });
            }
        });
        this.on(this.name + ".removeListener", function (evt) {
            log(this.name, "OLD listener:", evt);
            var path = evt.split(".");
            if (path[0] != this.name) {
                self.send({ cmd: "off", name: evt });
            }
        });
    }
    onLocal(name, cb){
        this.on(this.name + "." + name, cb);
    }
    emit(evt, args = null) {
        super.emit(this.name + "." + evt, args);
    }
    emitNow(evt, args) {
        super.emit(this.name + "." + evt, args);
        this.flush();
    }
    send(msg) {
        throw("Error: MUST omplement send!");
    }
    receive(msg) {
        log(this.name, "<-", msg);
        var handled = false;
        if ("cmd" in msg) {
            if(msg.cmd == "evt"){
                super.emit(msg.name, msg.args);
                handled = true;
            }
            else if (msg.cmd == "call") {
                if (!(msg.name in this._functions)) {
                    this.send({ cmd: "return", err: "Unknown function name when trying to call: " + msg.name, cid: msg.cid });
                    return true;
                }
                var result = this._functions[msg.name](msg.args);
                this.send({ cmd: "return", result: result, cid: msg.cid });
                handled = true;
            } else if (msg.cmd == "return") {
                if (!(msg.cid in this._pendingCalls)) return;    // callId not awaited! - Ignore!
                this._pendingCalls[msg.cid](msg.result);
                delete this._pendingCalls[msg.cid];
                handled = true;
            } else {
                if(this.serverMode){
                    if (msg.cmd == "on") {
                        this.on(msg.name, this.collectSubCbs);
                        handled = true;
                    } else if (msg.cmd == "off") {
                        this.off(msg.name, this.collectSubCbs);
                        handled = true;
                    }
                }
                else {
                    var path = msg.name.split(".");
                    if (path[0] == '*') {
                        path[0] = this.name;
                    } else if (path[0] == '**') {
                        path.unshift(this.name);
                    }
                    if (path[0] == this.name) {
                        path = path.join(".");
                        if (msg.cmd == "on") {
                            this.on(path, this.collectSubCbs);
                            handled = true;
                        } else if (msg.cmd == "off") {
                            this.off(path, this.collectSubCbs);
                            handled = true;
                        }
                    }
                }
            }
        }
        return handled;
    }
    // Collect callbacks for same event to avoid sending same event more than once.
    collectSubCbs(args) {
        if (this.throttle < 0) {
            this.send({ cmd: "evt", name: this.event, args: args });
            return;
        } else {
            if (!this.collection) {
                this.collection = [];
                // Send/flush AFTER all listeners that listen to events have been fired.
                var self = this;
                if (this.throttle == 0) process.nextTick(this.flush.bind(self));
                else setTimeout(function(){ 
                    self.flush(); 
                }, self.throttle);
            }
            log(this.name, "collecting:", this.event, "=", args);
            this.collection[this.event] = args;
        }
    }
    // Send collected events. Can allso be called in certain cases where colecting events is not desired (function "call"s, and command like events.)
    flush() {
        if (this.collection) {
            log("Collected:", this.collection);
            for (let evt in this.collection) {
                this.send({ cmd: "evt", name: evt, args: this.collection[evt] });
            }
            this.collection = null;
        }
    }
    call(name, args, cb) {
        this._pendingCalls[this._nextCallId] = cb;
        this.send({ cmd: "call", name: name, args: args, cid: this._nextCallId });
        this._nextCallId++;
    }
    onCall(name, cb) {
        this._functions[this.name + "." + name] = cb;
    }
}
