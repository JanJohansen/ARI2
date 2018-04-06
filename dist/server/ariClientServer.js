"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loggingService_1 = require("./loggingService");
var log = loggingService_1.loggingService.getLogger("ariClientServer");
const events_1 = require("events");
const AriObjectModel_1 = require("../common/AriObjectModel");
class AriClientServer extends events_1.EventEmitter {
    constructor() {
        super();
        this.ariRoot = AriClientServer.ariRoot;
        this._nextReqId = 0; // Id to use for identifying requests and corresponding response callbacks.
        this._pendingCallbacks = {}; // Callbacks for pending server requests.
        this._callsHandler = null;
        this.subCBFunc = this.subCB.bind(this);
        this.connected = false;
        this.connected = true;
        // Special out handling for server!
        this.ariRoot.on("out", (evt) => {
            evt.source.value = evt.value;
        });
    }
    handleMessage(json) {
        //log.debug("HandleMsg:", json);
        var msg;
        try {
            msg = JSON.parse(json);
        }
        catch (e) {
            log.error("Error in JSON message from server. Ignoring message.");
        }
        if ("evt" in msg) {
            // No special handling. Forward cmd to client if it subscribes.
            if ("target" in msg) {
                var node = this.ariRoot.findOrCreate(msg.target);
                node.inject({ evt: msg.evt, value: msg.value });
            }
            else if ("source" in msg) {
                // TODO: Check if this works!!
                //var node = this.ariRoot.findOrCreate("Clients." + this.name + "." + msg.source);
                //if(msg.evt == "clientInfo")
                //    console.log("!!!");
                var node = this.ariThis.findOrCreate(msg.source);
                node.emit({ evt: msg.evt, value: msg.value });
            }
        }
        else if ("cmd" in msg) {
            let cmd = msg.cmd;
            if ("_remote_" + cmd in this)
                this["_remote_" + cmd](msg);
            else
                console.log("Error: Server trying to call unknown method:", cmd);
        }
    }
    //*************************************************************************
    // IO handling
    _remote_on(msg) {
        var obj = this.ariRoot.findOrCreate(msg.path);
        obj.on(msg.name, this.subCBFunc);
        // Special handling for server... 
        // Traverse eventtree to send out-values that have values stored on them.
        this.traverseAll(obj, (node) => {
            if ("value" in node) {
                this.send({ evt: "out", source: this.ariRoot.pathToHere(node), value: node.value });
            }
        });
    }
    traverseAll(obj, cb) {
        cb(obj);
        for (let prop in obj) {
            if (obj[prop] instanceof AriObjectModel_1.AriNode && obj[prop] != obj.__parent)
                this.traverseAll(obj[prop], cb);
        }
    }
    subCB(evt) {
        if ("source" in evt)
            this.send({ evt: evt.evt, source: this.ariRoot.pathToHere(evt.source), value: evt.value });
        if ("target" in evt)
            this.send({ evt: evt.evt, target: this.ariThis.pathToHere(evt.target), value: evt.value });
    }
    //*************************************************************************
    // Function handling
    _remote_call(msg) {
        var ariFunction = this.ariRoot.findOrCreate(msg.name);
        ariFunction.inject({ evt: "call", value: { id: this._nextReqId++, args: msg.args } });
    }
    _remote_return(msg) {
        //var ariFunction = this.ariRoot.findOrCreate(msg.name);
        //ariFunction.dispatchEvent(new AriEvent("call", { target: ariFunction, args: msg.args }));
    }
    //*************************************************************************
    // support functions
    static no__jsonReplacer(key, value) {
        if (key.startsWith("__"))
            return undefined;
        else
            return value;
    }
    send(msg) {
        if (this.connected)
            this.emit("toClient", JSON.stringify(msg, AriClientServer.no__jsonReplacer));
    }
    disconnect() {
        this.connected = false;
        this.ariThis.clearListeners("out", this.subCBFunc);
        this.ariThis["__ClientServer"] = null;
        this.ariThis["__authenticated"] = false;
        //ariThis.outs.connected.value = false;
    }
    //*************************************************************************
    // Authentication handling
    _remote_auth(msg) {
        if (msg.token == 42) {
            // TODO: Use name from authToken since this is registered with ari!
            this.name = this.generateUniqueName(msg.name);
            this.ariThis = this.ariRoot.findOrCreate("Clients." + this.name);
            this.ariThis.__clientServer = this;
            this.ariThis.__authenticated = true;
            //ariThis.addOutput("connected");
            //ariThis.outs.connected.value = true;
            this.ariThis.on("call", (evt) => {
                // Someone requested to call function on this connected client.
                this.send({ evt: "call", name: evt.target.name, args: evt.value });
            });
            this.ariThis.on("clientInfo", (evt) => {
                // FIXME:
                log.debug("*** ClientInfoEvt:", evt);
            });
            this.send({ cmd: "authOk", name: msg.name, "token": 42 }); // No checks for now.
        }
        else
            this.send({ cmd: "authNok", name: msg.name, "token": 42 }); // No checks for now.
    }
    generateUniqueName(name) {
        var newName = name;
        var idx = 1;
        var clients = this.ariRoot.findOrCreate("Clients");
        while (newName in clients) {
            newName = name + "(" + idx.toString() + ")";
            idx++;
        }
        return newName;
    }
    //*************************************************************************
    // Client info handling
    _remote_clientinfo(msg) {
        var clientInfo = msg.clientInfo;
        log.trace("_remote_CLIENTINFO", clientInfo);
        // log.debug("New clientInfo from", clientName, ":", JSON.stringify(clientInfo, null, "\t"));
        // Merge client info with present info... Remove values, functions, etc. not in Info from client.
        //var clientModel = this.ariRoot.findOrCreate("Clients." + this.name);
        //clientModel.updateModel(clientInfo);
        // Make sure name is the one used in token!. (E.g. given name from server and not the default name from client.)
        //        clientModel.name = this.name;
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
    //*************************************************************************
    // Alias handling
    // Find alias. Return name for alias if found. Return same name if not found.
    resolveAlias(alias) {
        return AriClientServer.aliases[alias] || alias;
    }
}
AriClientServer.aliases = [];
AriClientServer.ariRoot = new AriObjectModel_1.AriNode(null, "AriRoot");
exports.default = AriClientServer;
//# sourceMappingURL=C:/Users/jan/Desktop/ARI2/dist/server/ariClientServer.js.map