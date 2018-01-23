import { loggingService, consoleLogWriter } from './loggingService';
var log = loggingService.getLogger("ariClientServer");
import AriEventEmitter from './AriEventEmitter';
var ariEvent = AriEventEmitter.getInstance();

/*
Protocol:
{<req: Number,> cmd: string, pars: object}
{<res: Number,> cmd: string, pars: object}
req/res only present if the telegram represents a request (e.g. remote function call)
req/res not present if the telegram represents a notification without any return value (e.g. set parameter, etc.)
Telegram with res member is a response to a request done where the req value. The res value will correspont to the sent req value.

Commands:
CONNECT
REQAUTHTOKEN
AUTHTOKEN
SETCLIENTINFO
WATCHVALUE
VALUE
UNWATCHVALUE
GETVALUE
SETVALUE
CALLFUNCTION


NEW:
CONNECT
REQAUTHTOKEN
AUTHTOKEN
SETMEMBERINFO {name, type, description, ...} {name} to clear!
    type: input, output, io, function, object

HueGW+getConfig = {type: "function", description: "", ...}
HueGW+Livingroom.Light = {type: "Number", description: "", value: }

Use EventEmitter2.
Function calls:
    AriClientServer subscribes to own clients name.**. (e.g. HueGW.**)
    Set HueGW.getConfig() = rpcId + parameters
    
    


*/

import {EventEmitter} from 'events';

interface iIn {
    name: string;
    description?: string;
}
interface iOut {
    name: string;
    alias?: string;
    description?: string;
    data?: any;
    updated?: any;
}
interface iFunction {
}
interface iClient {
    name: string;
    description?: string;
    connected: boolean;
    pendingAuthentication?: boolean;
    __clientServer?: AriClientServer;
    ins?: iIn[];
    outs?: iOut[];
    functions?: iFunction[];
    _outputWatches?: number[];
}
interface iUser{
    name: string;
}
interface ariRoot {
  clients: iClient[];
  users: iUser[]; 
}


export default class AriClientServer extends EventEmitter {

    static ari: ariRoot = {clients: {}, users: {}};
    private static aliases: string[] = [];
    private ari: ariRoot;
    private name;
    private _nextReqId = 0;        // Id to use for identifying requests and corresponding response callbacks.
    private _pendingCallbacks = {};// Callbacks for pending server requests.


