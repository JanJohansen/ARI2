import { loggingService, consoleLogWriter } from './loggingService';
var log = loggingService.getLogger("AriWsClientServer");

import * as net from "net";
import AriClientServer from "./ariClientServer";

export default class AriTcpClientServer extends AriClientServer {

    constructor(socket) {
        super();

        var self = this;

        socket.on("message", (message) => { log.trace("->Server:", message); this.handleMessage(message); });
        this.on("toClient", (message) => { log.trace("<-Server:", message); socket.send(message); });

        socket.on("close", () => {
            // destroy and free this object!!!
            this.disconnect();
            // TBD: Check for mem-leak!!!
        });
    }
}