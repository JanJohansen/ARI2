import PubSubStore from "../common/PubSubStore";
import { EventEmitter } from "events";

type callsHandlerType = (callName: string, parameters: any) => any;

export default class AriClient extends EventEmitter {

    private _clientInfoTimer;
    public onMessageOut: (message: string) => void = null;

    private role: string;
    private userPassword: string;
    private userName: string;
    private name: string;
    private connected = false;

    private _nextReqId = 0;        // Id to use for identifying requests and corresponding response callbacks.
    private _pendingCallbacks = {};// Callbacks for pending server requests.
    private reconnectInterval = 2000; // Interval (in mS) to wait before retrying to connect on unexpected disconnection or error. 0 = no retry!
    private authToken = null;

    // define clientInfo object to send to server and to maintain local state.
    // Note that members starting with "__" will NOT be sent to server! - So use this to store members with local relevance only.
    private localModel: PubSubStore;
    private remoteModel: PubSubStore;

    constructor(config?: { name?: string, authToken?: string, userName?: string, userPassword?: string, attributes? : any }) {
        super();
        this.localModel = new PubSubStore();
        this.remoteModel = new PubSubStore();

        if (config) {
            this.name = config.name || "NN_Client";
            this.authToken = config.authToken || 42;    // TODO: Implement storing authToken on disk or localstorage in browser...
            this.userName = config.userName || null;
            this.userPassword = config.userPassword || null;
            this.localModel.setAttributes("", config.attributes);
        }

        // Send all changes to server.
        var self = this;
        this.localModel.sub("**", (name, value) => {
            if (self.connected) self.send({ cmd: "set", name: name, value: value });
        });
    }

    static no__jsonReplacer(key, value) {
        if (key.startsWith("__")) return undefined;
        else return value;
    }

    handleMessage(json) {
        var msg;
        try {
            msg = JSON.parse(json);
        } catch (e) {
            log.error("Error in JSON message from server. Ignoring message.")
        }

        let cmd = msg.cmd;
        if ("_remote_" + cmd in this) this["_remote_" + cmd](msg);
        else console.log("Error: Server trying to call unknown method:", cmd);
    }

    // CLIENT!
    sub(name, cb) {
        if (name.startsWith(".")) {
            var localName = name.substring(1);
            this.localModel.sub(localName, cb);
            this._checkClientInfoUpdate();
        }
        else {
            this.send({ cmd: "sub", name: name });
            return this.remoteModel.sub(name, cb);
        }
    }

    public _remote_sub(name) {
        return this.localModel.sub(name, this.remoteSubsCB);
    }

    //-------------
    pub(name, value) {
        if (name.startsWith(".")) {
            var localName = name.substring(1);
            this.localModel.pub(localName, value);
            this._checkClientInfoUpdate();
        } else {
            this.send({ cmd: "pub", name: name });
            return this.remoteModel.pub(name, value);
        }
    }

    public _remote_pub(msg) {
        this.remoteModel.pub(msg.name, msg.value);
    }

    //-------------
    unsub(name, cb) {
        if (name.startsWith(".")) {
            var localName = name.substring(1);
            this.localModel.unsub(localName, cb);
            this._checkClientInfoUpdate();
        }
        else {
            var listeners = this.remoteModel.getListeners(name);
            if (listeners.length == 1) {
                // We will remove the last listener to the remote topic...
                this.send({ cmd: "unsub", name: name });
            }
            this.remoteModel.unsub(name, cb);
        }
    }

    public _remote_unsub(msg) {
        return this.remoteModel.unsub(msg.name, this.remoteSubsCB);
    }

    //-------------
    public setAttributes(name, attributes) {
        if (name.startsWith(".")) name = name.substring(1);
        this.localModel.setAttributes(name, attributes);
    }

    //-------------
    private remoteSubsCB(value, name) {
        this.send({ cmd: "pub", name: name, value: value });
    }

    private _checkClientInfoUpdate() {
        if (this.localModel.pubSubTreeUpdated) {
            var self = this;
            if (!this._clientInfoTimer) {
                this._clientInfoTimer = setTimeout(() => {
                    self._clientInfoTimer = null;
                    self.sendClientInfo();
                }, 10);
            }
        }
    }

