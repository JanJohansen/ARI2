"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loggingService_1 = require("./loggingService");
var log = loggingService_1.loggingService.getLogger("ariClientServer");
const eventemitter2_1 = require("eventemitter2");
class AriClientServer {
    constructor() {
        this.connected = false;
        this.authenticated = false;
        this.clientData = null; // Contains data pertaining to this client.
        this.ariRoot = AriClientServer.ariRoot;
        this.throttle = 0;
        this.nextCallId = 0;
        this.pendingCalls = {};
        this.functions = {};
        this.collection = null;
        this.subs = {}; // Contains props of all evennames that this client subscribes to. (To be able to unsub at disconnect!.)
        this.connected = true;
        // Special out handling for server!
        // this.ariRoot.on("out", (evt) => {
        //     evt.source.value = evt.value;
        // });
    }
    //*************************************************************************
    // Connection handling
    receive(msg) {
        if ("cmd" in msg) {
            let cmd = msg.cmd;
            if ("_cmd_" + cmd in this)
                this["_cmd_" + cmd](msg);
            else
                console.log("Error: Server trying to call unknown method:", cmd);
        }
    }
    // Override to use class.
    onSend(message) {
        throw ("Error: onSend function MUST be overriddedn to handle transmission of messages to client.");
    }
    ;
    send(msg) {
        if (this.connected)
            this.onSend(msg);
    }
    disconnect() {
        this.connected = false;
        // Unsubscribe from events for this client.
        for (let name in this.subs) {
            this.ariRoot.off(name, this.subs[name]);
        }
        this.clientData.clientServer = null;
        if (!this.clientData.clientInfo)
            delete AriClientServer.ariClients[this.name];
    }
    // ************************************************************************
    // Event handling.
    _cmd_evt(msg) {
        this.ariRoot.emit(msg.name, msg.args);
    }
    _cmd_on(msg) {
        var subCb = this.collectSubCbs.bind(this);
        this.ariRoot.on(msg.name, subCb);
        // Store in local sub list, to allow removing subscriptions on disconnect.
        this.subs[msg.name] = subCb;
        // Send sub to affected clients
        this.forwardMsg(msg);
    }
    _cmd_off(msg) {
        this.ariRoot.off(msg.name, this.subs[msg.name]);
        delete this.subs[msg.name];
        // Send unsub to affected clients
        this.forwardMsg(msg);
    }
    forwardMsg(msg) {
        var name = msg.name.split(".");
        if (name[0].startsWith("*")) {
            // Send to all clients except this one!.
            for (let name in AriClientServer.ariClients) {
                var remoteClientData = AriClientServer.ariClients[name];
                if (remoteClientData.clientServer != this) {
                    if (remoteClientData.clientServer.authenticated) {
                        remoteClientData.clientServer.send(msg);
                    }
                }
            }
        }
        else if (name[0] in AriClientServer.ariClients) {
            var remoteClientData = AriClientServer.ariClients[name[0]];
            if (remoteClientData.clientServer.authenticated) {
                remoteClientData.clientServer.send(msg);
            }
        }
    }
    // Collect callbacks for same event to avoid sending same event more than once.
    collectSubCbs(args) {
        var name = this.ariRoot.event;
        if (!this.collection) {
            this.collection = {};
            // Send/flush AFTER all listeners that listen to events have been fired.
            process.nextTick(this.flush.bind(this));
        }
        this.collection[name] = args;
        console.log(this.name, "collecting (" + Object.keys(this.collection).length + "):", name, "=", args);
    }
    // Send collected events. Can allso be called in certain cases where colecting events is not desired (function "call"s, and command like events.)
    flush() {
        if (this.collection) {
            //log("Collected:", this.collection);
            for (let evt in this.collection) {
                this.send({ cmd: "evt", name: evt, args: this.collection[evt] });
            }
            this.collection = null;
        }
    }
    // ************************************************************************
    // Call handling.
    _cmd_call(msg) {
        if (!(msg.name in AriClientServer.ariClients))
            this.send({ cmd: "return", err: "Unknown function name when trying to call: " + msg.name, cid: msg.cid });
        var targetClientInfo = AriClientServer.ariClients[msg.name];
        var result = this.functions[msg.name](msg.args);
        this.send({ cmd: "return", result: result, cid: msg.cid });
    }
    _cmd_return(msg) {
        if (!(msg.cid in this.pendingCalls))
            return; // callId not awaited! - Ignore!
        this.pendingCalls[msg.cid](msg.result);
        delete this.pendingCalls[msg.cid];
    }
    //*************************************************************************
    // Authentication handling
    _cmd_auth(msg) {
        if (msg.token == 42) {
            // TODO: Use name from authToken since this is registered with ari!
            this.name = this.generateUniqueName(msg.name);
            this.authenticated = true;
            if (!(this.name in AriClientServer.ariClients))
                AriClientServer.ariClients[this.name] = { clientServer: this };
            this.clientData = AriClientServer.ariClients[this.name];
            this.send({ cmd: "authOk", name: this.name, "token": 42 }); // No checks for now.
            // Send existing subscriptions valid for this client.
            var allSubs = new Set();
            for (let name in AriClientServer.ariClients) {
                var client = AriClientServer.ariClients[name];
                for (let subName in client.clientServer.subs) {
                    allSubs.add(subName);
                }
            }
            for (let evt of allSubs) {
                let name = evt.split(".");
                if (name[0].startsWith("*") || name[0] == this.name) {
                    this.send({ cmd: "on", name: evt });
                }
            }
        }
        //else ignore untill correct authentication request is received.
    }
    generateUniqueName(name) {
        var newName = name;
        var idx = 1;
        while (newName in AriClientServer.ariClients) {
            newName = name + "(" + idx.toString() + ")";
            idx++;
        }
        return newName;
    }
    //*************************************************************************
    // support functions
    static no__jsonReplacer(key, value) {
        if (key.startsWith("__"))
            return undefined;
        else
            return value;
    }
    // Delete object members of target that are not in model. Leave all value members. Ignore "__" double underscored members.
    deleteRemoved(target, source) {
        for (var property in target) {
            if (typeof target[property] === "object" && target[property] !== null) {
                if (!(typeof source[property] === "object" && source[property] !== null)) {
                    if (!property.startsWith("__"))
                        delete target[property];
                }
                else
                    this.deleteRemoved(target[property], source[property]);
            }
        }
        return source;
    }
    // Set value of existing target proporties to value in corresponding source property. Ignore "__" double underscored members.
    deepMerge(target, source) {
        for (var property in source) {
            if (typeof source[property] === "object" && source[property] !== null) {
                target[property] = target[property] || {};
                this.deepMerge(target[property], source[property]);
            }
            else {
                if (!property.startsWith("__"))
                    target[property] = source[property];
            }
        }
        return target;
    }
    ;
}
AriClientServer.ariClients = {}; // All connected and authenticated clients.
AriClientServer.ariRoot = new eventemitter2_1.EventEmitter2({ wildcard: true, delimiter: '.', newListener: false, maxListeners: 100, verboseMemoryLeak: true });
exports.default = AriClientServer;
//# sourceMappingURL=C:/Users/jan/Desktop/ARI2/dist/server/ariClientServer.js.map