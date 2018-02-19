"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loggingService_1 = require("./loggingService");
var log = loggingService_1.loggingService.getLogger("ariClientServer");
const AriEventEmitter_1 = require("./AriEventEmitter");
var ariEvent = AriEventEmitter_1.default.getInstance();
const events_1 = require("events");
;
class AriClientServer extends events_1.EventEmitter {
    constructor() {
        super();
        this._nextReqId = 0; // Id to use for identifying requests and corresponding response callbacks.
        this._pendingCallbacks = {}; // Callbacks for pending server requests.
        this.clients = AriClientServer.clients;
        this._callsHandler = null;
        //this.ari = AriClientServer.ari;
    }
    onCalls(callsHandler) {
        this._callsHandler = callsHandler;
    }
    // Call command on client.
    _call(callName, params) {
        if (this._callsHandler)
            return this._callsHandler(callName, params);
    }
    // Notify client.
    notify(cmd, data) {
        var msg = {
            cmd: cmd,
            data: data
        };
        this.emit("notify", msg);
    }
    disconnect() {
        //IDEA!
        //this.emit(this.name+".disconnected", true);
        this.clients[this.name]._connected = false;
        delete this.clients[this.name].__clientServer;
    }
    //*************************************************************************
    //
    _webcall_REQAUTHTOKEN(pars) {
        return new Promise((resolve, reject) => {
            //{ "name": this.name, "role": this.role, "password": this.password }
            if (pars.password == "please") {
                //TODO: Ensure name is unique
                this.name = pars.name;
                resolve({ "name": pars.name, "authToken": 42 }); // No checks or now.
            }
            else
                reject("Error: AuthToken invalid!");
        });
    }
    _webcall_CONNECT(pars) {
        return new Promise((resolve, reject) => {
            //{ "name": self.name, "authToken":this.authToken }
            if (pars.authToken == 42) {
                // TODO: Use name from authToken since this is registered with ari!
                this.name = pars.name;
                if (!this.clients[this.name]) {
                    this.clients[this.name] = {
                        type: "object",
                        __name: this.name,
                        __clientServer: this,
                        _connected: true,
                        _authenticated: false
                    };
                }
                this.clients[this.name]._connected = true;
                this.clients[this.name].__clientServer = this;
                resolve({ "name": pars.name, "authToken": 42 }); // No checks or now.
            }
            else
                reject("Error: AuthToken invalid!");
        });
    }
    //*************************************************************************
    //
    _webnotify_CLIENTINFO(clientInfo) {
        log.trace("_webcall_CLIENTINFO", clientInfo);
        // log.debug("New clientInfo from", clientName, ":", JSON.stringify(clientInfo, null, "\t"));
        // Merge client info with present info... Remove values, functions, etc. not in Info from client.
        var clientModel = this.clients[this.name];
        this.deleteRemoved(clientModel, clientInfo);
        // Perform deep merge from remote clientInfo to local clientModel.
        this.deepMerge(clientModel, clientInfo);
        // Make sure name is the one used in token!. (E.g. given name from server and not the default name from client.)
        clientModel.name = this.name;
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
    // Inputs
    _webnotify_SETINPUT(args) {
        var name = args.name;
        var value = args.value;
        var clientName = name.split(".")[0];
        var clientModel = this.clients[clientName];
        if (clientModel) {
            var cs = clientModel.__clientServer;
            if (cs) {
                // Remove client name and notify setValue...
                name = name.substring(name.indexOf(".") + 1);
                args.name = name;
                cs.notify("SETINPUT", args);
            }
        }
        // TODO: else check if alias
    }
    //*************************************************************************
    // Outputs
    _webnotify_WATCHOUTPUT(args) {
        var name = args.name;
        var path = name.split(".");
        path.pop();
        var t = this.findPath(path, this.clients);
        if (t) {
            // Target found
            var ssIdx = name.indexOf(".**");
            if (ssIdx) {
                // ** listener
                t.__ssListeners = t.__ssListeners || [];
                t.__ssListeners.push(this.name);
            }
            else {
                var sIdx = name.indexOf(".*");
                if (sIdx) {
                    // * listener
                    t.__sListeners = t.__sListeners || [];
                    t.__sListeners.push(this.name);
                }
                else {
                    // non-wildcard listener
                    t.__listeners = t.__Listeners || [];
                    t.__listeners.push(this.name);
                }
            }
        }
        // Send subscription to client
        // FIXME: What if client previously subscribed
        // FIXME: How to determine when to unsubscribe @ client when no other clients subscribe?
        var clientName = name.split(".")[0];
        var clientModel = this.clients[clientName];
        if (clientModel) {
            var cs = clientModel.__clientServer;
            if (cs) {
                name = name.substring(name.indexOf(".") + 1);
                args.name = name;
                cs.notify("WATCHOUTPUT", args);
            }
        }
    }
    _webnotify_UNWATCHOUTPUT(args) {
        var name = args.name;
        var clientName = name.split(".")[0];
        var clientModel = this.ari.clients[clientName];
        if (clientModel) {
            clientModel._outputWatches[name] -= 1;
            if (clientModel._outputWatches[name] == 0)
                delete clientModel._outputWatches[name];
            var cs = clientModel.__clientServer;
            if (cs) {
                name = name.substring(name.indexOf(".") + 1);
                args.name = name;
                cs.notify("UNWATCHOUTPUT", args);
            }
        }
    }
    findPath(path, obj) {
        if (path.length > 0) {
            var name = path.shift();
            if (obj.hasOwnProperty(name)) {
                return this.findPath(path, obj[name]);
            }
            else
                return undefined;
        }
        else
            return obj;
    }
    traversePath(path, obj, cb) {
        cb(path, obj);
        if (path.length > 0) {
            var name = path.shift();
            if (obj.hasOwnProperty(name)) {
                this.traversePath(path, obj[name], cb);
            }
        }
    }
    _webnotify_OUTPUT(args) {
        var name = args.name;
        var value = args.value;
        // Convert possible alias.
        name = this.resolveAlias(name);
        this.traversePath(name.split("."), this.clients, (path, obj) => {
            log.debug("Path:" + path);
            // path exists so far. Check for ** listeners
            if (obj.__ssListener) {
                obj.__ssListener.forEach(listener => {
                    listener(name, value);
                });
            }
            // check for * listeners
            if (obj.__sListener && (path.length == 1)) {
                obj.__sListener.forEach(listener => {
                    listener(name, value);
                });
            }
            // Is this the destination value?
            if (path.length == 1) {
                var pName = path.shift();
                obj[pName] = value;
                obj.__timestamp = new Date().toISOString();
                if (obj.__listeners)
                    obj.__listeners.forEach(listener => {
                        listener(name, value);
                    });
                log.debug("Setting", name, "=", value);
            }
        });
    }
    // Find alias. Return name for alias if found. Return same name if not found.
    resolveAlias(alias) {
        return AriClientServer.aliases[alias] || alias;
    }
    findOutputByName(name) {
        var clientName = name.split(".")[0];
        // Find client.
        var client = this.clients[clientName];
        if (client) {
            var clientValueName = name.substring(name.indexOf(".") + 1);
            if (client.values)
                return client.values[clientValueName];
        }
        return undefined;
    }
}
AriClientServer.clients = {};
AriClientServer.aliases = [];
exports.default = AriClientServer;
//# sourceMappingURL=C:/Users/jan/Desktop/ARI2/dist/server/ariClientServer.js.map