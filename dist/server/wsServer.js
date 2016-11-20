"use strict";
var WebSocketServer = require('ws').Server;
var loggingService_1 = require('./loggingService');
var log = loggingService_1.loggingService.getLogger("wsServer");
var ariClientServer_1 = require("./ariClientServer");
var wsServer = (function () {
    function wsServer(httpServer) {
        log.debug("Starting wsServer...");
        var wss = new WebSocketServer({ server: httpServer });
        wss.on('connection', function (ws) {
            // Client connected
            log.debug('Client connected.');
            // TODO: Log IP of client... ws.upgradeReq.connection.remoteAddress doesnt work :O()
            // Create ari client and hook up to ws.
            var clientServer = new ariClientServer_1.default();
            ws.on('message', function (message) {
                log.debug("<-", message);
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
            clientServer.on('send', function (message) {
                if (ws.readyState !== ws.OPEN) {
                    log.error('ERROR!!! - WS not opened, trying ot send', message);
                }
                else
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