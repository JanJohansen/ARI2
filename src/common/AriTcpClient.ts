import AriClient from "./AriClient";
import ReconnectingTcpConnection from "./ReconnectingTcpClient";
import JsonSeparator from "./JsonSeparator";
import RpcHandler from "./RpcHandler";

export default class AriTcpClient extends AriClient {
    constructor(config?: {name: string, authToken?: string, userName?: string, userPassword?: string, port?: number, serverAddress?: string}) {
        super(config);
        var self = this;
        let tcp = new ReconnectingTcpConnection(config);
        let jsonifier = new JsonSeparator();
        let rpc = new RpcHandler();

        tcp.on("data", (data) => { jsonifier.dataIn(data); });
        jsonifier.on("jsonOut", (json) => { rpc.jsonIn(json); });
        rpc.onCalls( (callName, params) => { return self["_webcall_" + callName](params); });
        rpc.on("notify", (name, params) => { self["_webnotify_" + name](params); });

        this.onCalls( (name, params) => { return rpc.call(name, params); });
        this.on("notify", (name, params) => { rpc.notify(name, params); });
        rpc.on("jsonOut", (json) => { jsonifier.jsonIn(json) });
        jsonifier.on("dataOut", (data) => { tcp.send(data); });

        tcp.on("connected", () => { 
            self.connect(); 
        });
    }
}

/*
rpc.registerTarget(servObj);

y = await servObj.x(params); 
//-> RpcServer -> req(reqId, x, params) -> RpcClient -> await clientObj.x(params) {return y}
servObj resolve... <- RpcServer <- res(reqId, y) <- RpcClient

*/