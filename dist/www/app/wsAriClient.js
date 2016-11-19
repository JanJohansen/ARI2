"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var ariClient_1 = require("./ariClient");
var wsAriClient = (function (_super) {
    __extends(wsAriClient, _super);
    function wsAriClient() {
        _super.call(this);
        this._ws = null;
        this._wsSend = function (msg) {
            if (!this._ws) {
                console.log("Storing message until connected...");
                this._pendingMsgs.push(msg);
            }
            else if (this._ws.readyState != this._ws.OPEN) {
                console.log("Storing message until connected...");
                this._pendingMsgs.push(msg);
            }
            else
                this._ws.send(msg);
        };
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
        var self = this;
        // Open socket!
        if (!this._ws) {
            //console.log("Creating WSocket!");
            this._ws = new WebSocket(this.url);
        }
        this._ws.onopen = function () {
            _super.connect.call(this);
        };
    };
    return wsAriClient;
}(ariClient_1.default));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = wsAriClient;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/www/app/wsAriClient.js.map