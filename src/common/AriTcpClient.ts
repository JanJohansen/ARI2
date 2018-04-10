import AriClient from "./AriClient";
import ReconnectingTcpConnection from "./ReconnectingTcpClient";
import JsonSeparator from "./JsonSeparator";

export default class AriTcpClient extends AriClient {
    constructor(name: string, config?: { authToken?: string, userName?: string, userPassword?: string, port?: number, serverAddress?: string, attributes?: any }) {
        super(name, config);
        var self = this;
        let tcp = new ReconnectingTcpConnection(config);
        let jsonSeparator = new JsonSeparator();

        tcp.onReceive = (data) => jsonSeparator.receive(data);
        jsonSeparator.onReceive = (json) => self.receive(json);

        this.onSend = (message) => jsonSeparator.send(message);
        jsonSeparator.onSend = (message) => tcp.send(message);

        tcp.onConnected = () => { self.connect(); self.onConnected(); };
        tcp.onDisconnected = () => { self.disconnect(); self.onDisconnected(); };
    }
    onConnected() { };
    onDisconnected() { };
}
