//import * as Ari from "../common/AriObjectModel";
import { AriObjectModel, AriModelBase, AriOutputModel, AriInputModel } from "../common/AriObjectModel";
import { EventEmitter } from "events";

type callsHandlerType = (callName: string, parameters: any) => any;

export default class AriClient {

    private __clientInfoTimer = null;
    public onMessageOut: (message: string) => void = null;
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
        config = config || {};


        this.__authToken = config.authToken || 42;    // TODO: Implement storing authToken on disk or localstorage in browser...
        this.__userName = config.userName || null;
        this.__userPassword = config.userPassword || null;

        this.localModel = new AriObjectModel(null, name || "NN_Client");
        this.localModel.on("modelUpdated", (evt) => { this.sendClientInfo(); });
        this.remoteModel = new AriObjectModel(null, name + "_remote");

        // Send all local value changes (set events) to server.
        var self = this;
        this.localModel.on("oSet", (evt) => {
            self.send({ cmd: "oSet", name: self.localModel.pathToHere(evt.target), value: evt.target["value"] });
        });

        this.remoteModel.on("addedListener", (evt) => {
            if (evt.addedEventName == "oSet") {
                // Check for any subscriptions.
                var listeners = this.remoteModel.getListeners("oSet", true);
                if (listeners.size == 1) self.send({ cmd: "sub", name: this.remoteModel.pathToHere(evt.target) });
            }
        });
        this.remoteModel.on("removedListener", (evt) => {
            if (evt.removedEventName == "oSet") {
                // Check for any subscriptions.
                var listeners = this.remoteModel.getListeners("oSet", true);
                if (listeners.size == 0) self.send({ cmd: "unsub", name: this.remoteModel.pathToHere(evt.target) });
            }
        });
        this.remoteModel.on("setI", (evt) => {
            self.send({ cmd: "setI", name: this.remoteModel.pathToHere(evt.target) });
        });
    }

    static no__jsonReplacer(key, value) {
        if (key.startsWith("__")) return undefined;
        else return value;
    }

    handleMessage(json) {
        var msg;
        try {
            console.log("JSON:", json);
            msg = JSON.parse(json);
        } catch (e) {
            console.log("Error in JSON message from server. Ignoring message.")
            return;
        }

        let cmd = msg.cmd;
        if ("_remote_" + cmd in this) this["_remote_" + cmd](msg);
        else console.log("Error: Server trying to call unknown method:", cmd);
    }

    // ************************************************************************
    subRemote(name: string, cb: (name: string, value: any) => void) {
        this.send({ cmd: "sub", name: name });
        if (name == "**") {
            this.remoteModel.on("oSet", (evt) => { cb(evt.target.name, evt.value) });
        } else if (name.endsWith(".**")) {
            name = name.substring(name.length - 3);
            var obj = this.remoteModel.findPath(name, "obj") as AriObjectModel;
            obj.on("oSet", (evt) => { cb(evt.target.name, evt.value) });
        } else {
            var lio = name.lastIndexOf(".");
            var objName = name.substring(lio);
            var valueName = name.substring(0, lio);
            var obj = this.remoteModel.findPath(objName, "out") as AriObjectModel;
            if (!(valueName in obj)) obj.addOutput(valueName);
            obj.on("oSet", (evt) => { cb(evt.target.name, evt.value) });
        }
    }

    setRemote(name, value) {
        this.send({ cmd: "setI", name: name, value: value });
    }

    public _remote_oSet(msg) {
        if (!msg.name) return;
        var obj = this.remoteModel.findPath(msg.name, "out") as AriObjectModel;
        if (obj instanceof AriOutputModel) obj.value = msg.value;
        else throw("Kkjhkjh");
    }

    public _remote_setI(msg) {
        if (!msg.name) return;
        var lio = msg.name.lastIndexOf(".");
        var objName = msg.name.substring(lio);
        var valueName = msg.name.substring(0, lio);
        var obj = this.localModel.findPath(objName, "in") as AriInputModel;
        if (obj) obj.value = msg.value;
    }

    public _remote_sub(name) {
        return this.localModel.findPath(name).on("oSet", this.remoteSubsCB);
    }

    public _remote_unsub(msg) {
        return this.localModel.findPath(msg.name).off("oSet", this.remoteSubsCB);
    }

    // ************************************************************************
    // Function call handling.

    // Server calls function on this client.
    _remote_call(msg) {
        if (!msg.name) return;// log.error("Error: Missing name of function to call!");
        var ariObj = this.localModel.findPath(msg.name);
        if (!ariObj) {
            this.send({ cmd: "return", id: msg.id, err: "Error: Function not found!" });
        } else {
            var result = ariObj[msg.name].call(msg.args);
            this.send({ cmd: "return", id: msg.id, result: result });
        }
    }

    // Call function on remote client.
    async callRemote(name, args) {
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
        this.send({ cmd: "pub", name: ariValue.name, value: ariValue.value });
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
        this.send({ cmd: "clientinfo", clientInfo: this });
    }


    private send(msg) {
        if (this.connected && this.onMessageOut) this.onMessageOut(JSON.stringify(msg, AriClient.no__jsonReplacer));
    }


    public log(...args) {
        this.send({ cmd: "log", message: args });
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
        this._sendClientInfo();

        var listeners = this.remoteModel.getListeners("oSet", true);
        console.log("Set-listeners:", listeners.size, listeners);
        listeners.forEach((listener) => {
            console.log("SENDING!", this.remoteModel.pathToHere(listener));
            this.send({ cmd: "sub", name: this.remoteModel.pathToHere(listener) });
        });
    }

    _remote_authNok(msg) {
        console.log("ERROR: Authorization was denied!");
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