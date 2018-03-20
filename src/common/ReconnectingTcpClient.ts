import { EventEmitter } from "events";
import * as net from "net";

export default class ReconnectingTcpConnection extends EventEmitter {
    reconnectInterval = 5000;
    port: number;
    serverAddress: string;
    client;

    constructor(config: {port?: number, serverAddress?: string}) {
        super();
        if(!config) config = {};
        this.port = config.port || 3000;
        this.serverAddress = config.serverAddress || "localhost";
        this._connect();
    }

    _connect(){
        var self = this;
        this.client = new net.Socket();
    
        self.client.connect(this.port, this.serverAddress, () => {
            console.log('ReconnectingTcpConnection connected.');
            self.emit("connected");
        });
        
        self.client.on('data', (data) => {
            //console.log('Received: ' + data);
            self.emit("data", data);
        });
        
        self.client.on('close', () => {
            console.log('TCP connection closed... Trying to reconnect.');
            self.client.destroy(); // kill client after server's response
            if (self.reconnectInterval > 0) setTimeout(self._connect.bind(self), self.reconnectInterval);
            self.emit("disconnected");
        });
        
        self.client.on('error', (e) => {console.log("Socket", e)});
    }
    
    send(data) {
        this.client.write(data);
    }
}
