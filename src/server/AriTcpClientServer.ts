import { loggingService, consoleLogWriter } from './loggingService';
var log = loggingService.getLogger("AriTcpClientServer");

import * as net from "net";
import RpcHandler from "../common/RpcHandler";
import JsonSeparator from "../common/JsonSeparator";
import AriClientServer from "./ariClientServer";

export default class AriTcpClientServer extends AriClientServer {

    constructor(socket: net.Socket) {
        super();

        var self = this;

        let jsonifier = new JsonSeparator();
        let rpc = new RpcHandler();

        socket.on("data", (data) => { jsonifier.dataIn(data); });
        jsonifier.on("jsonOut", (json) => { log.trace("->Server:", json); this.handleMessage(json); });

        this.on("toClient", (message) => { log.trace("<-Server:", message); socket.write(message); });

        socket.on("end", () => {
            // destroy and free this object!!!
            rpc = null;
            jsonifier = null;
            // TBD: Check for mem-leak!!!
        });
    }
}