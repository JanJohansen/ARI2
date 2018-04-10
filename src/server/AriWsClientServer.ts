import { loggingService, consoleLogWriter } from './loggingService';
var log = loggingService.getLogger("AriWsClientServer");

import * as net from "net";
import AriClientServer from "./ariClientServer";

export default class AriWsClientServer extends AriClientServer {
    constructor(socket) {
        super();

        socket.on("message", (message) => { log.trace(this.name + "->Server:", message); this.receive(JSON.parse(message)); });
        this.onSend = (message) => { 
            let msg = JSON.stringify(message, AriWsClientServer.no__jsonReplacer);
            log.trace(this.name + "<-Server:", msg); 
            socket.send(msg); 
        };

        socket.on("close", () => {
            // destroy and free this object!!!
            this.disconnect();
            // TBD: Check for mem-leak!!!
        });
    }
    static no__jsonReplacer(key, value) {
        if (key.startsWith("__")) return undefined;
        else return value;
    }
}