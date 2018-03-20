import { loggingService, consoleLogWriter } from './loggingService';
var log = loggingService.getLogger("ariClientServer");

import { EventEmitter } from 'events';
import { AriObjectModel, AriEvent } from "../common/AriObjectModel";

type callsHandlerType = (callName: string, parameters: any) => any;

export default class AriClientServer extends EventEmitter {

    private static aliases: string[] = [];
    private static ariRoot = new AriObjectModel(null, "AriRoot");
    private ariRoot = AriClientServer.ariRoot;

    private name;
    private _nextReqId = 0;        // Id to use for identifying requests and corresponding response callbacks.
    private _pendingCallbacks = {};// Callbacks for pending server requests.

    private _callsHandler: callsHandlerType = null;
    private subCBFunc = this.subCB.bind(this);
    private connected = false;

    constructor() {
        super();
        this.connected = true;
    }

    handleMessage(json) {
        //log.debug("HandleMsg:", json);
        var msg;
        try {
            msg = JSON.parse(json);
        } catch (e) {
            log.error("Error in JSON message from server. Ignoring message.")
        }

        let cmd = msg.cmd;
        if ("_remote_" + cmd in this) this["_remote_" + cmd](msg);
        else log.error("Server trying to call unknown method:", cmd);
    }

    _remote_sub(msg) {
        if(msg.name == "") this.ariRoot.on("oSet", this.subCBFunc);
        else if (msg.name.endsWith(".**")) {
            var name = msg.name.substring(msg.name.length - 3);
            var obj = this.ariRoot.findPath(name, "obj");
            obj.on("oSet", this.subCBFunc);
        } else {
            var obj = this.ariRoot.findPath(msg.name, "out");
            obj.on("oSet", this.subCBFunc);
        }
    }

    subCB(evt) {
        this.send({ cmd: "oSet", name: this.ariRoot.pathToHere(evt.target), value: evt.value });
    }

    _remote_oSet(msg) {
        var ariValue = this.ariRoot.findPath("Clients." + this.name + "." + msg.name, "out");
        //if(ariValue instanceof AriInputModel) ariValue.value = msg.value;
        ariValue.dispatchEvent(new AriEvent("oSet", { target: ariValue, value: msg.value }));
        // else ignore!
    }

    static no__jsonReplacer(key, value) {
        if (key.startsWith("__")) return undefined;
        else return value;
    }

    private send(msg) {
        if (this.connected) this.emit("toClient", JSON.stringify(msg, AriClientServer.no__jsonReplacer));
    }

    disconnect() {
        this.connected = false;
        var ariThis = this.ariRoot.findPath("Clients." + this.name) as AriObjectModel;
        ariThis.clearListeners("oSet", this.subCBFunc);
        ariThis["__ClientServer"] = null;
        ariThis["__authenticated"] = false;
        ariThis.outs.connected.value = false;
    }

    //*************************************************************************
    //
    _remote_auth(msg) {
        if (msg.token == 42) {
            // TODO: Use name from authToken since this is registered with ari!
            this.name = this.generateUniqueName(msg.name);

            var ariThis = this.ariRoot.findPath("Clients." + this.name, "obj") as any;
            ariThis.__clientServer = this;
            ariThis.__authenticated = true;
            ariThis.addOutput("connected");
            ariThis.outs.connected.value = true;

            this.send({ cmd: "authOk", name: msg.name, "token": 42 }); // No checks for now.
        }
        else this.send({ cmd: "authNok", name: msg.name, "token": 42 }); // No checks for now.
    }

    generateUniqueName(name) {
        var newName = name;
        var idx = 1;
        var services = this.ariRoot.findPath("Clients", "obj");
        while (newName in services && (services[newName] instanceof AriObjectModel)) {
            newName = name + "(" + idx.toString() + ")";
            idx++;
        }
        return newName;
    }

    //*************************************************************************
    //
    _remote_clientinfo(msg) {
        var clientInfo = msg.clientInfo;
        log.trace("_remote_CLIENTINFO", clientInfo);

        // log.debug("New clientInfo from", clientName, ":", JSON.stringify(clientInfo, null, "\t"));

        // Merge client info with present info... Remove values, functions, etc. not in Info from client.
        var clientModel = this.ariRoot.findPath("Services." + this.name, "obj");

        //clientModel.updateModel(clientInfo);

        // Make sure name is the one used in token!. (E.g. given name from server and not the default name from client.)
        //        clientModel.name = this.name;
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
    // Find alias. Return name for alias if found. Return same name if not found.
    resolveAlias(alias) {
        return AriClientServer.aliases[alias] || alias;
    }
}
