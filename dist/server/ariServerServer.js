"use strict";
var ariClientServer_1 = require('./ariClientServer');
var AriServerServer = (function () {
    function AriServerServer() {
        this.ari = ariClientServer_1.default.ari;
        this.clientModel = {
            name: "ARI",
            description: "ARI Server.",
            connected: true,
            __clientServer: this,
            outs: {},
            functions: {}
        };
        this.ari.clients["ARI"] = this.clientModel;
        // register all functions exposed to ari from this server!
        var fIdent = "_webcall_";
        for (var func in this) {
            if (func.substring(0, fIdent.length) == fIdent) {
                var fname = func.substring(fIdent.length);
                this.clientModel.functions[fname] = { "name": fname };
            }
        }
        this.provideValues();
    }
    // Server provided values. ****************************************************
    AriServerServer.prototype.provideValues = function () {
        var self = this;
        this.serverStarted = new Date().toISOString();
        self._server.handleValue("ari.serverStart", this.serverStarted);
        this.provideTime(0); // Starts providing time.
    };
    // Provide time when milliseconds == 0,
    AriServerServer.prototype.provideTime = function (interval) {
        var self = this;
        setTimeout(function () {
            var date = new Date();
            var ms = date.getMilliseconds();
            /*if(ms > 500) self.provideTime(2000 - ms);
            else self.provideTime(1000 - ms);*/
            self.provideTime(1000 - ms);
            // This function might run two times if ms ~999, so only report time when ms<500.
            if (ms < 500) {
                //date.setMilliseconds(0);    // Just show 000 since we should be very close and not drifting!
                self._server.handleValue("ari.time", date.toISOString());
            }
        }, interval);
    };
    AriServerServer.prototype.call = function (command, parameters, callback) {
        if (command == "CALLFUNCTION") {
            var rpcName = parameters.name;
            if (!rpcName) {
                console.log("Error: Missing name of RPC to call! - Ignoring...");
                callback("Error: Missing name of RPC to call at client!", null);
                return;
            }
            if (!"_webcall_" + rpcName in this) {
                console.log("Error: Name of RPC unknown.");
                callback("Error: RPC unkknown at client!", null);
                return;
            }
            // Call local function.
            this["_webcall_" + rpcName](parameters.params, callback);
        }
    };
    //*************************************************************************
    // Function calls on Server!
    AriServerServer.prototype._webcall_getClients = function (args, callback) {
        callback(null, this.ari.clients);
    };
    return AriServerServer;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AriServerServer;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/ariServerServer.js.map