import { EventEmitter } from "events";

type callsHandlerType = (callName: string, parameters: any) => any;
type callHandlerType = (parameters: any) => any;

export default class RcpHandler extends EventEmitter {
    _nextReqId = 1;
    _pendingReplies = {};

    _callsHandler: callsHandlerType = null;
    _callHandlers: { [callName: string]: callHandlerType };

    static no__jsonReplacer(key, value) {
        if (key.startsWith("__")) return undefined;
        else return value;
    }
    
    jsonIn(json) {
        try {
            var msg = JSON.parse(json);
        } catch (e) {
            // Error in JSON string - ignoring!
            return;
        }

        if (msg.req != undefined) {
            // Server calls RPC on this client...
            if (!msg.cmd) {
                console.log("Error: Missing name of RPC to call! - Ignoring...");
                var res = {
                    res: msg.req,
                    err: "Protocol Error: Missing name of RPC to call! - Ignoring..."
                };
                this.emit("jsonOut", JSON.stringify(res, RcpHandler.no__jsonReplacer));
                return;
            }

            // This is a call with a requiest ID.
            if (this._callsHandler) {
                this._callsHandler(msg.cmd, msg.pars).then(
                    (fulfilled) => {
                        var res = {
                            res: msg.req,
                            success: fulfilled
                        };
                        this.emit("jsonOut", JSON.stringify(res, RcpHandler.no__jsonReplacer));
                    },
                    (rejected) => {
                        var res = {
                            res: msg.req,
                            err: rejected
                        };
                        this.emit("jsonOut", JSON.stringify(res, RcpHandler.no__jsonReplacer));
                    }
                );
            }
        }
        else if (msg.res) {
            if (msg.success) {
                let resolve = this._pendingReplies[msg.res][0];
                resolve(msg.success);
            } else if (msg.err) {
                let reject = this._pendingReplies[msg.res][1];
                reject(msg.err);
            }
            delete this._pendingReplies[msg.req];
        } else {
            if (!msg.cmd) {
                console.log("Error: Missing name of RPC to call! - Ignoring...");
                var res = {
                    res: msg.req,
                    err: "Protocol Error: Missing name of RPC to call! - Ignoring..."
                };
                this.emit("jsonOut", JSON.stringify(res, RcpHandler.no__jsonReplacer));
                return;
            } else this.emit("notify", msg.cmd, msg.pars);
        }
    };

    call(name, pars) {
        var msg = {
            req: this._nextReqId++,
            cmd: name,
            pars: pars
        };
        var promise = new Promise((resolve, reject) => {
            this._pendingReplies[msg.req] = [resolve, reject];
        });
        this.emit("jsonOut", JSON.stringify(msg, RcpHandler.no__jsonReplacer));
        return promise;
    }

    notify(name, pars) {
        var msg = {
            cmd: name,
            pars: pars
        };
        this.emit("jsonOut", JSON.stringify(msg, RcpHandler.no__jsonReplacer));
    }

    onCalls(callsHandler: callsHandlerType) {
        this._callsHandler = callsHandler;
    }

    onCall(callName, callHandler: callHandlerType) {
        this._callHandlers[callName] = callHandler;
    }
}