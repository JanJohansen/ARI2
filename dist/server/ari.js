"use strict";
var loggingService_1 = require('./loggingService');
var log = loggingService_1.loggingService.getLogger("ARI");
var ar;
ar = {};
var Ari = (function () {
    function Ari() {
        this.root = { clients: {} };
    }
    Ari.prototype.setClientInfo = function (clientName, clientInfo) {
        //this.root.clients[clientName].clientInfo = clientInfo;
        log.debug("New clientInfo from", clientName, ":", JSON.stringify(clientInfo, null, "\t"));
        // Merge client info with present info... Remove values, functions, etc. not in Info from client.
        var clientModel = this.root.clients[clientName];
        this.deleteRemoved(clientModel, clientInfo, "ins");
        this.deleteRemoved(clientModel, clientInfo, "outs");
        this.deleteRemoved(clientModel, clientInfo, "functions");
        // Perform deep merge from remote clientInfo to local clientModel.
        this.deepMerge(clientInfo, clientModel);
        // TODO: Make sure name is the one used in token!. (E.g. given name from server and not the default name from client.)
        //this.clientModel.name = this.name;
        // HACK FOR NOW!
        clientModel.name = clientInfo.name;
    };
    // Delete members of obj.prop that are not in newObj.prop.
    // E.g. Delete clientModel.ins.something that are not in clienInfo.ins.something 
    Ari.prototype.deleteRemoved = function (obj, newObj, prop) {
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
    Ari.prototype.deepMerge = function (source, destination) {
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
    Ari.prototype.clientConnected = function (clientName, clientServer) {
        if (!this.root.clients[clientName]) {
            this.root.clients[clientName] = { pendingAuthentication: true };
        }
        this.root.clients[clientName].__clientServer = clientServer;
        this.root.clients[clientName].connected = true;
    };
    Ari.prototype.clientDisconnected = function (clientName) {
        this.root.clients[clientName].connected = false;
        delete this.root.clients[clientName].__clientServer;
    };
    Ari.prototype.callFunction = function (path, args, callback) {
        var clientName = path.split(".")[0];
        var clientModel = this.root.clients[clientName];
        if (clientModel) {
            if (clientModel.__clientServer) {
                // Remove client name and notify setValue...
                var name = name.substring(name.indexOf(".") + 1);
                clientModel.__clientServer.callFunction("INPUT", { "name": name, "args": args });
            }
        }
    };
    Ari.prototype.getOut = function (name, callback) {
    };
    Ari.prototype.watchOut = function () {
    };
    // Client wants to set an input... 
    Ari.prototype.setInput = function (name, value) {
        var clientName = name.split(".")[0];
        var clientModel = this.root.clients[clientName];
        if (clientModel) {
            var cs = clientModel.__clientServer;
            if (cs) {
                // Remove client name and notify setValue...
                name = name.substring(name.indexOf(".") + 1);
                cs.._notify("INPUT", { "name": name, "value": value });
            }
        }
        // TODO: else check if alias
    };
    return Ari;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Ari;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/ari.js.map