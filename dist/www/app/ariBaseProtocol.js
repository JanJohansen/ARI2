"use strict";
var AriBaseProtocol = (function () {
    function AriBaseProtocol(options) {
        if (options === void 0) { options = undefined; }
        this._nextReqId = 0; // Id to use for identifying requests and corresponding response callbacks.
        this._pendingCallbacks = {}; // Callbacks for pending server requests.
        this._pendingMsgs = []; // Buffer for messages that should have been sent while offline.    _nextReqId = 0;
        this._events = {};
        this._ws = null;
        options = options;
    }
    // Register function to be called uppon reception of specific command.
    AriBaseProtocol.prototype.on = function (cmd, successCallback) {
        if (successCallback === void 0) { successCallback = undefined; }
        this._events[cmd] = successCallback;
    };
    ;
    AriBaseProtocol.prototype.emit = function (event, data) {
        this._events[event](data);
    };
    AriBaseProtocol.prototype.handleMessage = function (message) {
        try {
            var msg = JSON.parse(message);
        }
        catch (e) {
            console.log("Error: Illegal JSON in message! - Ignoring...");
            return;
        }
        var self = this;
        if ("req" in msg) {
            // Request message.
            var cmd = msg.cmd;
            if (!cmd) {
                console.log("Error: Missing comand in telegram! - Ignoring...");
                return;
            }
            ;
            if (this._events[cmd]) {
                // Requested function name is registere for callback. Call it...
                this._events[cmd](msg.cmd, msg.data, function (err, result) {
                    // reply with results...
                    var res = {};
                    res.res = msg.req;
                    res.err = err;
                    res.result = result;
                    self.emit("send", JSON.stringify(res));
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
            self.emit(msg.cmd, msg.data);
        }
    };
    AriBaseProtocol.prototype.call = function (cmd, data, callback) {
        var msg = {};
        msg.req = this._nextReqId++;
        msg.cmd = cmd;
        msg.data = data;
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