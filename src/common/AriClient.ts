//import * as Ari from "../common/AriObjectModel";
import { AriObjectModel, AriNode, AriOutputModel, AriInputModel, AriEvent } from "../common/AriObjectModel";
import { EventEmitter } from "events";
import { addLocale } from "core-js";

type callsHandlerType = (callName: string, parameters: any) => any;

export default class AriClient extends EventEmitter {

    private __clientInfoTimer = null;
    public onMessageOut: (message: string) => void = null; // FIXME: Send via eventemitter
    //public name;
    private __role: string;
    private __userPassword: string;
    private __userName: string;
    //private name: string;
    private connected = false;
    private authenticated = false;

    private __nextReqId = 0;        // Id to use for identifying requests and corresponding response callbacks.
    private __pendingCallbacks = {};// Callbacks for pending server requests.
    private __authToken = null;

    // define clientInfo object to send to server and to maintain local state.
    // Note that members starting with "__" will NOT be sent to server! - So use this to store members with local relevance only.
    //public localModel: AriObjectModel;

    // remoteModel is modeling the remote DOM. Use this to place event listeners, set members etc.
    public localModel: AriObjectModel;
    public remoteModel: AriObjectModel;

    constructor(name: string, config?: { authToken?: string, userName?: string, userPassword?: string, attributes?: any }) {
        super();
        config = config || {};

        this.__authToken = config.authToken || 42;    // TODO: Implement storing authToken on disk or localstorage in browser...
        this.__userName = config.userName || null;
        this.__userPassword = config.userPassword || null;

        this.remoteModel = new AriObjectModel(null, name + "_remote");
        this.localModel = new AriObjectModel(null, name);
        
        this.remoteModel.on("addedListener", (evt) => {
            if(evt.evt == "addedListener") return;
            // Check for any subscriptions.
            var listeners = this.remoteModel.getListeners(evt.evt, true);
            if (listeners.size == 1) self.send({ cmd: "on", name: evt.evt, path: this.remoteModel.pathToHere(evt.source) });
        });

        this.remoteModel.on("removedListener", (evt) => {
            if(evt.evt == "removedListener") return;
            // Check for any subscriptions.
            var listeners = this.remoteModel.getListeners("out", true);
            if (listeners.size == 0) self.send({ cmd: "off", name: evt.evt, path: this.remoteModel.pathToHere(evt.source) });
        });

        // Send clientInfo to server if local structure was changed.
        this.localModel.on("modelUpdated", (evt) => { 
            this.sendClientInfo(); 
        });

        // Send all local value changes (out events) to server.
        var self = this;
        this.localModel.on("out", (evt) => {
            self.send({ evt: "out", source: self.localModel.pathToHere(evt.source), value: evt.source["value"] });
        });
    }

    static no__jsonReplacer(key, value) {
        if (key.startsWith("__")) return undefined;
        else return value;
    }

    handleMessage(json) {
        var msg;
        try {
            console.log("->" + this.localModel.name, json);
            msg = JSON.parse(json);
        } catch (e) {
            console.log("Error in JSON message from server. Ignoring message.")
            return;
        }

        if ("evt" in msg) {
            // No special handling. Forward cmd to client if it subscribes.
            if ("target" in msg) {
                var node = this.localModel.findOrCreate(msg.target);
                node.inject({ evt: msg.evt, value: msg.value });
            } else if ("source" in msg) {
                // TODO: Check if this works!!
                var node = this.remoteModel.findOrCreate(msg.source);
                node.emit({ evt: msg.evt, value: msg.value });
            }
        } else if ("cmd" in msg) {
            let cmd = msg.cmd;
            if ("_remote_" + cmd in this) this["_remote_" + cmd](msg);
            else console.log("Error: Server trying to call unknown method:", cmd);
        }
    }

    // ************************************************************************
    sub(name: string, cb: (name: string, value: any) => void) {
        this.send({ cmd: "out", name: name });
        if (name == "**") {
            this.remoteModel.on("out", (evt) => { cb(evt.target.name, evt.value) });
        } else if (name.endsWith(".**")) {
            name = name.substring(name.length - 3);
            var obj = this.remoteModel.findOrCreate(name);
            obj.on("out", (evt) => { cb(evt.target.name, evt.value) });
        } else {
            var obj = this.remoteModel.findOrCreate(name);
            obj.on("out", (evt) => { cb(evt.target.name, evt.value) });
            /*
            var lio = name.lastIndexOf(".");
            var objName = name.substring(lio);
            var valueName = name.substring(0, lio);
            var obj = this.remoteModel.findOrCreate(objName);
            if (!(valueName in obj)) obj.addOutput(valueName);
            obj.on("out", (evt) => { cb(evt.target.name, evt.value) });
            */
        }
    }

    set(name, value) {
        this.send({ cmd: "set", name: name, value: value });
    }

    _remote_out(msg) {
        if (!msg.name) return;
        var obj = this.remoteModel.findOrCreate(msg.source);
        obj.emit({evt: "out", value: msg.value});
    }

    _remote_set(msg) {
        if (!msg.name) return;
        var lio = msg.name.lastIndexOf(".");
        var objName = msg.name.substring(lio);
        var valueName = msg.name.substring(0, lio);
        var obj = this.localModel.find(msg.name);
        if (obj) obj.inject({evt: "set", value: msg.value});
    }