    constructor() {
        super();
        this.ari = AriClientServer.ari;
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

    // Call command on client.
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
    
    // Notify client.
    private notify(cmd: string, data: any) {
        var msg: any = {};
        msg.cmd = cmd;
        msg.data = data;
        this.emit("msgOut", JSON.stringify(msg));
    }

    disconnect() {
        //IDEA!
        this.emit(this.name+".disconnected", true);
        this.ari.clients[this.name].connected = false;
        delete this.ari.clients[this.name].__clientServer;
    }

    //*************************************************************************
    //
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

            if(!this.ari.clients[this.name]){
                this.ari.clients[this.name] = {name: this.name, connected: true, pendingAuthentication: true};
            }
            this.ari.clients[this.name].connected = true;
            this.ari.clients[this.name].__clientServer = this;
            
            callback(null, { "name": pars.name, "authToken": 42 }); // No checks or now.
            
        }
        else callback("Error: AuthToken invalid!", null);
    }

    //*************************************************************************
    //
    _webnotify_CLIENTINFO(clientInfo) {
        log.trace("_webcall_CLIENTINFO", clientInfo);

//        log.debug("New clientInfo from", clientName, ":", JSON.stringify(clientInfo, null, "\t"));
        
        // Merge client info with present info... Remove values, functions, etc. not in Info from client.
        var clientModel = this.ari.clients[this.name];

        this.deleteRemoved(clientModel, clientInfo, "ins");
        this.deleteRemoved(clientModel, clientInfo, "outs");
        this.deleteRemoved(clientModel, clientInfo, "functions");

        // Perform deep merge from remote clientInfo to local clientModel.
        this.deepMerge(clientInfo, clientModel);

        // Make sure name is the one used in token!. (E.g. given name from server and not the default name from client.)
        clientModel.name = this.name;
    }

    // Delete members of obj.prop that are not in newObj.prop.
    // E.g. Delete clientModel.ins.something that are not in clienInfo.ins.something 
    private deleteRemoved(obj, newObj, prop){
        if (newObj[prop]) {
            for (var key in obj[prop]) {
                if (!newObj[prop][key]) {
                    // value removed from clientInfo - remove from clientModel.
                    delete obj[prop][key];
                }
            }
        } else delete obj[prop].ins;
    }

    private deepMerge(source, destination) {
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

    getAlias(alias: string){

        return "";
    }

    //*************************************************************************
    // Inputs
    _webnotify_SETINPUT(args) {
        var name = args.name;
        var value = args.value;

        var clientName = name.split(".")[0];
        var clientModel = this.ari.clients[clientName];
        if (clientModel) {
            var cs: AriClientServer = clientModel.__clientServer;
            if (cs) {
                // Remove client name and notify setValue...
                name = name.substring(name.indexOf(".") + 1);
                args.name = name;
                cs.notify("SETINPUT", args);
            }
        }
        // TODO: else check if alias
    }

    //*************************************************************************
    // Outputs
    _webnotify_WATCHOUTPUT(args){
        var name = args.name;
        
        var clientName = name.split(".")[0];
        var clientModel = this.ari.clients[clientName];
        if (clientModel) {
            if(!clientModel._outputWatches[name]) clientModel._outputWatches[name] = 0;
            clientModel._outputWatches[name] += 1;

            ariEvent.on("out." + name, ({data: data, name: name})=>{
                name = name.substring(name.indexOf(".") + 1);
                args.name = name;
                args.data = data;
                cs.notify("OUTPUT", args);
            });

            var cs: AriClientServer = clientModel.__clientServer;
            if (cs) {
                name = name.substring(name.indexOf(".") + 1);
                args.name = name;
                cs.notify("WATCHOUTPUT", args);
            }
        }
    }

    _webnotify_UNWATCHOUTPUT(args){
        var name = args.name;
        
        var clientName = name.split(".")[0];
        var clientModel = this.ari.clients[clientName];
        if (clientModel) {
            clientModel._outputWatches[name] -= 1;
            if(clientModel._outputWatches[name] == 0) delete clientModel._outputWatches[name];

            var cs: AriClientServer = clientModel.__clientServer;
            if (cs) {
                name = name.substring(name.indexOf(".") + 1);
                args.name = name;
                cs.notify("UNWATCHOUTPUT", args);
            }
        }
    }

    _webnotify_OUTPUT(args){
        var name = args.name;
        var data = args.data;

        // Convert possible alias.
        name = this.resolveAlias(name);

        var clientName = name.split(".")[0];
        var clientModel = this.ari.clients[clientName];
        if (clientModel) {
            // Store last value and time of update.
            if (clientModel.outs) {
                var clientValueName = name.substring(name.indexOf(".") + 1);
                var clientValue = clientModel.outs[clientValueName];
                if (clientValue) {
                    clientValue.data = data;
                    clientValue.updated = new Date().toISOString();
                }
            }
                        
            // Notify listeners about change of output.
            ariEvent.emit("out."+name, {name: name, data: data});
        }
    }

    // Find alias. Return name for alias if found. Return same name if not found.
    resolveAlias(alias) {
        return AriClientServer.aliases[alias] || alias;
    }

    findOutputByName(name) {
        var clientName = name.split(".")[0];
        
        // Find client.
        var client = this.clientModels[clientName];
        if (client) {
            var clientValueName = name.substring(name.indexOf(".") + 1);
            if (client.values) return client.values[clientValueName];
        }
        return undefined;
    }

    /*****************************************************************************/
    // Match possible wildcarded strA to strB.
    private matches(strA, strB)
    {
        if (strA == strB) return true;
        var aPos = strA.indexOf('*');
        if (aPos >= 0) {
            var aStr = strA.substring(0, aPos);
            if (aStr == strB.substring(0, aPos)) return true;
        }
        return false;
    }
    
    //*************************************************************************
    // Funcitions
    _webcall_CALL(args, callback){
        var name = args.name;
        var params = args.params;

        var clientName = name.split(".")[0];
        var clientModel = this.ari.clients[clientName];
        if (clientModel) {
            var cs: AriClientServer = clientModel.__clientServer;
            if (cs) {
                name = name.substring(name.indexOf(".") + 1);
                cs.call(name, params, callback);
            }
        }
    }
}
