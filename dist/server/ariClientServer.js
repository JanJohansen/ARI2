"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loggingService_1 = require("./loggingService");
var log = loggingService_1.loggingService.getLogger("ariClientServer");
const events_1 = require("events");
const PubSubStore_1 = require("../common/PubSubStore");
class AriClientServer extends events_1.EventEmitter {
    constructor() {
        super();
        this._nextReqId = 0; // Id to use for identifying requests and corresponding response callbacks.
        this._pendingCallbacks = {}; // Callbacks for pending server requests.
        this._callsHandler = null;
        this.suCBFunc = this.subCB.bind(this);
    }
    handleMessage(json) {
        log.debug("HandleMsg:", json);
        var msg;
        try {
            msg = JSON.parse(json);
        }
        catch (e) {
            log.error("Error in JSON message from server. Ignoring message.");
        }
        let cmd = msg.cmd;
        if ("_remote_" + cmd in this)
            this["_remote_" + cmd](msg);
        else
            log.error("Server trying to call unknown method:", cmd);
    }
    _remote_sub(msg) {
        AriClientServer.psStore.sub(msg.name, this.suCBFunc);
    }
    subCB(name, value) {
        this.send({ cmd: "pub", name: name, value: value });
    }
    _remote_pub(msg) {
        AriClientServer.psStore.pub("Services." + this.name + "." + msg.name, msg.value);
    }
    _remote_set(msg) {
        AriClientServer.psStore.pub("Services." + this.name + "." + msg.name, msg.value);
    }
    static no__jsonReplacer(key, value) {
        if (key.startsWith("__"))
            return undefined;
        else
            return value;
    }
    send(msg) {
        this.emit("toClient", JSON.stringify(msg, AriClientServer.no__jsonReplacer));
    }
    disconnect() {
        AriClientServer.psStore.clearSubs(this.suCBFunc);
        delete AriClientServer.psStore.getTopic("Services." + this.name).__ClientServer;
        AriClientServer.psStore.pub("Services." + this.name + ".connected", false);
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
    _remote_auth(pars) {
        if (pars.token == 42) {
            // TODO: Use name from authToken since this is registered with ari!
            this.name = pars.name;
            var service = AriClientServer.psStore.getTopic("Services." + this.name);
            if (!service) {
                AriClientServer.psStore.setAttributes("Services." + this.name, {
                    _clientServer: this,
                    connected: true,
                    authenticated: false
                });
                // publish new clients list
                var list = [];
                for (var key in AriClientServer.psStore.getTopic("Services")) {
                    list.push(key);
                }
                AriClientServer.psStore.pub("ARI.services", list);
            }
            AriClientServer.psStore.setAttributes("Services." + this.name, {
                _clientServer: this,
                connected: true,
                authenticated: false
            });
            this.send({ cmd: "authOk", name: pars.name, "token": 42 }); // No checks or now.
        }
        else
            this.send({ cmd: "authNok", name: pars.name, "token": 42 }); // No checks or now.
    }
    //*************************************************************************
    //
    _remote_clientinfo(msg) {
        var clientInfo = msg.clientInfo;
        log.trace("_remote_CLIENTINFO", clientInfo);
        // log.debug("New clientInfo from", clientName, ":", JSON.stringify(clientInfo, null, "\t"));
        // Merge client info with present info... Remove values, functions, etc. not in Info from client.
        var clientModel = AriClientServer.psStore.getTopic("Services." + this.name);
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
    // Find alias. Return name for alias if found. Return same name if not found.
    resolveAlias(alias) {
        return AriClientServer.aliases[alias] || alias;
    }
}
AriClientServer.aliases = [];
AriClientServer.psStore = new PubSubStore_1.default();
exports.default = AriClientServer;
//# sourceMappingURL=C:/Users/jan/Desktop/ARI2/dist/server/ariClientServer.js.map