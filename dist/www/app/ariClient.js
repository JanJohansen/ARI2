"use strict";
var ariBaseProtocol_1 = require("./ariBaseProtocol");
var AriClient = (function () {
    function AriClient(name, role, password) {
        if (name === void 0) { name = "Anonymous"; }
        if (role === void 0) { role = "Unknown"; }
        if (password === void 0) { password = ""; }
        this.ariServer = new ariBaseProtocol_1.default();
        this.name = name;
        this.role = role;
        this.password = password;
    }
    AriClient.prototype.connect = function () {
        var _this = this;
        if (!this.authToken) {
            // No authToken, so we need to request it.
            this.ariServer.call("REQAUTHTOKEN", { "name": this.name, "role": this.role, "password": this.password }, function (err, result) {
                if (err) {
                    console.log("Error:", err);
                    return;
                }
                _this.name = result.name;
                _this.authToken = result.authToken;
                // Try to connect again.
                setTimeout(function () {
                    _this.connect();
                }, 1);
            });
        }
        else {
            // We have authToken, so connect "normally".
            this.ariServer.call("CONNECT", { "name": self.name, "authToken": this.authToken }, function (err, result) {
                if (err) {
                    return;
                }
                //console.log("registerClient result:", result);
                this.name = result.name;
                // Send if we have stored msg's...
                for (var i = 0; i < this._pendingMsgs.length; i++) {
                    this._ws.send(this._pendingMsgs[i]);
                }
                this._pendingMsgs = [];
                this.isConnected = true;
                if (this.onconnect)
                    this.onconnect(result);
                this._trigger("connect", result);
            });
        }
    };
    AriClient.prototype.handleError = function () {
    };
    return AriClient;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AriClient;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/www/app/ariClient.js.map