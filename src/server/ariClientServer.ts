import { loggingService, consoleLogWriter } from './loggingService';
var log = loggingService.getLogger("ariClientServer");

import {EventEmitter} from 'events';


export default class ariClientServer extends EventEmitter {

    private clientModel: any = {}; 
    private _nextReqId = 0;        // Id to use for identifying requests and corresponding response callbacks.
    private _pendingCallbacks = {};// Callbacks for pending server requests.
    //private _events = {};

    constructor() {
        super();
        this.emit("send", '"{"mcd":"HELLO"}');
    }

    handleMessage(message: string) {
        try { var msg = JSON.parse(message); }
        catch (e) { console.log("Error: Illegal JSON in message! - Ignoring..."); return; }
        
        var self = this;
        if ("req" in msg) {
            // Request message.
            var cmd = msg.cmd;
            if (!cmd) { console.log("Error: Missing comand in telegram! - Ignoring..."); return; };

            // Call requested function if it exists.
            if(this["_webcall_"+cmd]) {
                this["_webcall_"+cmd](msg.cmd, msg.data, function (err, result) {
                    // reply with results...
                    var res: any = {};
                    res.res = msg.req;
                    res.err = err;
                    res.result = result;
                    self.emit("send", JSON.stringify(res));
                });
            } else log.error("Handler for ariProtocol message", cmd, "not implemented!");
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
            if (!cmd) { log.error("Error: Missing comand in telegram! - Ignoring..."); return; };
            if(this["_webnotify_"+cmd]) {
                this["_webnotify_"+cmd](msg.cmd, msg.data);
            }
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
        this.emit("send", JSON.stringify(msg));
    }

    private notify(cmd: string, data: any) {
        var msg: any = {};
        msg.cmd = cmd;
        msg.data = data;
        this.emit("send", JSON.stringify(msg));
    }

    handleDisconnect() {

    }

    _webcall_REQAUTHTOKEN(cmd, pars, callback){
        //{ "name": this.name, "role": this.role, "password": this.password }
        callback(null, { "name": pars.name, "authToken": 42 }); // No checks or now.
    }
    
    _webcall_CONNECT(cmd, pars, callback){
        //{ "name": self.name, "authToken":this.authToken }
        callback(null, { "name": pars.name, "authToken": 42 }); // No checks or now.
    }

    //-----------------------------------------------------------------------------
    _webnotify_CLIENTINFO(clientInfo) {
        console.log("_webcall_CLIENTINFO", clientInfo);

        if (!this.clientModel) {
            console.log("ERROR trying to call SetClientInfo before calling Connect!");
            return;
        }

        // clientInfo has already been JSON.parsed!

        // Merge client info with present info... Remove values, functions, etc. not in Info from client.
        if (clientInfo.values) {
            for (var key in this.clientModel.values) {
                if (!clientInfo.values[key]) {
                    // value removed from clientInfo - remove from clientModel.
                    delete this.clientModel.values[key];
                }
            }
        }
        if (clientInfo.functions) {
            for (var key in this.clientModel.functions) {
                if (!clientInfo.functions[key]) {
                    // value removed from clientInfo - remove from clientModel.
                    delete this.clientModel.functions[key];
                }
            }
        }
        // Perform deep merge from remote clientInfo to local clientModel.
        this.deepMerge(clientInfo, this.clientModel);

        // Make sure name is the one used in token!. (E.g. given name from server and not the default name from client.)
        //this.clientModel.name = this.name;
        // HACK FOR NOW!
        this.clientModel.name = clientInfo.name;

    }

    deepMerge(source, destination) {
        for (var property in source) {
            if (typeof source[property] === "object" && source[property] !== null) {
                destination[property] = destination[property] || {};
                this.deepMerge(source[property], destination[property]);
            } else {
                destination[property] = source[property];
            }
        }
        return destination;
    };
}