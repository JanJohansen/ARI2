
export default class AriBaseProtocol {
    _nextReqId = 0;        // Id to use for identifying requests and corresponding response callbacks.
    _pendingCallbacks = {};// Callbacks for pending server requests.
    _pendingMsgs = [];     // Buffer for messages that should have been sent while offline.    _nextReqId = 0;
    _cmdListeners = {};

    // Outputs:
    msgOut: (message: string) => void;

    constructor() {

    }

    // Register function to be called uppon reception of specific command.
    on(cmd: string, successCallback: (cmd: string, data: any)=>void, errorCallback: (error: any, result: any)=>void){
        this._cmdListeners[cmd] = successCallback;
    };

    msgIn(message: string) {
        try { var msg = JSON.parse(message); }
        catch (e) { console.log("Error: Illegal JSON in message! - Ignoring..."); return; }

        if ("req" in msg) {
            // Request message.
            var cmd = msg.cmd;
            if (!cmd) { console.log("Error: Missing comand in telegram! - Ignoring..."); return; };

            if (this._cmdListeners[cmd]) {
                // Requested function name is registere for callback. Call it...
                this._cmdListeners[cmd](msg.cmd, msg.data, function (err, result) {
                    // reply with results...
                    var res = {};
                    res.res = msg.req;
                    res.err = err;
                    res.result = result;
                    self.msgOut(JSON.stringify(res));
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

            if (this._cmdListeners[cmd]) {
                // Requested function name is registere for callback. Call it...
                this._cmdListeners[cmd](msg.cmd, msg.data);
            }
        }
    }

    call(cmd: string, data: any, callback: (err, result) => void) {
        var msg = {};
        msg.req = this._nextReqId++;
        msg.cmd = command;
        msg.data = parameters;
        if (callback) {
            // if callback is provided, store it to be called when response is received.
            this._pendingCallbacks[msg.req] = callback;
        }
        this.msgOut(JSON.stringify(msg));
    }

    notify(cmd: string, data: any) {
        var msg = {};
        msg.cmd = cmd;
        msg.data = data;
        this.msgOut(JSON.stringify(msg));
    }
}

