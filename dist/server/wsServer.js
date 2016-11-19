"use strict";
var WebSocketServer = require('ws').Server;
var loggingService_1 = require('./loggingService');
var log = loggingService_1.loggingService.getLogger("wsServer");
var ariClientServer_1 = require("./ariClientServer");
var wsServer = (function () {
    function wsServer(httpServer) {
        log.debug("Starting wsServer...");
        var wss = new WebSocketServer({ port: 8080 });
        wss.on('connection', function connection(ws) {
            // Client connected
            log.debug('Client connected:', ws);
            // Create ari client and hook up to ws.
            var clientServer = new ariClientServer_1.default();
            ws.on('message', function incoming(message) {
                log.debug('Message from", ws.origin, " received: %s', message);
                clientServer.handleMessage(message);
            });
            ws.on('close', function () {
                log.debug("Connection from ", ws.origin, " closed!");
                clientServer.handleDisconnect();
            });
            ws.on('error', function () {
                log.debug("Connection from ", ws.origin, " had error!");
                clientServer.handleDisconnect();
            });
            clientServer.on('message', function (message) {
                ws.send(message);
            });
            clientServer.on('error', function () {
                log.debug("Error from clientServer!?");
                ws.close();
            });
        });
    }
    return wsServer;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = wsServer;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/wsServer.js.map