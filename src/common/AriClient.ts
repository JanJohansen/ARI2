import { EventEmitter2 } from 'eventemitter2';
var log = (...args) => { };//console.log;

export default class AriClient {

    public name = "NN";
    private userName?: string;
    private userPassword?: string;
    private authToken?= null;
    private role?: string;
    private clientInfoTimer = null;
    private connected = false;
    private authenticated = false;
    //private ee: EventEmitter2;
    private throttle: number = 0;
    private nextCallId = 0;
    private pendingCalls = {};
    private functions = {};
    private collection = null;
    private ee: EventEmitter2;

    constructor(name: string, options?: { authToken?: string, userName?: string, userPassword?: string, throttle?: number }) {
        this.name = name;
        this.ee = new EventEmitter2({ wildcard: true, delimiter: '.', newListener: false, maxListeners: 20, verboseMemoryLeak: true });
        this.ee["__AriClient"] = this;  // HACK: To allow accessing this AriClient in event callbacks that also need to acces this.event!

        options = options || {};
        this.authToken = options.authToken || 42;    // TODO: Implement storing authToken on disk or localstorage in browser...
        this.userName = options.userName || undefined;
        this.userPassword = options.userPassword || undefined;
        this.throttle = options.throttle || 0; // -1: Synchronus callback, 0: Callback in nextTick, 1+: ms delay before sending.
    }

    // ************************************************************************
    // Low level message handling
    receive(msg) {
        if ("cmd" in msg) {
            let cmd = "_cmd_" + msg.cmd;
            if (cmd in this) this[cmd](msg);
            else console.log("Error: Server trying to call unknown method:", cmd);
        }
        return true;
    }

    send(msg) {
        if (this.connected) this.onSend(msg);
    }

    onSend(message: string): void {
        throw ("Error: onSend MUST be overwritten to use class.");
    };

    // ************************************************************************
    // Event handling.
    on(name: string, cb: (any) => void) {
        this.ee.on(name, cb);
        if(name.split(".")[0] != "_") this.send({ cmd: "on", name: name });
    }
    onLocal(name, cb) {
        // Local event names indicated by "_" to allow subscriptions before we have the assigned name from the server!
        this.on("_." + name, cb);
    }
    emit(name, args) {
        this.ee.emit(name, args);
    }
    emitNow(evt, args) {
        this.ee.emit(evt, args);
        this.flush();
    }
    emitLocal(name, args = undefined) {
        this.ee.emit("_." + name, args);
    }
    emitLocalNow(name, args = undefined) {
        this.ee.emit("_." + name, args);
        this.flush();
    }
    private _cmd_evt(msg) {
        this.ee.emit(msg.name, msg.args);
    }
    private _cmd_on(msg) {
        let name = msg.name.split(".");
        if (name[0] == this.name) {
            name[0] = "_";
        }
        name.join(".");
        this.ee.on(msg.name, this.collectSubCbs);
    }
    private _cmd_off(msg) {
        this.ee.off(msg.name, this.collectSubCbs);
    }
    // Collect callbacks for same event to avoid sending same event more than once.
    private collectSubCbs(args) {
        var ariClient = this["__AriClient"]; // HACK - see constructor above.
        if(!this.event.startsWith("_")) return;  // Don't send remote events back!
        
        if (ariClient.throttle < 0) {
            ariClient.send({ cmd: "evt", name: this.event, args: args });
            return;
        } else {
            if (!ariClient.collection) {
                ariClient.collection = [];
                // Send/flush AFTER all listeners that listen to events have been fired.
                if (ariClient.throttle == 0) process.nextTick(ariClient.flush.bind(ariClient));
                else setTimeout(function () {
                    ariClient.flush();
                }, ariClient.throttle);
            }
            log(ariClient.name, "collecting:", ariClient.event, "=", args);
            ariClient.collection[this.event] = args;
        }
    }
    // Send collected events. Can allso be called in certain cases where colecting events is not desired (function "call"s, and command like events.)
    public flush() {
        if (this.collection) {
            log("Collected:", this.collection);
            for (let evt in this.collection) {
                var name = evt;
                if(evt.startsWith("_.")) name = this.name + evt.substring(1);
                this.send({ cmd: "evt", name: name, args: this.collection[evt] });
            }
            this.collection = null;
        }
    }

