import { loggingService, consoleLogWriter } from './loggingService';
var log = loggingService.getLogger("ariClientServer");

import { iClient, iClientModel } from "../common/AriInterfaces";
import AriEventEmitter from './AriEventEmitter';
var ariEvent = AriEventEmitter.getInstance();

import { EventEmitter } from 'events';
import { EventEmitter2 } from 'eventemitter2';


interface iUser {
    name: string;
}

interface iAriClients { [name: string]: iClientModel; };

// var clientModel: iClientModel = {
//     name: "HueGW",
//     description: "Philips HUE gateway.",
//     "getConfig": {
//         type: "Function",
//         description: "\
//             Returns the current configuration of the HueGW \
//             @param {number} a \
//             @param {number} b \
//             @returns {number}"
//     },
//     "setConfig": {
//         type: "Function",
//         description: "Set current configuration of the HueGW."
//     },
//     "Lights": {
//         __ssListeners: [(name, value)=>void]
//         description: "Lights group!",
//         "LivingroomTvLamp": {
//             description: "Lights group!",
//             "brightness": {
//                 type: "ioNumber",
//                 unit: "%",
//                 description: "Current state of the light. (1=On, 0=Off)",
//                 value: "1"
//             }
//         }
//     },
//     "Sensors": {
//         description: "Sensor group!"
//     }
// };

type callsHandlerType = (callName: string, parameters: any) => any;

export default class AriClientServer extends EventEmitter {

    private static clients: iAriClients = {};
    private static aliases: string[] = [];

    private name;
    private _nextReqId = 0;        // Id to use for identifying requests and corresponding response callbacks.
    private _pendingCallbacks = {};// Callbacks for pending server requests.
    private clients = AriClientServer.clients;

    private _callsHandler: callsHandlerType = null;

    constructor() {
        super();
        //this.ari = AriClientServer.ari;
    }

    onCalls(callsHandler: callsHandlerType) {
        this._callsHandler = callsHandler;
    }

    // Call command on client.
    _call(callName, params) {
        if (this._callsHandler) return this._callsHandler(callName, params);
    }

    // Notify client.
    private notify(cmd: string, data: any) {
        var msg = {
            cmd: cmd,
            data: data
        };
        this.emit("notify", msg);
    }

    disconnect() {
        //IDEA!
        //this.emit(this.name+".disconnected", true);
        this.clients[this.name]._connected = false;
        delete this.clients[this.name].__clientServer;
    }

    //*************************************************************************
    //
    _webcall_REQAUTHTOKEN(pars) {
        return new Promise((resolve, reject) => {
            //{ "name": this.name, "role": this.role, "password": this.password }
            if (pars.password == "please") {

                //TODO: Ensure name is unique
                this.name = pars.name;
                resolve({ "name": pars.name, "authToken": 42 }); // No checks or now.
            }
            else reject("Error: AuthToken invalid!");
        });
    }

    _webcall_CONNECT(pars) {
        return new Promise((resolve, reject) => {
            //{ "name": self.name, "authToken":this.authToken }
            if (pars.authToken == 42) {
                // TODO: Use name from authToken since this is registered with ari!
                this.name = pars.name;

                if (!this.clients[this.name]) {
                    this.clients[this.name] = {
                        type: "object",
                        __name: this.name,
                        __clientServer: this,
                        _connected: true,
                        _authenticated: false
                    };
                }
                this.clients[this.name]._connected = true;
                this.clients[this.name].__clientServer = this;
                resolve({ "name": pars.name, "authToken": 42 }); // No checks or now.
            }
            else reject("Error: AuthToken invalid!");
        });
    }

    //*************************************************************************
    //
    _webnotify_CLIENTINFO(clientInfo) {
        log.trace("_webcall_CLIENTINFO", clientInfo);

        // log.debug("New clientInfo from", clientName, ":", JSON.stringify(clientInfo, null, "\t"));

        // Merge client info with present info... Remove values, functions, etc. not in Info from client.
        var clientModel = this.clients[this.name];

        this.deleteRemoved(clientModel, clientInfo);

        // Perform deep merge from remote clientInfo to local clientModel.
        this.deepMerge(clientModel, clientInfo);

        // Make sure name is the one used in token!. (E.g. given name from server and not the default name from client.)
        clientModel.name = this.name;
    }

    // Delete object members of target that are not in model. Leave all value members. Ignore "__" double underscored members.
    private deleteRemoved(target, source) {
        for (var property in target) {
            if (typeof target[property] === "object" && target[property] !== null) {
                if (!(typeof source[property] === "object" && source[property] !== null)) {
                    if (!property.startsWith("__")) delete target[property];
                }
                else this.deleteRemoved(target[property], source[property]);
            }
        }
        return source;
    }

