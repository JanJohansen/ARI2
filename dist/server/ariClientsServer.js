"use strict";
var loggingService_1 = require('./loggingService');
var log = loggingService_1.loggingService.getLogger("AriClientsServer");
var AriEventEmitter_1 = require('./AriEventEmitter');
var ariEvent = AriEventEmitter_1.default.getInstance();
var ariClientServer_1 = require('./ariClientServer');
var AriClientsServer = (function () {
    function AriClientsServer() {
        ariEvent.on("client.connect", function (connection) {
            if (!connection.ariClientServer) {
                // connection doesd not have a clientserver yet, so create and attach.
                var ariCS = new ariClientServer_1.default(connection);
                connection.ariClientServer = ariCS;
                ;
            }
        });
        ariEvent.on("client.message", function (connection, message) {
            connection.ariClientServer.handleMessage(message);
        });
        ariEvent.on("client.disconnect", function (connection) {
            connection.ariClientServer.handleDisconnect();
            delete connection.ariClientServer;
        });
    }
    return AriClientsServer;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AriClientsServer;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/ariClientsServer.js.map