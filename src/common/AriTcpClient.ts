import AriClient from "./AriClient";
import ReconnectingTcpConnection from "./ReconnectingTcpClient";
import JsonSeparator from "./JsonSeparator";

export default class AriTcpClient extends AriClient {
    constructor(name: string, config?: {authToken?: string, userName?: string, userPassword?: string, port?: number, serverAddress?: string, attributes? : any}) {
        super(name, config);
        var self = this;
        let tcp = new ReconnectingTcpConnection(config);
        let jsonifier = new JsonSeparator();

        tcp.on("data", (data) => { jsonifier.dataIn(data); });
        jsonifier.on("jsonOut", (json) => { self.handleMessage(json); });
        this.onMessageOut = (message) => { tcp.send(message); };

        tcp.on("connected", () => { 
            self.connect(); 
        });
        tcp.on("disconnected", () => { 
            self.disconnect(); 
        });
    }
}
