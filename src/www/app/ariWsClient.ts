import AriClient from "./ariClient";

export default class wsAriClient {
    WebSocket: any;
    url: string;
    reconnectInterval = 2000;   // Interval in ms.
    _ws: any = null;
    ariClient: AriClient;
    _pendingTlgs: string[] = [];     // Buffer for messages that should have been sent while offline.

    constructor() {
        this.ariClient = new AriClient();
        
        // Check if we are in browser or in nodejs.
        if (typeof window === 'undefined') {
            // We're in NodeJS
            WebSocket = require('ws');
            this.url = "ws://localhost:4000/socket/";
        }
        else
        {
            // We're in a browser.
            this.url = "ws://" + window.location.host;
        }

        //this.connect();
    }

    connect() {
        var self = this;

        // Open socket!
        if (!this._ws) {
            //console.log("Creating WSocket!");
            this._ws = new WebSocket(this.url);

            this._ws.onopen = () => {
                this.ariClient.connect();
            }

            this._ws.onmessage = (message) => {
                this.ariClient.handleMessage(message);
            };

            this._ws.onerror = () => {
                console.log('Socket error... Will try to reconnect...');
                if (self._ws) {
                    self._ws.close();
                    self._ws = null;
                }
                setTimeout(self.connect.bind(self), self.reconnectInterval);
                this.ariClient.handleError();
            };

            this._ws.onclose = () => {
                console.log('Socket closed... Will try to reconnect...');
                if (self._ws) {
                    self._ws.close();
                    self._ws = null;
                }
                setTimeout(self._connect.bind(self), self.reconnectInterval);
                this.ariClient.handleError();
            };

            this.ariClient.onSendToServer = (telegram) => {
                this._ws.send(telegram);
            }
        }
    }
}