    sendClientInfo() {
        this.localModel.pubSubTreeUpdated = false;
        // Publish local pubsubtree or special message for server?
        this.send({ cmd: "clientinfo", clientInfo: this.localModel.pubsubTree });
    }


    private send(msg) {
        if (this.onMessageOut) this.onMessageOut(JSON.stringify(msg, AriClient.no__jsonReplacer));
    }

    /*
    async callRemote(name, pars) {
        var reqId = 0;
        this.on("name" + "reply", (val) => {
            if (val.result.reqId) {
                var p = this._pendingCallbacks[val.result.resId];
                delete this._pendingCallbacks[val.result.resId];
                p[0](val.result);
            }
        });
        this.emit("name" + "call", { id: reqId, pars: pars });
        return new Promise((resolve, reject) => {
            this._pendingCallbacks[reqId++] = [resolve, reject];
        });
    }
*/

    public log(...args) {
        this.send({ cmd: "log", message: args });
    }


    private _authenticate() {
        const self = this;
        if (self.authToken) {
            // We have authToken, so connect "normally".
            this.send({ cmd: "auth", token: self.authToken, name: self.name });
        } else {
            if (self.role) {
                // No authToken, so we need to request it.
                this.send({ auth: { name: self.name, role: self.role } });
            } else if (self.userName && self.userPassword) {
                // No authToken, so we need to request it.
                this.send({ auth: { name: self.name, username: self.userName, password: self.userPassword } });
            }
        }
    }

    _remote_authOk(msg) {
        this.name = msg.name;
        this.connected = true;
        this.emit("authenticated");
    }

    //*****************************************************************************
    // connect, disconnect --------------------------------------------------------

