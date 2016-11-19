"use strict";
var loggingService_1 = require('./loggingService');
var express = require('express');
var path = require('path');
var log = loggingService_1.loggingService.getLogger("httpServer");
var app = express();
/**
 * httpServer
 */
var httpServer = (function () {
    function httpServer() {
        var port = process.env.PORT || 4000;
        app.use(function (req, res, next) {
            log.info(req.method, req.url);
            next();
        });
        //app.use("/", express.static(__dirname + "/dist/www"));    // Serve static files. (Note: Don't use relative path since it is relative to CWD (Current Working Dir!") Yaiks!
        app.use('/', express.static(path.resolve(__dirname, '../www')));
        app.use('/node_modules', express.static(path.resolve(__dirname, '../../node_modules')));
        log.trace("Starting httpServer..");
        app.listen(port, function () {
            log.info("Listening on portz " + port + ".");
        });
    }
    return httpServer;
}());
exports.httpServer = httpServer;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/httpServer.js.map