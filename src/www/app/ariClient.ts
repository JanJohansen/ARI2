var WebSocket = require('ws');

export default class AriClient {
    authToken: string;
    reconnectInterval = 2000;   // Interval in ms.
    role: string;
    name: string;
    password: string;
    options: any;
    event: string;
    clientModel: any = {ins: {}, outs: {}, functions: {}, _outWatches: {}};
    
    private _nextReqId = 0;        // Id to use for identifying requests and corresponding response callbacks.
    private _pendingCallbacks = {};// Callbacks for pending server requests.
    private _pendingMsgs = [];     // Buffer for messages that should have been sent while offline.    _nextReqId = 0;
    private _serverupdatePending = false;
    private _ws: any = null;
    private _protocolEvents = {};
    private _events = {};
    private static _instance: AriClient;
    
    /** 
     * Create NEW instance of AriClient.
     * If you want to use AriClient as a singletone use the "getInstance" static member.
     */
    constructor(options: any = {}){
        this.options = options;
        this.connectSocket();
    }

    static getInstance(...args){
        if(!AriClient._instance) AriClient._instance = new AriClient(args);
        return AriClient._instance;
    }

    on(event: string, callback: (event: string, ...args: any[])=>void){
        if(!this._events[event]) this._events[event] = [];
        this._events[event].push(callback);
        return callback;
    }

    off(event: string, callback: (event: string, ...args: any[])=>void){
        if(!this._events[event]) return false;
        let pos = this._events[event].indexOf(callback);
        if(pos<=0) return false;
        this._events[event].splice(pos, 1);
    }

    private emit(event: string, ...args: any[]){
        if(!this._events[event]) {
            this.event = event; // The receivers can use this.event to get the event name!
            for(let i in this._events[event])
            {
                this._events[event][i](args);
            }
            delete this.event;
        }
    }

