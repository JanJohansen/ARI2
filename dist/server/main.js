// DONT delete: Will break typescript compilation! - Not finding node_modules! No idea why!?!??
/// <reference path="../../typings/index.d.ts" />
"use strict";
// Set up logging before loading any other modules! 
var loggingService_1 = require('./loggingService');
loggingService_1.loggingService.setDefaultLevel("trace");
loggingService_1.loggingService.addWriter(new loggingService_1.consoleLogWriter({ timestamp: true }));
var log = loggingService_1.loggingService.getLogger("Main");
log.info("ARI 2.0 Starting.");
var httpServer_1 = require('./httpServer');
//import wsServer from './wsServer';
//import Executor from './nodeExecutor';
var PluginLoader_1 = require('./PluginLoader');
var ariClientServer_1 = require('./ariClientServer');
var AriEventEmitter_1 = require('./AriEventEmitter');
var ariEvents = AriEventEmitter_1.default.getInstance();
var WebSocketServer = require('ws').Server;
//*****************************************************************************
ariEvents.onAny(function (event, args) {
    log.trace("!!", event); //, args);
});
// Log uncaught exceptions.
process.on('uncaughtException', function (error) {
    log.fatal(error);
    // TODO: Write (synchroneously) to special crash log file...
    // The correct use of 'uncaughtException' is to perform synchronous cleanup of allocated resources 
    // (e.g. file descriptors, handles, etc) before shutting down the process. 
    // It is not safe to resume normal operation after 'uncaughtException'.
    process.exit(1);
});
process.on("SIGINT", function () {
    log.warn("User typed Ctrl+C... Shutting down.");
    process.exit();
});
//*****************************************************************************
// Enable user to properly close down server...
process.stdin.resume();
process.stdin.setEncoding("ascii");
process.stdin.on('data', function (text) {
    //log.info('received data:', text);
    if (text == "q\r\n") {
        handleNormalExit(); // TODO: Doesn't seem to work!?
    }
    handleNormalExit(); // Use "AnyKey" for now!
});
function handleNormalExit() {
    log.warn('User shut down.');
    //ari.shutDown();
    //saveDebug(true);
    process.exit();
}
//*****************************************************************************
// Start httpServer + websocketServer....
var http = new httpServer_1.httpServer();
var wss = new WebSocketServer({ server: http.server });
// Set up "mediator" between components.
wss.on("connection", function (ws) {
    log.trace("Client connecting");
    var acs = new ariClientServer_1.default();
    ws.on("message", function (msg) {
        log.trace("<-", msg);
        acs.msgIn(msg);
    });
    acs.on("msgOut", function (tlg) {
        log.trace("->", tlg);
        ws.send(tlg);
    });
    acs.on("closeOut", function (tlg) { ws.close(); });
    ws.on("error", function () { acs.disconnect(); });
    ws.on("close", function () { acs.disconnect(); });
    // Will acs leak memmory after disconnection?
});
//*****************************************************************************
// Start plugins
PluginLoader_1.default.start();
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/main.js.map