"use strict";
var loggingService_1 = require('./loggingService');
var log = loggingService_1.loggingService.getLogger("wsServer");
var AriEventEmitter_1 = require('./AriEventEmitter');
var ariEvent = AriEventEmitter_1.default.getInstance();
var WebSocketServer = require('ws').Server;
var wsServer = (function () {
    function wsServer(httpServer) {
        log.debug("Starting wsServer...");
        var wss = new WebSocketServer({ server: httpServer });
        wss.on('connection', function (ws) {
            // Client connected
            log.debug('Client connected.');
            // TODO: Log IP of client... ws.upgradeReq.connection.remoteAddress doesnt work :O()
            // New object representing this new connection!
            // Whis will be used for all consecutive messages relating to this connection.
            // Listerners, participating in handling this connection can then add their handlers 
            // to the object and use the same handler for subsequent calls.!
            var connection = {};
            connection.webSocket = ws;
            ariEvent.emit("client.connect", connection);
            ws.on('message', function (message) {
                log.debug("<-", message);
                ariEvent.emit("client.message", connection, message);
            });
            ws.on('close', function () {
                log.debug("Connection from ", ws.origin, " closed!");
                ariEvent.emit("client.disconnect", connection);
                delete connection.webSocket;
            });
            ws.on('error', function () {
                log.debug("Connection from ", ws.origin, " had error!");
                ariEvent.emit("client.disconnect", connection);
                delete connection.webSocket;
            });
            ariEvent.on("ariClientServer.send", function (connection, message) {
                var ws = connection.webSocket;
                if (ws.readyState !== ws.OPEN) {
                    log.error('ERROR!!! - WS not opened, trying to send', message);
                }
                else {
                    log.debug("->", message);
                    ws.send(message);
                }
            });
            ariEvent.on("ariClientServer.close", function (connection, message) {
                var ws = connection.webSocket;
                log.debug("Error from clientServer!?");
                ws.close();
                delete connection.webSocket;
            });
        });
    }
    return wsServer;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = wsServer;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/wsServer.js.map