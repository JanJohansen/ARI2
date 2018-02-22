import AriClient from "../../dist/common/AriClient";
import { webSocket } from "rxjs/observable/dom/webSocket";

class AriWsClient extends AriClient {
    
    constructor(config) {
        console.log("AriWsClient construictor called!")
        super(config);
        var self = this;

        if (typeof window !== 'undefined') { // Config for browser
            this.url = "ws://" + window.location.host;
        } else {
            this.url = "ws://localhost:3000/socket/";
        }
        console.log("AriWsClient trying to connect to:", "ws://localhost:4000");//this.url);
        var ws = new WebSocket("ws://localhost:4000");//this.url);
        ws.onmessage = (msgEvt) => { self.handleMessage(msgEvt.data); };
        this.onMessageOut = (message) => { ws.send(message); };

        ws.onopen = () => { 
            console.log("AriWsClient connected!");
            self.connect(); 
        }
        ws.onclose = ()=>{
            
        }
    }
}

export default new AriWsClient();