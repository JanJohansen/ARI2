import * as net from "net";
import AriClientServer from "./ariClientServer";

export default class AriTcpClientServer extends AriClientServer {

    constructor(socket) {
        super();

        var self = this;

        socket.on("message", (message) => { console.log("->Server:", message); this.handleMessage(message); });
        this.on("toClient", (message) => { console.log("<-Server:", message); socket.send(message); });

        socket.on("close", () => {
            // destroy and free this object!!!
            this.disconnect();
            // TBD: Check for mem-leak!!!
        });
    }
}