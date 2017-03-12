"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var loggingService_1 = require('./loggingService');
var log = loggingService_1.loggingService.getLogger("ariClientServer");
var AriEventEmitter_1 = require('./AriEventEmitter');
var ariEvent = AriEventEmitter_1.default.getInstance();
var events_1 = require('events');
var AriClientServer = (function (_super) {
    __extends(AriClientServer, _super);
    function AriClientServer() {
        _super.call(this);
        this._nextReqId = 0; // Id to use for identifying requests and corresponding response callbacks.
        this._pendingCallbacks = {}; // Callbacks for pending server requests.
        this.ari = AriClientServer.ari;
    }
    AriClientServer.prototype.msgIn = function (message) {
        try {
            var msg = JSON.parse(message);
        }
        catch (e) {
            log.error("Error: Illegal JSON in message! - Ignoring...");
            this.emit("closeOut");
            return;
        }
        var self = this;
        if ("req" in msg) {
            // Request message.
            var cmd = msg.cmd;
            if (!cmd) {
                log.error("Error: Missing comand in telegram! - Ignoring...");
                return;
            }
            ;
            // Call requested function if it exists.
            if (this["_webcall_" + cmd]) {
                this["_webcall_" + cmd](msg.data, function (err, result) {
                    // reply with results...
                    var res = {};
                    res.res = msg.req;
                    res.err = err;
                    res.result = result;
                    self.emit("msgOut", JSON.stringify(res));
                });
            }
            else
                log.error("Handler for ariProtocol message", cmd, "not implemented!");
        }
        else if ("res" in msg) {
            // Response message.
            var responseId = msg.res;
            // Get stored callback from calling function.
            var callback = this._pendingCallbacks[msg.res];
            if (callback) {
                delete this._pendingCallbacks[msg.res];
                //try {
                callback(msg.err, msg.result);
            }
            else {
            }
        }
        else {
            // Notofication message.
            var cmd = msg.cmd;
            if (!cmd) {
                log.error("Error: Missing comand in telegram! - Ignoring...");
                return;
            }
            ;
            if (this["_webnotify_" + cmd]) {
                this["_webnotify_" + cmd](msg.data);
            }
        }
    };
    // Call command on client.
    AriClientServer.prototype.call = function (cmd, data, callback) {
        var msg = {};
        msg.req = this._nextReqId++;
        msg.cmd = cmd;
        msg.data = data;
        if (callback) {
            // if callback is provided, store it to be called when response is received.
            this._pendingCallbacks[msg.req] = callback;
        }
        this.emit("msgOut", JSON.stringify(msg));
    };
    // Notify client.
    AriClientServer.prototype.notify = function (cmd, data) {
        var msg = {};
        msg.cmd = cmd;
        msg.data = data;
        this.emit("msgOut", JSON.stringify(msg));
    };
    AriClientServer.prototype.disconnect = function () {
        //IDEA!
        this.emit(this.name + ".disconnected", true);
        this.ari.clients[this.name].connected = false;
        delete this.ari.clients[this.name].__clientServer;
    };
    //*************************************************************************
    //
    AriClientServer.prototype._webcall_REQAUTHTOKEN = function (pars, callback) {
        //{ "name": this.name, "role": this.role, "password": this.password }
        if (pars.password == "please") {
            //TODO: Ensure name is unique
            this.name = pars.name;
            callback(null, { "name": pars.name, "authToken": 42 }); // No checks or now.
        }
        else
            callback("Error: Wrong password.", null);
    };
    AriClientServer.prototype._webcall_CONNECT = function (pars, callback) {
        //{ "name": self.name, "authToken":this.authToken }
        if (pars.authToken == 42) {
            // TODO: Use name from authToken since this is registered with ari!
            this.name = pars.name;
            if (!this.ari.clients[this.name]) {
                this.ari.clients[this.name] = { name: this.name, connected: true, pendingAuthentication: true };
            }
            this.ari.clients[this.name].connected = true;
            this.ari.clients[this.name].__clientServer = this;
            callback(null, { "name": pars.name, "authToken": 42 }); // No checks or now.
        }
        else
            callback("Error: AuthToken invalid!", null);
    };
    //*************************************************************************
    //
    AriClientServer.prototype._webnotify_CLIENTINFO = function (clientInfo) {
        log.trace("_webcall_CLIENTINFO", clientInfo);
        //        log.debug("New clientInfo from", clientName, ":", JSON.stringify(clientInfo, null, "\t"));
        // Merge client info with present info... Remove values, functions, etc. not in Info from client.
        var clientModel = this.ari.clients[this.name];
        this.deleteRemoved(clientModel, clientInfo, "ins");
        this.deleteRemoved(clientModel, clientInfo, "outs");
        this.deleteRemoved(clientModel, clientInfo, "functions");
        // Perform deep merge from remote clientInfo to local clientModel.
        this.deepMerge(clientInfo, clientModel);
        // Make sure name is the one used in token!. (E.g. given name from server and not the default name from client.)
        clientModel.name = this.name;
    };
    // Delete members of obj.prop that are not in newObj.prop.
    // E.g. Delete clientModel.ins.something that are not in clienInfo.ins.something 
    AriClientServer.prototype.deleteRemoved = function (obj, newObj, prop) {
        if (newObj[prop]) {
            for (var key in obj[prop]) {
                if (!newObj[prop][key]) {
                    // value removed from clientInfo - remove from clientModel.
                    delete obj[prop][key];
                }
            }
        }
        else
            delete obj[prop].ins;
    };
    AriClientServer.prototype.deepMerge = function (source, destination) {
        for (var property in source) {
            if (typeof source[property] === "object" && source[property] !== null) {
                destination[property] = destination[property] || {};
                this.deepMerge(source[property], destination[property]);
            }
            else {
                destination[property] = source[property];
            }
        }
        return destination;
    };
    ;
    AriClientServer.prototype.getAlias = function (alias) {
        return "";
    };
    //*************************************************************************
    // Inputs
    AriClientServer.prototype._webnotify_SETINPUT = function (args) {
        var name = args.name;
        var value = args.value;
        var clientName = name.split(".")[0];
        var clientModel = this.ari.clients[clientName];
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
    };
    //*************************************************************************
    // Outputs
    AriClientServer.prototype._webnotify_WATCHOUTPUT = function (args) {
        var name = args.name;
        var clientName = name.split(".")[0];
        var clientModel = this.ari.clients[clientName];
        if (clientModel) {
            if (!clientModel._outputWatches[name])
                clientModel._outputWatches[name] = 0;
            clientModel._outputWatches[name] += 1;
            ariEvent.on("out." + name, function (_a) {
                var data = _a.data, name = _a.name;
                name = name.substring(name.indexOf(".") + 1);
                args.name = name;
                args.data = data;
                cs.notify("OUTPUT", args);
            });
            var cs = clientModel.__clientServer;
            if (cs) {
                name = name.substring(name.indexOf(".") + 1);
                args.name = name;
                cs.notify("WATCHOUTPUT", args);
            }
        }
    };
    AriClientServer.prototype._webnotify_UNWATCHOUTPUT = function (args) {
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
    };
    AriClientServer.prototype._webnotify_OUTPUT = function (args) {
        var name = args.name;
        var data = args.data;
        // Convert possible alias.
        name = this.resolveAlias(name);
        var clientName = name.split(".")[0];
        var clientModel = this.ari.clients[clientName];
        if (clientModel) {
            // Store last value and time of update.
            if (clientModel.outs) {
                var clientValueName = name.substring(name.indexOf(".") + 1);
                var clientValue = clientModel.outs[clientValueName];
                if (clientValue) {
                    clientValue.data = data;
                    clientValue.updated = new Date().toISOString();
                }
            }
            // Notify listeners about change of output.
            ariEvent.emit("out." + name, { name: name, data: data });
        }
    };
    // Find alias. Return name for alias if found. Return same name if not found.
    AriClientServer.prototype.resolveAlias = function (alias) {
        return AriClientServer.aliases[alias] || alias;
    };
    AriClientServer.prototype.findOutputByName = function (name) {
        var clientName = name.split(".")[0];
        // Find client.
        var client = this.clientModels[clientName];
        if (client) {
            var clientValueName = name.substring(name.indexOf(".") + 1);
            if (client.values)
                return client.values[clientValueName];
        }
        return undefined;
    };
    /*****************************************************************************/
    // Match possible wildcarded strA to strB.
    AriClientServer.prototype.matches = function (strA, strB) {
        if (strA == strB)
            return true;
        var aPos = strA.indexOf('*');
        if (aPos >= 0) {
            var aStr = strA.substring(0, aPos);
            if (aStr == strB.substring(0, aPos))
                return true;
        }
        return false;
    };
    //*************************************************************************
    // Funcitions
    AriClientServer.prototype._webcall_CALL = function (args, callback) {
        var name = args.name;
        var params = args.params;
        var clientName = name.split(".")[0];
        var clientModel = this.ari.clients[clientName];
        if (clientModel) {
            var cs = clientModel.__clientServer;
            if (cs) {
                name = name.substring(name.indexOf(".") + 1);
                cs.call(name, params, callback);
            }
        }
    };
    AriClientServer.ari = { clients: {}, users: {} };
    AriClientServer.aliases = [];
    return AriClientServer;
}(events_1.EventEmitter));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AriClientServer;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/ariClientServer.js.map