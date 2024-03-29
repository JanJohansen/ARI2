"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WebSocket = require('ws');
class AriClient {
    /**
     * Create NEW instance of AriClient.
     * If you want to use AriClient as a singletone use the "getInstance" static member.
     */
    constructor(name, options = {}) {
        this.reconnectInterval = 2000; // Interval in ms.
        this.isConnected = false;
        this.clientModel = { ins: {}, outs: {}, functions: {}, _outWatches: {} };
        this._nextReqId = 0; // Id to use for identifying requests and corresponding response callbacks.
        this._pendingCallbacks = {}; // Callbacks for pending server requests.
        this._pendingMsgs = []; // Buffer for messages that should have been sent while offline.    _nextReqId = 0;
        this._serverupdatePending = false;
        this._ws = null;
        this._protocolEvents = {};
        this._events = {};
        // For easier update, call this and re-register all again.
        this.clearInputs = function () {
            this.clientModel.ins = {};
            this.sendClientInfo();
        };
        // For easier update, call this and re-register all again.
        this.clearOutputs = function () {
            this.clientModel.outs = {};
            this.sendClientInfo();
        };
        //console.log("AriClient: Constructing...");
        this.clientModel.name = name;
        this.options = options;
        this.connectSocket();
    }
    /*
        static getInstance(...args){
            if(!AriClient._instance) AriClient._instance = new AriClient(args);
            return AriClient._instance;
        }
    */
    on(event, callback) {
        if (!this._events[event])
            this._events[event] = [];
        this._events[event].push(callback);
        return callback;
    }
    off(event, callback) {
        if (!this._events[event])
            return false;
        let pos = this._events[event].indexOf(callback);
        if (pos <= 0)
            return false;
        this._events[event].splice(pos, 1);
    }
    emit(event, ...args) {
        if (this._events[event]) {
            this.eventName = event; // The receivers can use this.event to get the event name!
            for (let i in this._events[event]) {
                this._events[event][i](args);
            }
            delete this.eventName;
        }
    }
    //*************************************************************************
    // Low level socket handling.
    //*************************************************************************
    connectSocket() {
        var self = this;
        // Get hold of websocket object depending on what platform we run in...
        if (typeof window === 'undefined') {
            // We're in NodeJS
            var WebSocket = require('ws');
        }
        //else WebSocket is global module in browsers.
        // Get URL to use if not provided in potions.
        if (!this.options.wsUrl) {
            if (typeof window !== 'undefined') {
                this.options.wsUrl = "ws://" + window.location.host;
            }
            else {
                this.options.wsUrl = "ws://localhost:4000/socket/";
            }
        }
        // Open socket!
        if (!this._ws) {
            //console.log("AriClient: Opening websocket -", this.options.wsUrl);
            this._ws = new WebSocket(this.options.wsUrl);
            this._ws.onopen = () => {
                //console.log("AriClient: websocket connected.");
                this.connectAri();
            };
            this._ws.onmessage = (message) => {
                //console.log("AriClient.wsMsg:", message.data);
                this.handleSocketMessage(message.data);
            };
            this._ws.onerror = () => {
                console.log('Socket error... Will try to reconnect...');
                if (self._ws) {
                    self._ws.close();
                    self._ws = null;
                }
                setTimeout(self.connectSocket.bind(self), self.reconnectInterval);
                this.disconnectAri();
            };
            this._ws.onclose = () => {
                console.log('Socket closed... Will try to reconnect...');
                if (self._ws) {
                    self._ws.close();
                    self._ws = null;
                }
                setTimeout(self.connectSocket.bind(self), self.reconnectInterval);
                this.disconnectAri();
            };
        }
    }
    socketSend(msg) {
        if (!this._ws) {
            console.log("Storing message until connected...");
            this._pendingMsgs.push(msg);
        }
        else if (this._ws.readyState != this._ws.OPEN) {
            console.log("Storing message until connected...");
            this._pendingMsgs.push(msg);
        }
        else {
            //console.log("AriClient: Sending msg:", msg);
            this._ws.send(msg);
        }
    }
    //*************************************************************************
    // Base protocol handling.
    //*************************************************************************
    handleSocketMessage(message) {
        try {
            var msg = JSON.parse(message);
        }
        catch (e) {
            console.log("Error: Illegal JSON in message! - Ignoring:", message);
            return;
        }
        var self = this;
        if ("req" in msg) {
            // Request message.
            var cmd = msg.cmd;
            if (!cmd) {
                console.log("Error: Missing comand in telegram! - Ignoring...");
                return;
            }
            ;
            if (this._events[cmd]) {
                // Requested function name is registere for callback. Call it...
                this["_webcall_" + cmd](msg.data, function (err, result) {
                    // reply with results...
                    var res = {};
                    res.res = msg.req;
                    res.err = err;
                    res.result = result;
                    self.socketSend(JSON.stringify(res));
                });
            }
        }
        else if ("res" in msg) {
            // Response message.
            var responseId = msg.res;
            // Get stored callback from calling function.
            var callback = this._pendingCallbacks[msg.res];
            if (callback) {
                delete this._pendingCallbacks[msg.res];
                //try {
                callback(msg.err, msg.result);
                /*} catch (e) {
                    console.log("Uncaught exception in callback for _call!", e);
                }*/
            }
            else {
                // No callback provided...
            }
        }
        else {
            // Notofication message.
            var cmd = msg.cmd;
            if (!cmd) {
                console.log("Error: Missing comand in telegram! - Ignoring...");
                return;
            }
            ;
            this["_webnotify_" + cmd](msg.data);
        }
    }
    call(cmd, data, callback) {
        var msg = {};
        msg.req = this._nextReqId++;
        msg.cmd = cmd;
        msg.data = data;
        if (callback) {
            // if callback is provided, store it to be called when response is received.
            this._pendingCallbacks[msg.req] = callback;
        }
        this.socketSend(JSON.stringify(msg));
    }
    notify(cmd, data) {
        var msg = {};
        msg.cmd = cmd;
        msg.data = data;
        this.socketSend(JSON.stringify(msg));
    }
    //*************************************************************************
    // ARI handling.
    //*************************************************************************
    //*************************************************************************
    // connect, disconnect, clientInfo
    connectAri() {
        if (!this.options.authToken) {
            // No authToken, so we need to request it.
            this.call("REQAUTHTOKEN", { "name": this.clientModel.name, "role": this.options.role, "password": this.options.password }, (err, result) => {
                if (err) {
                    console.log("Error:", err);
                    return;
                }
                this.clientModel.name = result.name;
                this.options.authToken = result.authToken;
                // Try to connect again.
                setTimeout(() => {
                    this.connectAri();
                }, 1);
            });
        }
        else {
            // We have authToken, so connect "normally".
            this.call("CONNECT", { "name": this.clientModel.name, "authToken": this.options.authToken }, (err, result) => {
                if (err) {
                    return;
                }
                console.log("Connect OK!");
                //console.log("registerClient result:", result);
                this.clientModel.name = result.name;
                // Send if we have stored msg's...
                for (var i = 0; i < this._pendingMsgs.length; i++) {
                    this._ws.send(this._pendingMsgs[i]);
                }
                this._pendingMsgs = [];
                this.isConnected = true;
                this.emit("connect", result);
            });
        }
    }
    disconnectAri() {
        this.emit("diconnect");
    }
    // ClientInfo 
    // This function sets a timeout function, so that after 10ms the update is sent.
    // If many updates are made to clientInfo (durgin startup), only one clientInfo update will be sent to the server!
    sendClientInfo() {
        if (!this._serverupdatePending) {
            this._serverupdatePending = true; // "static" member value of member function!
            var self = this;
            setTimeout(function () {
                this._serverupdatePending = false;
                // send clientInfo.
                self.notify("CLIENTINFO", self.clientModel);
                //console.log("clientInfo:", self.clientModel);
            }, 10);
        }
    }
    //*************************************************************************
    // Suppor to send logging info to server...
    log(loggerName, level, ...args) {
        if (this.options.loggingService)
            this.options.loggingService.logInput(loggerName, level, ...args);
        this.notify("log", args);
        console.log(loggerName, "\t", level, "\t", args);
    }
    //*************************************************************************
    // Inputs
    addInput(metadata, callback) {
        metadata._callback = callback;
        this.clientModel.ins[metadata.name] = metadata;
        this.sendClientInfo();
    }
    ;
    // Check if value has been registered.
    inputExists(name) {
        if (this.clientModel.ins[name])
            return true;
        else
            return false;
    }
    // Remove info about value and send update to server.
    removeInput(name) {
        delete this.clientModel.ins[name];
        this.sendClientInfo();
    }
    // Set remote input.
    setInput(name, value) {
        this.notify("SETINPUT", { "name": name, "value": value });
    }
    // Remote client wants to set a local input.
    _webnotify_INPUT(msg) {
        var name = msg.name;
        var value = msg.value;
        if (name == undefined || value == undefined)
            return;
        //console.log("SETVALUE:", name, "=", value);
        var inp = this.clientModel.ins[name];
        if (inp) {
            if (inp._callback)
                inp._callback(name, value);
        }
    }
    //*************************************************************************
    // Outputs
    addOutput(metadata) {
        this.clientModel.outs[metadata.name] = metadata;
        this.sendClientInfo();
        var self = this;
        return { send: (data) => { self.sendOutput(metadata.name, data); } };
    }
    ;
    // Check if value has been registered.
    outputExists(name) {
        if (this.clientModel.outs[name])
            return true;
        else
            return false;
    }
    // Remove info about value and send update to server.
    removeOutput(name) {
        delete this.clientModel.outs[name];
        this.sendClientInfo();
    }
    sendOutput(name, data) {
        this.notify("OUTPUT", { name: name, data: data });
    }
    // Server informs that a watched output changed.
    _webcall_OUTPUT(msg) {
        var name = msg.name;
        if (!name)
            return;
        //console.log("VALUE:", name, "=", msg.value);
        // Call all registered callbacks for watched values.
        // Allow * watches!
        var watch;
        for (watch in this.clientModel._outWatches) {
            if (this._matches(watch, name)) {
                watch = this.clientModel._outWatches[watch];
                for (var i in watch) {
                    watch[i](name, msg.data);
                }
            }
        }
    }
    /**
     * Watch remote client output - call function when output changes is notified.
     * Returns reference to the function. Store this to be able to unwatch for this specific callback in case you have more than one watch/callback on same value.
     */
    watchOutput(name, callback) {
        if (!this.clientModel._outWatches[name]) {
            this.clientModel._outWatches[name] = [];
            this.notify("WATCHOUTPUT", { "name": name });
        }
        this.clientModel._outWatches[name].push(callback);
        return callback;
    }
    // Server wants to watch an output.
    _webcall_WATCHOUTPUT(msg) {
        this.clientModel._outWatches[msg.name] = {};
    }
    /**
     * Provide original callback in case you have more than one callback per watch.
     * Calling unwatch without callback function will unwatch all callbacks for the value.
     */
    unWatchOutput(name, callback) {
        if (!callback) {
            delete this.clientModel._outWatches[name];
        }
        else {
            var watch = this.clientModel._outWatches[name];
            if (watch) {
                if (watch.length > 1)
                    watch.splice(watch.indexOf(callback), 1); // remove callback from list of callbacks for watch.
                else
                    delete this.clientModel._outWatches[name];
            }
        }
        if (!this.clientModel._outWatches[name]) {
            // If no other local watches on output, unwatch on server.
            this.notify("UNWATCHOUTPUT", { "name": name });
        }
    }
    // Server wants to watch an output.
    _webcall_UNWATCHOUTPUT(msg) {
        this.clientModel._outWatches[msg.name] = {};
    }
    //*************************************************************************
    // Functions
    addFunction(metadata, callback) {
        metadata._callback = callback;
        this.clientModel.functions[metadata.name] = metadata;
        this.sendClientInfo();
    }
    // Call function on remote client...
    callFunction(functionName, params, callback) {
        this.call("CALL", { "name": functionName, "params": params }, function (err, result) {
            callback(err, result);
        });
    }
    ;
    // Server calls function on this client...
    _webcall_CALL(msg, callback) {
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
        var callback = rpc._callback;
        var params = msg.params;
        // Call the local callback
        var result = callback(params, function (err, result) {
            // send result back.
            callback(err, result);
        });
    }
    //*************************************************************************
    // Utillity functions
    _matches(strA, strB) {
        if (strA == strB)
            return true;
        var aPos = strA.indexOf('*');
        if (aPos >= 0) {
            var aStr = strA.substring(0, aPos);
            if (aStr == strB.substring(0, aPos))
                return true;
        }
        return false;
    }
}
exports.default = AriClient;
//# sourceMappingURL=C:/Users/jan/Desktop/ARI2/dist/www/app/ariclient.js.map