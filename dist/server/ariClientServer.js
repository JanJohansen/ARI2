"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require('events');
var ariClientServer = (function (_super) {
    __extends(ariClientServer, _super);
    function ariClientServer() {
        _super.call(this);
        this.emit("send", '"{"mcd":"HELLO"}');
    }
    ariClientServer.prototype.handleMessage = function (msg) {
    };
    ariClientServer.prototype.handleDisconnect = function () {
    };
    return ariClientServer;
}(events_1.EventEmitter));
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ariClientServer;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/ariClientServer.js.map