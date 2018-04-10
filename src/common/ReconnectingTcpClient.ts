import { EventEmitter } from "events";
import * as net from "net";

export default class ReconnectingTcpConnection {
    reconnectInterval = 5000;
    port: number;
    serverAddress: string;
    client;

    constructor(config: { port?: number, serverAddress?: string }) {
        if (!config) config = {};
        this.port = config.port || 3000;
        this.serverAddress = config.serverAddress || "localhost";
        this._connect();
    }

    _connect() {
        var self = this;
        this.client = new net.Socket();

        self.client.connect(this.port, this.serverAddress, () => {
            console.log('ReconnectingTcpConnection connected.');
            self.onConnected();
        });

        self.client.on('data', (data) => {
            //console.log('Received: ' + data);
            self.onReceive(data);
        });

        self.client.on('close', () => {
            console.log('TCP connection closed... Trying to reconnect.');
            self.client.destroy(); // kill client after server's response
            if (self.reconnectInterval > 0) setTimeout(self._connect.bind(self), self.reconnectInterval);
            self.onDisconnected();
        });

        self.client.on('error', (e) => { console.log("Socket", e) });
    }

    onReceive(data: any) { throw ("Error: onReceive MUST be overwritten to handle upstream data.") };
    onConnected(): void { };
    onDisconnected(): void { };

    send(data) {
        this.client.write(data);
    }
}
