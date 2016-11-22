import { loggingService, consoleLogWriter } from './loggingService';
var log = loggingService.getLogger("ariClientServer");
import AriEventEmitter from './AriEventEmitter';
var ariEvent: any = AriEventEmitter.getInstance();

import {EventEmitter} from 'events';
import Ari from './ari';


export default class ariClientServer extends EventEmitter {

    private ari: Ari;
    private name;
    private _nextReqId = 0;        // Id to use for identifying requests and corresponding response callbacks.
    private _pendingCallbacks = {};// Callbacks for pending server requests.

    constructor(ari) {
        super();
        this.ari = ari;
    }

    msgIn(message: string) {
        try { var msg = JSON.parse(message); }
        catch (e) { 
            log.error("Error: Illegal JSON in message! - Ignoring...");
            this.emit("closeOut");
            return; 
        }

        var self = this;
        if ("req" in msg) {
            // Request message.
            var cmd = msg.cmd;
            if (!cmd) { log.error("Error: Missing comand in telegram! - Ignoring..."); return; };

            // Call requested function if it exists.
            if(this["_webcall_"+cmd]) {
                this["_webcall_"+cmd](msg.data, function (err, result) {
                    // reply with results...
                    var res: any = {};
                    res.res = msg.req;
                    res.err = err;
                    res.result = result;
                    self.emit("msgOut", JSON.stringify(res));
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
                    log.fatal("Uncaught exception in callback for _call!", e);
                }*/
            } else {
                // No callback provided...
            }
        } else {
            // Notofication message.
            var cmd = msg.cmd;
            if (!cmd) { log.error("Error: Missing comand in telegram! - Ignoring..."); return; };
            if(this["_webnotify_"+cmd]) {
                this["_webnotify_"+cmd](msg.data);
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
        this.emit("msgOut", JSON.stringify(msg));
    }

    private notify(cmd: string, data: any) {
        var msg: any = {};
        msg.cmd = cmd;
        msg.data = data;
        this.emit("msgOut", JSON.stringify(msg));
    }

    disconnect() {
        this.ari.clientConnected(this.name);
    }

    _webcall_REQAUTHTOKEN(pars, callback){
        //{ "name": this.name, "role": this.role, "password": this.password }
        if(pars.password == "please") {
            
            //TODO: Ensure name is unique
            this.name = pars.name;
            callback(null, { "name": pars.name, "authToken": 42 }); // No checks or now.
        }
        else callback("Error: Wrong password.", null);
    }
    
    _webcall_CONNECT(pars, callback){
        //{ "name": self.name, "authToken":this.authToken }
        if(pars.authToken == 42) {
            // TODO: Use name from authToken since this is registered with ari!
            this.name = pars.name;
            callback(null, { "name": pars.name, "authToken": 42 }); // No checks or now.
            this.ari.clientConnected(this.name);
        }
        else callback("Error: AuthToken invalid!", null);
    }

    //-----------------------------------------------------------------------------
    _webnotify_CLIENTINFO(clientInfo) {
        log.trace("_webcall_CLIENTINFO", clientInfo);

        this.ari.setClientInfo(this.name, clientInfo);
    }

}