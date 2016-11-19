"use strict";
var AriBaseProtocol = (function () {
    function AriBaseProtocol() {
        this._nextReqId = 0; // Id to use for identifying requests and corresponding response callbacks.
        this._pendingCallbacks = {}; // Callbacks for pending server requests.
        this._pendingMsgs = []; // Buffer for messages that should have been sent while offline.    _nextReqId = 0;
        this._cmdListeners = {};
    }
    // Register function to be called uppon reception of specific command.
    AriBaseProtocol.prototype.on = function (cmd, successCallback, errorCallback) {
        this._cmdListeners[cmd] = successCallback;
    };
    ;
    AriBaseProtocol.prototype.msgIn = function (message) {
        try {
            var msg = JSON.parse(message);
        }
        catch (e) {
            console.log("Error: Illegal JSON in message! - Ignoring...");
            return;
        }
        if ("req" in msg) {
            // Request message.
            var cmd = msg.cmd;
            if (!cmd) {
                console.log("Error: Missing comand in telegram! - Ignoring...");
                return;
            }
            ;
            if (this._cmdListeners[cmd]) {
                // Requested function name is registere for callback. Call it...
                this._cmdListeners[cmd](msg.cmd, msg.data, function (err, result) {
                    // reply with results...
                    var res = {};
                    res.res = msg.req;
                    res.err = err;
                    res.result = result;
                    self.msgOut(JSON.stringify(res));
                });
            }
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
                console.log("Error: Missing comand in telegram! - Ignoring...");
                return;
            }
            ;
            if (this._cmdListeners[cmd]) {
                // Requested function name is registere for callback. Call it...
                this._cmdListeners[cmd](msg.cmd, msg.data);
            }
        }
    };
    AriBaseProtocol.prototype.call = function (cmd, data, callback) {
        var msg = {};
        msg.req = this._nextReqId++;
        msg.cmd = command;
        msg.data = parameters;
        if (callback) {
            // if callback is provided, store it to be called when response is received.
            this._pendingCallbacks[msg.req] = callback;
        }
        this.msgOut(JSON.stringify(msg));
    };
    AriBaseProtocol.prototype.notify = function (cmd, data) {
        var msg = {};
        msg.cmd = cmd;
        msg.data = data;
        this.msgOut(JSON.stringify(msg));
    };
    return AriBaseProtocol;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AriBaseProtocol;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/www/app/ariBaseProtocol.js.map