import { EventEmitter } from "events";
import { iClient } from "./AriInterfaces";

type callsHandlerType = (callName: string, parameters: any) => any;

/*
class AriInput {
    _name: string;
    _parent = null;
    _type = "input";
    _attributes: { [name: string]: string } = {};
    _subscribed = false;
    onChange: (name: string, value: any) => void;
    onSet: (name: string, value: any) => void;
}

class AriOutput {
    _name: string;
    _parent = null;
    _type = "output";
    _attributes: { [name: string]: string } = {};
    _value: any;
    _subscribed = true;//false;

    set value(value) {
        this._value = value;
        if (this._subscribed) {
            this._notifyOutput(this._name, this._value);
        }
    }
    get value() {
        return this._value;
    }

    // Short form for accessing value!
    set v(value) {
        this.value = value;
    }
    get v() {
        return this.value;
    }

    _notifyOutput(path: string, value: any) {
        var p = this._parent;
        if (p.isAriClient) {
            p._notify("OUTPUT", { name: path, value: value });
        } else {
            path = p._name + "." + path;
            p._notifyOutput(path, value);
        }
    }
}

class AriFunction {
    _name: string;
    _parent = null;
    _type = "function";
    _attributes: { [name: string]: string } = {};
    onCall: (pars: any) => any;
}

class AriObject {
    _parent: any;
    _name: string;
    _type = "object"
    _members: any = {};
    _attributes: { [name: string]: string } = {};

    _notifyOutput(path: string, value: any) {
        var p = this._parent;
        if (p.isAriClient) {
            p._notify("OUTPUT", { name: path, value: value });
        } else {
            path = p._name + "." + path;
            p._notifyOutput(path, value);
        }
    }

    _toJsonString() {
        
    }

    addObject(name: string, attributes?: { [name: string]: string }): AriObject {
        var o = new AriObject();
        o._parent = this;
        o._name = name;
        o._attributes = attributes || {};
        this._members[name] = o;

        var p = this._parent;
        while(!p.isAriClient) {p = p._parent};
        p.sendClientInfo();

        return o;
    }

    addInput(name: string, attributes?: { [name: string]: string }, callback?: (name: string, value: any) => void): AriInput {
        var i = new AriInput();
        i._parent = this;
        i._name = name;
        i._attributes = attributes || {};
        i.onSet = callback;
        this._members[name] = i;
        return i;
    }

    addOutput(name: string, attributes?: { [name: string]: string }): AriOutput {
        var o = new AriOutput();
        o._parent = this;
        o._name = name;
        o._attributes = attributes || {};
        this._members[name] = o;
        return o;
    }

    addFunction(name: string, attributes?: { [name: string]: string }, callback?: Function): AriFunction {
        var f = new AriFunction();
        f._parent = this;
        f._name = name;
        f._attributes = attributes || {};
        this._members[name] = f;
        return f;
    }
}
*/

export default class AriClient extends EventEmitter {

    private _callsHandler: callsHandlerType = null;

    private _servicemodelUpdated = false;
    private role: string;
    private userPassword: string;
    private userName: string;
    private name: string;
    private connected = false;

    private _nextReqId = 0;        // Id to use for identifying requests and corresponding response callbacks.
    private _pendingCallbacks = {};// Callbacks for pending server requests.
    private _valueWatches = {};    // Watched values. callback= function to be calle don change of value...
    private reconnectInterval = 2000; // Interval (in mS) to wait before retrying to connect on unexpected disconnection or error. 0 = no retry!
    private authToken = null;
    private isConnected = false;

    // define clientInfo object to send to server and to maintain local state.
    // Note that members starting with "_" will NOT be sent to server! - So use this to store members with local relevance only.
    public serviceModel;
    public isAriClient = true;  // Hack to allow recognition of root node.!

    constructor(config?: { name?: string, authToken?: string, userName?: string, userPassword?: string }) {
        super();
        this.serviceModel = this.getProxyObject();
        this.serviceModel._name = config.name;

        if (config) {
            this.name = config.name || "NN_Client";
            this.authToken = config.authToken || 42;    // TODO: Implement storing authToken on disk or localstorage in browser...
            this.userName = config.userName || null;
            this.userPassword = config.userPassword || null;
        }
    }

    private async _authenticate() {
        const self = this;
        if (!self.authToken) {
            if (self.role) {
                // No authToken, so we need to request it.
                try {
                    var result = await self._call("REQAUTHTOKEN", { "name": self.name, "role": self.role });
                    self.name = result.name;
                    self.authToken = result.authToken;
                    // reconnect, now with authToken
                }
                catch (e) {
                    console.log("Error:", e);
                    return;
                }
            } else if (self.userName && self.userPassword) {
                // No authToken, so we need to request it.
                try {
                    let result = await self._call("REQAUTHTOKEN", { "name": self.name, "username": self.userName, "password": self.userPassword });
                    self.name = result.name;
                    self.authToken = result.authToken;
                    // reconnect, not with authToken
                } catch (e) {
                    console.log("Error:", e);
                    return;
                }
            }
        }

        if (self.authToken) {
            // We have authToken, so connect "normally".
            try {
                let result = await self._call("CONNECT", { "name": self.name, "authToken": self.authToken });
                self.name = result.name; // update local name in case server uses an indexed name for multiple instances of the same clientname e.g. "HueGW (2)"

                // TBD: Send clientInfo if already defined...

            } catch (e) {
                console.log("Error:", e);
                return;
            }
        }
    }

    onCalls(callsHandler: callsHandlerType) {
        this._callsHandler = callsHandler;
    }

    _call(callName, params) {
        if (this._callsHandler) return this._callsHandler(callName, params);
    }

    _notify(name, pars) {
        this.emit("notify", name, pars);
    }

    private getProxyObject() {
        var self = this;
        var handler = {
            get: (target, name, receiver) => {
                //console.log("Getting:", name);
                return target[name];
            },
            set: (target, name, value) => {
                if (typeof (value) == "object") {
                    value.__parent = target;
                    value.__name = name;
                    target[name] = new Proxy(value, handler);
                    console.log("ServiceModel updated!");
                    // Send updated clientmodel after ~10ms...
                    self.sendClientInfo();
                } else {
                    // Determine "path" to this member
                    var p = target.__parent;
                    var path = target.__name + "." + name;
                    while (p) {
                        if (p.__name) path = p.__name + "." + path;
                        p = p.__parent;
                    }

                    // Set .value propoerty if existing. This is a simpler way of using props. (Could be confusing though!?)
                    if (target[name]) {
                        if (target[name].hasOwnProperty("value")) {
                            target[name].value = value;
                        }
                    }
                    else {
                        target[name] = value;
                        //console.log("Setting:", path, "=", value);
                        // TODO: Send udpated value if any subscriptions.
                        self.emit("notify", "OUTPUT", { name: this.name + "." + path, value: value });
                    }
                }
                return true;
            }
        };
        return new Proxy({ __isRoot: true }, handler);
    }


    //*****************************************************************************
    // connect, disconnect --------------------------------------------------------

    // Normal connect with authToken.
    async connect(authToken = null) {
        await this._authenticate();
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
    private sendClientInfo() {
        if (!this._servicemodelUpdated) {
            this._servicemodelUpdated = true;

            var self = this;
            setTimeout(function () {
                self._servicemodelUpdated = false;
                // send clientInfo.
                self.emit("notify", "CLIENTINFO", self.serviceModel);
                //console.log("clientInfo:", self.serviceModel);
            }, 10);
        }
    }

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
