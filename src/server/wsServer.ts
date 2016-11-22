import { loggingService } from './loggingService';
var log = loggingService.getLogger("wsServer");
import AriEventEmitter from './AriEventEmitter';
var ariEvent: any = AriEventEmitter.getInstance();

var WebSocketServer = require('ws').Server;


export default class wsServer {

    constructor(httpServer) {
        log.debug("Starting wsServer...");
        var wss = new WebSocketServer({server: httpServer});
        wss.on('connection', (ws)=>{
            // Client connected
            log.debug('Client connected.');
            // TODO: Log IP of client... ws.upgradeReq.connection.remoteAddress doesnt work :O()

            // New object representing this new connection!
            // Whis will be used for all consecutive messages relating to this connection.
            // Listerners, participating in handling this connection can then add their handlers 
            // to the object and use the same handler for subsequent calls.!
            var connection: any = {};    
            connection.webSocket = ws;

            ariEvent.emit("client.connect", connection);

            ws.on('message', (message)=>{
                log.debug("<-", message);
                ariEvent.emit("client.message", connection, message);
            });
            ws.on('close', ()=>{
                log.debug("Connection from ", ws.origin, " closed!");
                ariEvent.emit("client.disconnect", connection);
                delete connection.webSocket;
            });
            ws.on('error', ()=>{
                log.debug("Connection from ", ws.origin, " had error!");
                ariEvent.emit("client.disconnect", connection);
                delete connection.webSocket;
            });
            
            ariEvent.on("ariClientServer.send", (connection, message)=>{
                var ws = connection.webSocket;
                if (ws.readyState !== ws.OPEN) {
                    log.error('ERROR!!! - WS not opened, trying to send', message);
                }
                else {
                    log.debug("->", message);
                    ws.send(message);
                }
            });

            ariEvent.on("ariClientServer.close", (connection, message)=>{
                var ws = connection.webSocket;
                log.debug("Error from clientServer!?");
                ws.close();
                delete connection.webSocket;
            });
        });
    }
}