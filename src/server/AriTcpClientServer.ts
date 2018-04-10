import { loggingService, consoleLogWriter } from './loggingService';
var log = loggingService.getLogger("AriTcpClientServer");

import * as net from "net";
import JsonSeparator from "../common/JsonSeparator";
import AriClientServer from "./ariClientServer";

export default class AriTcpClientServer extends AriClientServer {

    constructor(socket: net.Socket) {
        super();
        var jsonSeparator = new JsonSeparator();

        socket.on("data", (data) => { log.trace(this.name + "->Server:", data); jsonSeparator.receive(data); });
        jsonSeparator.onReceive = (msg) => this.receive(msg);

        this.onSend = (msg) => jsonSeparator.send(msg);
        jsonSeparator.onSend = (msg) => { log.trace(this.name + "<-Server:", msg); socket.write(msg); };

        socket.on("end", () => {
            // destroy and free this object!!!
            this.disconnect();
            jsonSeparator = null;
            // TBD: Check for mem-leak!!!
        });
    }
}