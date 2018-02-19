import * as net from "net";
import RpcHandler from "../common/RpcHandler";
import JsonSeparator from "../common/JsonSeparator";
import AriClientServer from "./ariClientServer";

export default class AriTcpClientServer extends AriClientServer {
    
    constructor(socket: net.Socket) {
        super();

        var self = this;

        let jsonifier = new JsonSeparator();
        let rpc = new RpcHandler();

        socket.on("data", (data) => { jsonifier.dataIn(data); });
        jsonifier.on("jsonOut", (json) => { console.log("->Server:", json); rpc.jsonIn(json); });
        rpc.onCalls( (callName, params) => { return self["_webcall_" + callName](params); });
        rpc.on("notify", (name, params) => { self["_webnotify_" + name](params); });

        this.onCalls( (name, params) => { return rpc.call(name, params); });
        this.on("notifyOut", (name, params) => { rpc.notify(name, params); });
        rpc.on("jsonOut", (json) => { jsonifier.jsonIn(json) });
        jsonifier.on("dataOut", (data) => { console.log("<-Server:", data); socket.write(data); });

        socket.on("end", ()=>{
            // destroy and free this object!!!
            rpc = null;
            jsonifier = null; 
            // TBD: Check for mem-leak!!!
        });
    }
}