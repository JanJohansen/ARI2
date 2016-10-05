import { loggingService } from './loggingService';
import express = require('express');
import path = require('path');

var log = loggingService.getLogger("httpServer");
var app = express();

/**
 * httpServer
 */
export class httpServer {
    constructor() {
        var port: number = process.env.PORT || 4000;
        
        app.use(function (req, res, next) {
            log.info(req.method, req.url);
            next();
        });
        
        //app.use("/", express.static(__dirname + "/dist/www"));    // Serve static files. (Note: Don't use relative path since it is relative to CWD (Current Working Dir!") Yaiks!
        app.use('/', express.static(path.resolve(__dirname, '../www')));
        app.use('/node_modules', express.static(path.resolve(__dirname, '../../node_modules')));

        log.trace("Starting httpServer..");
        app.listen(port, function () {
            log.info(`Listening on portz ${port}.`);
        });
    } 
}