    //*************************************************************************
    // Low level socket handling.
    //*************************************************************************
    private connectSocket() {
        var self = this;
        // Get hold of websocket object depending on what platform we run in...
        if (typeof window === 'undefined') {
            // We're in NodeJS
            var WebSocket = require('ws');
        } 
        //else WebSocket is global module in browsers.
        
        // Get URL to use if not provided in potions.
        if(!this.options.wsUrl){
            if (typeof window !== 'undefined') { // Config for browser
                this.options.wsUrl = "ws://" + window.location.host;
            } else {
                this.options.wsUrl = "ws://localhost:4000/socket/";
            }
        }        
        // Open socket!
        if (!this._ws) {
            //console.log("Creating WSocket!");
            this._ws = new WebSocket(this.options.wsUrl);
        
            this._ws.onopen = () => {
                this.connectAri();
            }

            this._ws.onmessage = (message) => {
                this.handleSocketMessage(message);
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

    private socketSend(msg){
        if (!this._ws) {
            console.log("Storing message until connected...");
            this._pendingMsgs.push(msg);
        }
        else if (this._ws.readyState != this._ws.OPEN) {
            console.log("Storing message until connected...");
            this._pendingMsgs.push(msg);
        }
        else this._ws.send(msg);
        console.log("->", msg);
    }

    //*************************************************************************
    // Base protocol handling.
    //*************************************************************************
    private handleSocketMessage(message: string) {
        try { var msg = JSON.parse(message); }
        catch (e) { console.log("Error: Illegal JSON in message! - Ignoring..."); return; }
        
        var self = this;
        if ("req" in msg) {
            // Request message.
            var cmd = msg.cmd;
            if (!cmd) { console.log("Error: Missing comand in telegram! - Ignoring..."); return; };
            if (this._events[cmd]) {
                // Requested function name is registere for callback. Call it...
                this["_webcall_"+cmd](msg.cmd, msg.data, function (err, result) {
                    // reply with results...
                    var res: any = {};
                    res.res = msg.req;
                    res.err = err;
                    res.result = result;
                    self.socketSend(JSON.stringify(res));
                });
            }
        } else if ("res" in msg) {
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
            } else {
                // No callback provided...
            }
        } else {
            // Notofication message.
            var cmd = msg.cmd;
            if (!cmd) { console.log("Error: Missing comand in telegram! - Ignoring..."); return; };
            this["_webnotify_"+cmd](msg.cmd, msg.data);
        }
    }

    private call(cmd: string, data: any, callback: (err, result) => void) {
        var msg: any = {};
        msg.req = this._nextReqId++;
        msg.cmd = cmd;
        msg.data = data;
        if (callback) {
            // if callback is provided, store it to be called when response is received.
            this._pendingCallbacks[msg.req] = callback;
        }
        this.socketSend(JSON.stringify(msg));
    }

    private notify(cmd: string, data: any) {
        var msg: any = {};
        msg.cmd = cmd;
        msg.data = data;
        this.socketSend(JSON.stringify(msg));
    }


    //*************************************************************************
    // ARI handling.
    //*************************************************************************

    //*************************************************************************
    // connect, disconnect, clientInfo
    private connectAri() {
        if (!this.options.authToken) {
            // No authToken, so we need to request it.
            this.call("REQAUTHTOKEN", { "name": this.name, "role": this.role, "password": this.password }, (err, result) => {
                if (err) { console.log("Error:", err); return; }
                this.name = result.name;
                this.options.authToken = result.authToken;

                // Try to connect again.
                setTimeout(() => {
                    this.connectAri();
                }, 1);
            });
        } else {
            // We have authToken, so connect "normally".
            this.call("CONNECT", { "name": self.name, "authToken":this.authToken }, function (err, result) {
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
                this.emit("connect", result);
            });
        }
    }

    private disconnectAri(){
        this.emit("diconnect");
    }

    // ClientInfo 
    // This function sets a timeout function, so that after 10ms the update is sent.
    // If many updates are made to clientInfo (durgin startup), only one clientInfo update will be sent to the server!
    private sendClientInfo(){

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
    log(loggerName: string, level: string, ...args: any[]){
        if(this.options.loggingService) this.options.loggingService.logInput(loggerName, level,  ...args);
        this.notify("log", args);
        console.log(loggerName, "\t", level, "\t", args);
    }


    //*************************************************************************
    // Inputs
    addInput(metadata: any, callback: (inputName: string, data: any)=>void){
        metadata._callback = callback;
        this.clientModel.ins[metadata.name] = metadata;
        this.sendClientInfo();
    };
    
    // Check if value has been registered.
    inputExists(name) {
        if (this.clientModel.ins[name]) return true;
        else return false;
    }

    // Remove info about value and send update to server.
    removeInput(name) {
        delete this.clientModel.ins[name];
        this.sendClientInfo();
    }

    // For easier update, call this and re-register all again.
    clearInputs = function () {
        this.clientModel.inputs = {};
        this.sendClientInfo();
    }


    //*************************************************************************
    // Outputs
    addOutput(metadata: any){
        this.clientModel.ins[metadata.name] = metadata;
        this.sendClientInfo();
        var self=this;
        return {send: (data)=>{self.sendOutput(metadata.name, data)}};
    };
    
    // Check if value has been registered.
    outputExists(name) {
        if (this.clientModel.outs[name]) return true;
        else return false;
    }

    // Remove info about value and send update to server.
    removeOutput(name) {
        delete this.clientModel.outs[name];
        this.sendClientInfo();
    }

    sendOutput(name: string, data: any){
        this.notify("OUTPUT", {name: name, data: data});
    }

    // For easier update, call this and re-register all again.
    private clearOutputs = function () {
        this.clientModel.outputs = {};
        this.sendClientInfo();
    }

    //*************************************************************************
    // Remote outputs

    /**
     * Watch remote client output - call function when output changes is notified.
     * Returns reference to the function. Store this to be able to unwatch for this specific callback in case you have more than one watch/callback on same value. 
     */
    watchOutput(name, callback: (outputName: string, data: any)=>void) {
        if (!this.clientModel._outWatches[name]) 
        {
            this.clientModel._outWatches[name] = [];
            this.notify("WATCHOUTPUT", { "name": name });
        }
        this.clientModel._outWatches[name].push(callback);
        return callback;
    }

    /**
     * Provide original callback in case you have more than one callback per watch. 
     * Calling unwatch without callback function will unwatch all callbacks for the value.
     */
    unWatchOutput(name, callback: (outputName: string, data: any)=>void) {
        if (!callback) {
            delete this.clientModel._outWatches[name];
        } else {
            var watch = this.clientModel._outWatches[name];
            if (watch) {
                if(watch.length > 1) watch.splice(watch.indexOf(callback), 1);   // remove callback from list of callbacks for watch.
                else delete this.clientModel._outWatches[name];
            }
        }
        if (!this.clientModel._outWatches[name]) {
            // If no other local watches on output, unwatch on server.
            this.notify("UNWATCHVALUE", { "name": name });
        }
    }

    // Server informs that a watched output changed.
    _webcall_OUTPUT(msg){
        var name = msg.name;
        if (!name) return;

        //console.log("VALUE:", name, "=", msg.value);

        // Call all registered callbacks for watched values.
        // Allow * watches!
        var watch: any;
        for (watch in this.clientModel._outWatches) {
            if (this._matches(watch, name)) {
                watch = this.clientModel._outWatches[watch];
                for (var i in watch) {
                    watch[i](name, msg.value);
                }
            }
        }
    }

    // Get latest reported value from server.
    /*
    getOutputCache(name, callback) {
        this._call("GETVALUE", { "name": name }, function (err, result) {
            callback(err, result);
        });
    }
    */

    //*************************************************************************
    // Remote inputs

    // Set remote values.
    setInput(name, value) {
        this.notify("SETINPUT", { "name": name, "value": value });
    }

    // Remote client wants to set a local value.
    _webnotify_SETINPUT(msg) {
        var name = msg.name;
        var value = msg.value;
        if (name == undefined || value == undefined) return;

        //console.log("SETVALUE:", name, "=", value);

        var v = this.clientModel.values[name];
        if (v) {
            if(v._callback) v._callback(name, value)
        }
    }
    

    //*************************************************************************
    // Functions

    addFunction(metadata: any, callback: (err: string, result: any)=>void){
        metadata._callback = callback;
        this.clientModel.functions[metadata.name] = metadata;
        this.sendClientInfo();
    }

    // Call function on remote client...
    callFunction(functionName, params, callback: (err: string, result: any)=>void) {
        this.call("CALLFUNCTION", { "name": functionName, "params": params }, function (err, result) {
            callback(err, result);
        });
    };

    // Server calls function on this client...
    _webcall_CALLFUNCTION(msg, callback) {
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
    
    private _matches(strA, strB) {
        if (strA == strB) return true;
        var aPos = strA.indexOf('*');
        if (aPos >= 0) {
            var aStr = strA.substring(0, aPos);
            if (aStr == strB.substring(0, aPos)) return true;
        }
        return false;
    }
}