    _remote_sub(name) {
        return this.localModel.find(name).on("out", this.remoteSubsCB);
    }

    _remote_unsub(msg) {
        return this.localModel.find(msg.name).off("out", this.remoteSubsCB);
    }

    // ************************************************************************
    // Function call handling.

    // Server calls function on this client.
    _remote_call(msg) {
        if (!msg.name) return;// log.error("Error: Missing name of function to call!");
        var ariObj = this.localModel.find(msg.name);
        if (!ariObj) {
            this.send({ cmd: "return", id: msg.id, err: "Error: Function not found!" });
        } else {
            //if(ariObj.__events.
            var result = ariObj[msg.name].call(msg.args);
            this.send({ cmd: "return", id: msg.id, result: result });
        }
    }

    // Call function on remote client.
    async call(name, args) {
        var self = this;
        var reqId = self.__nextReqId++;
        this.send({ cmd: "call", id: reqId, name: name, args: args });
        return new Promise((resolve, reject) => {
            self.__pendingCallbacks[reqId] = [resolve, reject];
        });
    }

    // Handle response from call to remote client function.
    _remote_return(msg) {
        if (!msg.id) { log.error("Error: Missing request ID in response telegram!"); return; }
        else {
            var pendingPromise = this.__pendingCallbacks[msg.id];
            if (!pendingPromise) { log.error("Error: Unexpected request ID in response telegram!!!"); return; }
            delete this.__pendingCallbacks[msg.id];

            if (msg.result) pendingPromise[0](msg.result);
            else if (msg.err) pendingPromise[1](msg.err);
        }
    }

    // ************************************************************************
    // Support functions
    private remoteSubsCB(ariValue) {
        this.send({ cmd: "out", name: ariValue.name, value: ariValue.value });
    }

    // Send clientInfo after some time to allow build up of model before sending.
    sendClientInfo() {
        if (this.__clientInfoTimer) return;
        var self = this;
        this.__clientInfoTimer = setTimeout(() => {
            self._sendClientInfo();
            self.__clientInfoTimer = null;
        }, 10);
    }

    _sendClientInfo() {
        // Publish local pubsubtree or special message for server?
        this.send({ evt: "clientInfo", value: this.localModel, source: "" });
    }


    private send(msg) {
        console.log("<-" + this.localModel.name, msg);
        if (this.connected && this.onMessageOut) this.onMessageOut(JSON.stringify(msg, AriClient.no__jsonReplacer));
    }

    public log(...args) {
        this.emit("log", {value: args});
    }

    private _authenticate() {
        const self = this;
        var reqSend = false;
        if (self.__authToken) {
            // We have authToken, so connect "normally".
            this.send({ cmd: "auth", token: self.__authToken, name: self.localModel.name });
            reqSend = true;
        } else {
            if (self.__role) {
                // No authToken, so we need to request it.
                this.send({ auth: { name: self.localModel.name, role: self.__role } });
                reqSend = true;
            } else if (self.__userName && self.__userPassword) {
                // No authToken, so we need to request it.
                this.send({ auth: { name: self.localModel.name, username: self.__userName, password: self.__userPassword } });
                reqSend = true;
            }
        }
        if (!reqSend) throw ("ERROR!: No authToke, Role or user credentials provided to AriClient.");
    }

    _remote_authOk(msg) {
        this.localModel.name = msg.name;
        this.emit("authenticated");

        // Send subscriptions that have already been requested.
        // Get list of event names and their path nearest to the root. Subscribe to theese.
        var listeners = this.remoteModel.getOldestEvents();
        listeners.forEach((sourceNode, evt) => {
            if(evt != "addedListener" && evt != "removedListener" && evt != "modelUpdated") this.send({ cmd: "on", name: evt, path: this.remoteModel.pathToHere(sourceNode) });
        });
        this.emit("ready");
    }

    _remote_authNok(msg) {
        this.emit("error", {message: "Authentication failed!"});
        console.log("ERROR: Authentication failed!");
    }

    //*****************************************************************************
    // connect, disconnect --------------------------------------------------------


    // Normal connect with authToken.
    public connect(authToken = null) {
        this.connected = true;
        this.authenticated = false;
        this._authenticate();
    };

    // First time connect if only user and password is known.
    // authToken will be available if successfully loggend in.
    connectUser(userName, userPassword) {
        this.__userName = userName;
        this.__userPassword = userPassword;
        this.__authToken = null;
        this._authenticate();
    };

    // First time connect if its a device/controller.
    // authToken will be available if successfully loggend in after admin has manually approved device.
    connectDevice(role) {
        this.__role = role == "controller" ? "controller" : "device";
        this.__authToken = null;
        this._authenticate();
    };

    // Close connection to server.
    public disconnect() {
        this.connected = false;
    }

    //*****************************************************************************
    // clientInfo -----------------------------------------------------------------
    // This function sets a timeout function, so that after 10ms the update is sent.
    // If many updates are made to clientInfo (durgin startup), only one clientInfo update will be sent to the server!


    // For easier update of values, call this and re-register all again.
    /*    clearValues () {
            this.clientModel.values = {};
            this.sendClientInfo();
        }
     
        // For easier update of functions, call this and re-register all again.
        clearFunctions () {
            this.clientModel.functions = {};
            this.sendClientInfo();
        }
    */
}