import { loggingService } from './loggingService';
import * as express from 'express';

var log = loggingService.getLogger("httpServer");
var app = express();

/**
 * httpServer
 */
export class httpServer {
    constructor() {
        let port = 2222;
        app.use('/', express.static(__dirname));// + '../'));
        log.trace("Starting httpServer...");
        app.listen(port, function () {
            log.info(`Listening on port ${port}.`);
        });
    }
}
