import AriBaseProtocol from "./ariBaseProtocol";

export default class AriClient {
    authToken: string;
    ariServer: AriBaseProtocol;
    role: string;
    name: string;
    password: string;
    
    onSendToServer: (telegram:string) => void;

    constructor(name: string = "Anonymous", role: string = "Unknown", password: string = "") {
        this.ariServer = new AriBaseProtocol();
        this.name = name;
        this.role = role;
        this.password = password;
    }

    connect() {
        if (!this.authToken) {
            // No authToken, so we need to request it.
            this.ariServer.call("REQAUTHTOKEN", { "name": this.name, "role": this.role, "password": this.password }, (err, result) => {
                if (err) { console.log("Error:", err); return; }
                this.name = result.name;
                this.authToken = result.authToken;

                // Try to connect again.
                setTimeout(() => {
                    this.connect();
                }, 1);
            });
        } else {
            // We have authToken, so connect "normally".
            this.ariServer.call("CONNECT", { "name": self.name, "authToken":this.authToken }, function (err, result) {
                if (err) {
                    return;
                }

                //console.log("registerClient result:", result);
                this.name = result.name;

                // Send if we have stored msg's...
                for (var i = 0; i < this._pendingMsgs.length; i++) {
                    this._ws.send(this._pendingMsgs[i]);
                }
                this._pendingMsgs = [];

                this.isConnected = true;
                if (this.onconnect) this.onconnect(result);
                this._trigger("connect", result);
            });
        }
    }

    handleError() {

    }
}