    // ************************************************************************
    // Call handling.

    call(name, args, cb) {
        this.pendingCalls[this.nextCallId] = cb;
        this.send({ cmd: "call", name: name, args: args, cid: this.nextCallId });
        this.nextCallId++;
    }
    onCall(name, cb) {
        this.functions[this.name + "." + name] = cb;
    }
    private _cmd_call(msg) {
        if (!(msg.name in this.functions)) {
            this.send({ cmd: "return", err: "Unknown function name when trying to call: " + msg.name, cid: msg.cid });
            return true;
        }
        var result = this.functions[msg.name](msg.args);
        this.send({ cmd: "return", result: result, cid: msg.cid });
    }
    private _cmd_return(msg) {
        if (!(msg.cid in this.pendingCalls)) return;    // callId not awaited! - Ignore!
        this.pendingCalls[msg.cid](msg.result);
        delete this.pendingCalls[msg.cid];
    }

    // ************************************************************************
    // Authentication handling.

    private _authenticate() {
        const self = this;
        var reqSend = false;
        if (self.authToken) {
            // We have authToken, so connect "normally".
            this.send({ cmd: "auth", token: self.authToken, name: self.name });
            reqSend = true;
        } else {
            if (self.role) {
                // No authToken, so we need to request it.
                this.send({ auth: { name: self.name, role: self.role } });
                reqSend = true;
            } else if (self.userName && self.userPassword) {
                // No authToken, so we need to request it.
                this.send({ auth: { name: self.name, username: self.userName, password: self.userPassword } });
                reqSend = true;
            }
        }
        if (!reqSend) throw ("ERROR!: No authToke, Role or user credentials provided to AriClient.");
    }

    private _cmd_authOk(msg) {
        this.name = msg.name;
        this.emitLocal("authenticated");

        // Send subscriptions that have already been requested.
        // Get list of event names and their path nearest to the root. Subscribe to theese.

        // var listeners = this.remoteModel.getOldestEvents();
        // listeners.forEach((sourceNode, evt) => {
        //     if (evt != "addedListener" && evt != "removedListener" && evt != "modelUpdated") this.send({ cmd: "on", name: evt, path: this.remoteModel.pathToHere(sourceNode) });
        // });
        this.emitLocal("ready");
    }

    private _cmd_authNok(msg) {
        this.emit("error", { message: "Authentication failed!" });
        console.log("ERROR: Authentication failed!");
    }

    //*****************************************************************************
    // connect, disconnect --------------------------------------------------------

    // Normal connect with authToken.
    connect(authToken = null) {
        this.connected = true;
        this.authenticated = false;
        this._authenticate();
    };

    // First time connect if only user and password is known.
    // authToken will be available if successfully loggend in.
    connectUser(userName, userPassword) {
        this.userName = userName;
        this.userPassword = userPassword;
        this.authToken = null;
        this._authenticate();
    };

    // First time connect if its a device/controller.
    // authToken will be available if successfully loggend in after admin has manually approved device.
    connectDevice(role) {
        this.role = role == "controller" ? "controller" : "device";
        this.authToken = null;
        this._authenticate();
    };

    // Close connection to server.
    disconnect() {
        this.connected = false;
    }

    // ************************************************************************
    // Support functions
    private static no__jsonReplacer(key, value) {
        if (key.startsWith("__")) return undefined;
        else return value;
    }

    // Send clientInfo after some time to allow build up of model before sending.
    sendClientInfo() {
        if (this.clientInfoTimer) return;
        var self = this;
        this.clientInfoTimer = setTimeout(() => {
            self._sendClientInfo();
            self.clientInfoTimer = null;
        }, 10);
    }

    private _sendClientInfo() {
        // Publish local pubsubtree or special message for server?
    }

    log(...args) {
        this.emit("log", args);
    }
}