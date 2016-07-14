"use strict";
const loggingService_1 = require('./loggingService');
const express = require('express');
var log = loggingService_1.loggingService.getLogger("httpServer");
var app = express();
/**
 * httpServer
 */
class httpServer {
    constructor() {
        let port = 2222;
        app.use('/', express.static(__dirname)); // + '../'));
        log.trace("Starting httpServer...");
        app.listen(port, function () {
            log.info(`Listening on port ${port}.`);
        });
    }
}
exports.httpServer = httpServer;

//# sourceMappingURL=httpServer.js.map