//import { webSocket } from "ws";
//import AriEventEmitter from "./AriEventEmitter";
import AriClient from "../common/AriClient";

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
    private wsConnect() {
        var self = this;

        console.log("AriWsClient trying to connect to:", this.url);
        var ws = new WebSocket(this.url);
        ws.onmessage = (msgEvt) => { self.receive(JSON.parse(msgEvt.data)); };
        self.send = function (message) { ws.send(JSON.stringify(message, AriWsClient.no__jsonReplacer2)); };

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
    private static no__jsonReplacer2(key, value) {
        if (key.startsWith("__")) return undefined;
        else return value;
    }
}
