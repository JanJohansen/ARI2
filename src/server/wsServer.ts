var WebSocketServer = require('ws').Server;
import { loggingService } from './loggingService';
var log = loggingService.getLogger("wsServer");

import ariClientServer from "./ariClientServer";

export default class wsServer {

    constructor(httpServer) {
        log.debug("Starting wsServer...");
        var wss = new WebSocketServer({ port: 8080 });
        
        wss.on('connection', function connection(ws) {
            // Client connected
            log.debug('Client connected:', ws);

            // Create ari client and hook up to ws.
            var clientServer = new ariClientServer();

            ws.on('message', function incoming(message) {
                log.debug('Message from", ws.origin, " received: %s', message);
                clientServer.handleMessage(message);
            });
            ws.on('close', () => {
                log.debug("Connection from ", ws.origin, " closed!");
                clientServer.handleDisconnect()
            });
            ws.on('error', () => {
                log.debug("Connection from ", ws.origin, " had error!");
                clientServer.handleDisconnect()
            });
            clientServer.on('message', (message)=> {
                ws.send(message);
            });
            clientServer.on('error', ()=> {
                log.debug("Error from clientServer!?");
                ws.close();
            });
        });
    }
}