    // Normal connect with authToken.
    connect(authToken = null) {
        this._authenticate();
        this.emit("connected");
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
    close() {
        this.reconnectInterval = 0;    // No reconnect!
        this.emit("disconnect");
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



    //*****************************************************************************
    // Objects --------------------------------------------------------------------


    //*****************************************************************************
    // Values ---------------------------------------------------------------------
    registerMember(name, optionals, inputCallback) {
        //this.clientModel.values[name] = optionals || {};
        //this.clientModel.values[name]._callback = inputCallback;
        this.sendClientInfo();
    }
    /*
        // Check if value has been registered.
        isValueRegistered (name) {
            if (this.clientModel.values[name]) return true;
            else return false;
        }
    
        // Remove info about value and send update to server.
        unRegisterValue (name) {
            delete this.clientModel.values[name];
            this.sendClientInfo();
        }
    
        // Watch remote client value - call function when value change is notified.
        // Returns reference to the function. Store this to be able to unwatch for this specific callback in case you have more than one watch/callback on same value.
        watchValue (name, callback) {
            // Target structure: this.clientModel._watches = {valName1: [function1, function2,...], valName2: [function3, function4,...], ...}
            if (!this.clientModel._watches) this.clientModel._watches = {};
            if (!this.clientModel._watches[name]) this.clientModel._watches[name] = [];
            this.clientModel._watches[name].push(callback);
            this._notify("WATCHVALUE", { "name": name });
            return callback;
        }
    
        // unWatch value
        // Provide original callback in case you have more than one callback per watch. Calling unwatch without callback function will unwatch all callbacks for the value.
        unWatchValue (name, callback) {
            if (!callback) {
                if (this.clientModel._watches) delete this.clientModel._watches[name];
            } else {
                if (this.clientModel._watches) {
                    var watch = this.clientModel._watches[name];
                    if (watch) {
                        watch.splice(watch.indexOf(callback), 1);   // remove callback from list of callbacks for watch.
                    }
                }
            }
            if (!this.clientModel._watches || !this.clientModel._watches[name] || this.clientModel._watches[name].length == 0) {
                this._notify("UNWATCHVALUE", { "name": name });
            }
        }
    
        // Get latest reported value from server.
        getValue (name, callback) {
            this._call("GETVALUE", { "name": name }, function (err, result) {
                callback(err, result);
            });
        }
    
        // Function to set local or remote values.
        setValue (name, value) {
            if (this.clientModel.values.hasOwnProperty(name)) {
                // Local value - store local value and notify server of update.
                this.clientModel.values[name].value = value;
                this._notify("VALUE", { "name": name, "value": value });
            } else {
                // Not local - possibly remote, so send set request to server.
                this._notify("SETVALUE", { "name": name, "value": value });
            }
        }
    
        // Server informs that a watched value has been updated.
        _webnotify_VALUE (msg) {
            var name = msg.name;
            if (!name) return;
    
            //console.log("VALUE:", name, "=", msg.value);
    
            // Call all registered callbacks for watched values.
            for (var watch in this.clientModel._watches) {
                if (this._matches(watch, name)) {
                    watch = this.clientModel._watches[watch];
                    for (var i in watch) {
                        watch[i](name, msg.value);
                    }
                }
            }
        }
    
        // Remote client wants to set a local value.
        _webnotify_SETVALUE (msg) {
            var name = msg.name;
            var value = msg.value;
            if (name == undefined || value == undefined) return;
    
            //console.log("SETVALUE:", name, "=", value);
    
            var v = this.clientModel.values[name];
            if (v) {
                if (v._callback) v._callback(name, value)
            }
        }
    
        //*****************************************************************************
        // PUB/SUB --------------------------------------------------------------------
        subscribe (name, callback) {
            this.clientModel.subscriptions[name] = { "_callback": callback };
            this.sendClientInfo();
        }
    
        publish (name, value) {
            this._notify("PUBLISH", { "name": name, "value": value });
        }
    
        unsubscribe (name, callback) {
            if (this.clientModel.subscriptions[name]) delete this.clientModel.subscriptions[name];
            this.sendClientInfo();
        }
    
        // Server published value to client.
        _webnotify_PUBLISH (msg) {
            var name = msg.name;
            if (!name) {
                return;
            }
    
            for (var subName in this.clientModel.subscriptions) {
                if (this._matches(subName, name)) {
                    var value = msg.value;
    
                    // Call the local callback
                    this.clientModel.subscriptions[subName].callback(name, value);
                }
            }
        }
    
        //*****************************************************************************
        // Register Function that can be called on client...
        registerFunction (name, optionals, functionToCall) {
            this.clientModel.functions[name] = { "func": functionToCall };
            this.sendClientInfo();
        };
    
        // Call function on remote client...
        callFunction (rpcName, params, callback) {
            this._call("CALLFUNCTION", { "name": rpcName, "params": params }, function (err, result) {
                callback(err, result);
            });
        };
    
        // Server calls RPC on this client...
        _webcall_CALLFUNCTION (msg, callback) {
            var rpcName = msg.name;
            if (!rpcName) {
                console.log("Error: Missing name of RPC to call! - Ignoring...");
                callback("Error: Missing name of RPC to call at client!", null);
                return;
            }
    
            if (!this.clientModel.functions.hasOwnProperty(rpcName)) {
                console.log("Error: Name of RPC not previously registered! - Ignoring...");
                callback("Error: RPC unkknown at client!", null);
                return;
            }
            var rpc = this.clientModel.functions[rpcName];
            var rpcFunc = rpc.func;
    
            var params = msg.params;
    
            // Call the local RPC
            var result = rpcFunc(params, function (err, result) {
                // send result back.
                callback(err, result);
            });
        }
    */
}


/*
function transferOpts(origOpts, newOpts) {
    if (newOpts == null) return;
    for (var key in newOpts) {
        if (key.indexOf("_") != 0) origOpts[key] = newOpts[key];    // Copy all but "private" members.
    }
}

//*****************************************************************************
// EventListener implementation...
AriClient.prototype.on = function (event, fct) {
    this._events = this._events || {};
    this._events[event] = this._events[event] || [];
    this._events[event].push(fct);
};

AriClient.prototype.unbind = function (event, fct) {
    this._events = this._events || {};
    if (event in this._events === false) return;
    this._events[event].splice(this._events[event].indexOf(fct), 1);
};

AriClient.prototype._trigger = function (event , args) {
    this._events = this._events || {};
    if (event in this._events === false) return;
    for (var i = 0; i < this._events[event].length; i++) {
        //console.log("DBG!!!", event, this._events);
        this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1));
    }
};
*/
