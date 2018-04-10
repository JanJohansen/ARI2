import { EventEmitter } from "events";

export default class JsonSeparator {

    message = "";
    brCount = 0;

    constructor() { }
    onSend(msg: Object) { throw ("Error: onSend needs to be overwritten to handle transmission of data.") };
    onReceive(msg: Object) { throw ("Error: onReceive needs to be overwritten to handle reception of data.") };
    onError(reason: string) { console.log("Error in JsonSeparator:", reason) }; // Optional overwrite.
    receive(data) {
        var data = data.toString();
        for (var i = 0; i < data.length; i++) {
            if (data[i] == '{') this.brCount++;
            else if (data[i] == '}') this.brCount--;
            if (this.brCount == 0) {
                this.message += data.substring(0, i + 1);
                data = data.slice(i + 1);
                i = -1; // Will be incremented to 0 next for loop!

                var msg;
                try {
                    msg = JSON.parse(this.message);
                } catch (e) {
                    this.onError("ERROR: Incorrectly formatted JSON in message!");
                }

                if (msg) this.onReceive(msg);
                this.message = "";
            }
        }
        if (this.brCount != 0) {
            this.message += data;    // Inbetween data chunks...
        }
    };
    send(data) {
        var json = JSON.stringify(data, JsonSeparator.no__jsonReplacer);
        this.onSend(json);
    }

    static no__jsonReplacer(key, value) {
        if (key.startsWith("__")) return undefined;
        else return value;
    }
}