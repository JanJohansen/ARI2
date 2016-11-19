"use strict";
var ariClient_1 = require("./ariClient");
var wsAriClient = (function () {
    function wsAriClient() {
        this.reconnectInterval = 2000; // Interval in ms.
        this._ws = null;
        this._pendingTlgs = []; // Buffer for messages that should have been sent while offline.
        this.ariClient = new ariClient_1.default();
        // Check if we are in browser or in nodejs.
        if (typeof window === 'undefined') {
            // We're in NodeJS
            WebSocket = require('ws');
            this.url = "ws://localhost:4000/socket/";
        }
        else {
            // We're in a browser.
            this.url = "ws://" + window.location.host;
        }
        //this.connect();
    }
    wsAriClient.prototype.connect = function () {
        var _this = this;
        var self = this;
        // Open socket!
        if (!this._ws) {
            //console.log("Creating WSocket!");
            this._ws = new WebSocket(this.url);
            this._ws.onopen = function () {
                _this.ariClient.connect();
            };
            this._ws.onmessage = function (message) {
                _this.ariClient.handleMessage(message);
            };
            this._ws.onerror = function () {
                console.log('Socket error... Will try to reconnect...');
                if (self._ws) {
                    self._ws.close();
                    self._ws = null;
                }
                setTimeout(self.connect.bind(self), self.reconnectInterval);
                _this.ariClient.handleError();
            };
            this._ws.onclose = function () {
                console.log('Socket closed... Will try to reconnect...');
                if (self._ws) {
                    self._ws.close();
                    self._ws = null;
                }
                setTimeout(self._connect.bind(self), self.reconnectInterval);
                _this.ariClient.handleError();
            };
            this.ariClient.onSendToServer = function (telegram) {
                _this._ws.send(telegram);
            };
        }
    };
    return wsAriClient;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = wsAriClient;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/www/app/ariWsClient.js.map