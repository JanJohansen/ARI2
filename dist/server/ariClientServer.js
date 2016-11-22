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
var ariClientServer = (function (_super) {
    __extends(ariClientServer, _super);
    function ariClientServer(ari) {
        _super.call(this);
        this._nextReqId = 0; // Id to use for identifying requests and corresponding response callbacks.
        this._pendingCallbacks = {}; // Callbacks for pending server requests.
        this.ari = ari;
    }
    ariClientServer.prototype.msgIn = function (message) {
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
    ariClientServer.prototype.call = function (cmd, data, callback) {
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
    ariClientServer.prototype.notify = function (cmd, data) {
        var msg = {};
        msg.cmd = cmd;
        msg.data = data;
        this.emit("msgOut", JSON.stringify(msg));
    };
    ariClientServer.prototype.disconnect = function () {
        this.ari.clientConnected(this.name);
    };
    ariClientServer.prototype._webcall_REQAUTHTOKEN = function (pars, callback) {
        //{ "name": this.name, "role": this.role, "password": this.password }
        if (pars.password == "please") {
            //TODO: Ensure name is unique
            this.name = pars.name;
            callback(null, { "name": pars.name, "authToken": 42 }); // No checks or now.
        }
        else
            callback("Error: Wrong password.", null);
    };
    ariClientServer.prototype._webcall_CONNECT = function (pars, callback) {
        //{ "name": self.name, "authToken":this.authToken }
        if (pars.authToken == 42) {
            // TODO: Use name from authToken since this is registered with ari!
            this.name = pars.name;
            callback(null, { "name": pars.name, "authToken": 42 }); // No checks or now.
            this.ari.clientConnected(this.name);
        }
        else
            callback("Error: AuthToken invalid!", null);
    };
    //-----------------------------------------------------------------------------
    ariClientServer.prototype._webnotify_CLIENTINFO = function (clientInfo) {
        log.trace("_webcall_CLIENTINFO", clientInfo);
        this.ari.setClientInfo(this.name, clientInfo);
    };
    return ariClientServer;
}(events_1.EventEmitter));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ariClientServer;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/ariClientServer.js.map