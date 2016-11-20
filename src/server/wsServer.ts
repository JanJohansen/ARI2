var WebSocketServer = require('ws').Server;
import { loggingService } from './loggingService';
var log = loggingService.getLogger("wsServer");

import ariClientServer from "./ariClientServer";

export default class wsServer {

    constructor(httpServer) {
        log.debug("Starting wsServer...");
        var wss = new WebSocketServer({server: httpServer});
        wss.on('connection', (ws)=>{
            // Client connected
            log.debug('Client connected.');
            // TODO: Log IP of client... ws.upgradeReq.connection.remoteAddress doesnt work :O()

            // Create ari client and hook up to ws.
            var clientServer = new ariClientServer();

            ws.on('message', (message)=>{
                log.debug("<-", message);
                clientServer.handleMessage(message);
            });
            ws.on('close', ()=>{
                log.debug("Connection from ", ws.origin, " closed!");
                clientServer.handleDisconnect()
            });
            ws.on('error', ()=>{
                log.debug("Connection from ", ws.origin, " had error!");
                clientServer.handleDisconnect()
            });
            clientServer.on('send', (message)=> {
                if (ws.readyState !== ws.OPEN) {
                    log.error('ERROR!!! - WS not opened, trying ot send', message);
                }
                else ws.send(message);
            });
            clientServer.on('error', ()=> {
                log.debug("Error from clientServer!?");
                ws.close();
            });
        });
    }
}