    // Set value of existing target proporties to value in corresponding source property. Ignore "__" double underscored members.
    private deepMerge(target, source) {
        for (var property in source) {
            if (typeof source[property] === "object" && source[property] !== null) {
                target[property] = target[property] || {};
                this.deepMerge(target[property], source[property]);
            } else {
                if (!property.startsWith("__")) target[property] = source[property];
            }
        }
        return target;
    };

    //*************************************************************************
    // Inputs
    _webnotify_SETINPUT(args) {
        var name = args.name;
        var value = args.value;

        var clientName = name.split(".")[0];
        var clientModel = this.clients[clientName];
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
    _webnotify_WATCHOUTPUT(args) {
        var name = args.name;

        var path = name.split(".");
        path.pop();
        var t = this.findPath(path, this.clients);
        if (t) {
            // Target found

            var ssIdx = name.indexOf(".**");
            if (ssIdx) {
                // ** listener
                t.__ssListeners = t.__ssListeners || [];
                t.__ssListeners.push(this.name);
            } else {
                var sIdx = name.indexOf(".*");
                if (sIdx) {
                    // * listener
                    t.__sListeners = t.__sListeners || [];
                    t.__sListeners.push(this.name);
                } else {
                    // non-wildcard listener
                    t.__listeners = t.__Listeners || [];
                    t.__listeners.push(this.name);
                }
            }
        }

        // Send subscription to client
        // FIXME: What if client previously subscribed
        // FIXME: How to determine when to unsubscribe @ client when no other clients subscribe?
        var clientName = name.split(".")[0];
        var clientModel = this.clients[clientName];
        if (clientModel) {
            var cs: AriClientServer = clientModel.__clientServer;
            if (cs) {
                name = name.substring(name.indexOf(".") + 1);
                args.name = name;
                cs.notify("WATCHOUTPUT", args);
            }
        }
    }

    _webnotify_UNWATCHOUTPUT(args) {
        var name = args.name;

        var clientName = name.split(".")[0];
        var clientModel = this.ari.clients[clientName];
        if (clientModel) {
            clientModel._outputWatches[name] -= 1;
            if (clientModel._outputWatches[name] == 0) delete clientModel._outputWatches[name];

            var cs: AriClientServer = clientModel.__clientServer;
            if (cs) {
                name = name.substring(name.indexOf(".") + 1);
                args.name = name;
                cs.notify("UNWATCHOUTPUT", args);
            }
        }
    }


    findPath(path: [string], obj: object) {
        if (path.length > 0) {
            var name = path.shift();
            if (obj.hasOwnProperty(name)) {
                return this.findPath(path, obj[name]);
            } else return undefined;
        } else return obj;
    }

    traversePath(path: [string], obj: object, cb: (path: [string], obj) => void) {
        cb(path, obj);
        if (path.length > 0) {
            var name = path.shift();
            if (obj.hasOwnProperty(name)) {
                this.traversePath(path, obj[name], cb);
            }
        }
    }

    _webnotify_OUTPUT(args) {
        var name = args.name;
        var value = args.value;

        // Convert possible alias.
        name = this.resolveAlias(name);
        this.traversePath(name.split("."), this.clients, (path, obj) => {
            log.debug("Path:" + path);
            // path exists so far. Check for ** listeners
            if (obj.__ssListener) {
                obj.__ssListener.forEach(listener => {
                    listener(name, value);
                });
            }
            // check for * listeners
            if (obj.__sListener && (path.length == 1)) {
                obj.__sListener.forEach(listener => {
                    listener(name, value);
                });
            }
            // Is this the destination value?
            if (path.length == 1) {
                var pName = path.shift();
                obj[pName] = value;
                obj.__timestamp = new Date().toISOString();
                if (obj.__listeners) obj.__listeners.forEach(listener => {
                    listener(name, value);
                });
                log.debug("Setting", name, "=", value);
            }
        });
    }

    // Find alias. Return name for alias if found. Return same name if not found.
    resolveAlias(alias) {
        return AriClientServer.aliases[alias] || alias;
    }

    findOutputByName(name) {
        var clientName = name.split(".")[0];

        // Find client.
        var client = this.clients[clientName];
        if (client) {
            var clientValueName = name.substring(name.indexOf(".") + 1);
            if (client.values) return client.values[clientValueName];
        }
        return undefined;
    }
    /*
        //*****************************************************************************
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
    */
}
