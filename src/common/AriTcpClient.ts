import AriClient from "./AriClient";
import ReconnectingTcpConnection from "./ReconnectingTcpClient";
import JsonSeparator from "./JsonSeparator";

export default class AriTcpClient extends AriClient {
    constructor(config?: {name: string, authToken?: string, userName?: string, userPassword?: string, port?: number, serverAddress?: string}) {
        super(config);
        var self = this;
        let tcp = new ReconnectingTcpConnection(config);
        let jsonifier = new JsonSeparator();

        tcp.on("data", (data) => { jsonifier.dataIn(data); });
        jsonifier.on("jsonOut", (json) => { self.handleMessage(json); });
        this.onMessageOut = (message) => { tcp.send(message); };

        tcp.on("connected", () => { 
            self.connect(); 
        });
    }
}
