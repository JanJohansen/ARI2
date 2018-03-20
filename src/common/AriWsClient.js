import AriClient from "../../dist/common/AriClient";
//import { webSocket } from "rxjs/observable/dom/webSocket";
//import { webSocket } from "ws";

export default class AriWsClient extends AriClient {

    constructor(config) {
        console.log("AriWsClient constructor called!")
        super("WSClient", config);

        if (typeof window !== 'undefined') { // Config for browser
            this.url = "ws://" + window.location.hostname + ":4000";    // FIXME: Use location.host and use port by server. For develop we can override port, to use webpack to serve html separately.
        } else {
            this.url = "ws://localhost:4000";
        }
        this.wsConnect();

    }
    wsConnect() {
        var self = this;
        
        console.log("AriWsClient trying to connect to:", this.url);
        var ws = new WebSocket(this.url);
        ws.onmessage = (msgEvt) => { self.handleMessage(msgEvt.data); };
        self.onMessageOut = (message) => { ws.send(message); };

        ws.onopen = () => {
            console.log("AriWsClient connected!");
            self.connect();
        }
        ws.onclose = () => {
            self.disconnect();
            ws = null;
            console.log("AriWsClient disconnected!... Will rerty connection...");
            setTimeout(() => {
                self.wsConnect();
            }, 2000);
        }
    }
}
