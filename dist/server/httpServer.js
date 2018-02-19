"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loggingService_1 = require("./loggingService");
//var WebSocketServer = require('../../').Server;
var http = require('http');
var express = require('express');
var path = require('path');
var app = express();
var log = loggingService_1.loggingService.getLogger("httpServer");
var app = express();
/**
 * httpServer
 */
class httpServer {
    constructor() {
        var port = process.env.PORT || 4000;
        app.use(function (req, res, next) {
            log.trace(req.method, req.url);
            next();
        });
        //app.use("/", express.static(__dirname + "/dist/www"));    // Serve static files. (Note: Don't use relative path since it is relative to CWD (Current Working Dir!") Yaiks!
        app.use('/', express.static(path.resolve(__dirname, '../www')));
        app.use('/node_modules', express.static(path.resolve(__dirname, '../../node_modules')));
        log.trace("Starting httpServer..");
        this.server = http.createServer(app);
        this.server.listen(port, () => {
            log.info(`Listening on portz ${port}.`);
        });
    }
}
exports.httpServer = httpServer;
//# sourceMappingURL=C:/Users/jan/Desktop/ARI2/dist/server/httpServer.js.map