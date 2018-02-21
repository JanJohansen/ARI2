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
        jsonifier.on("jsonOut", (json) => { console.log("->Server:", json); this.handleMessage(json); });

        this.on("toClient", (message) => { console.log("<-Server:", message); socket.write(message); });

        socket.on("end", () => {
            // destroy and free this object!!!
            rpc = null;
            jsonifier = null;
            // TBD: Check for mem-leak!!!
        });
    }
}