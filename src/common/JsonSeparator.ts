import { EventEmitter } from "events";

export default class JsonSeparator extends EventEmitter {

    message = "";
    bCount = 0;
    msg = undefined;
    brCount = 0;

    constructor(){
        super();
    }

    dataIn(data) {
        var data = data.toString();
        for (var i = 0; i < data.length; i++) {
            if (data[i] == '{') this.brCount++;
            else if (data[i] == '}') this.brCount--;
            if (this.brCount == 0) {
                this.message += data.substring(0, i+1);
                data = data.slice(i + 1);
                i = -1; // Will be incremented to 0 next for loop!

/*                try {
                    this.msg = JSON.parse(this.message);
                } catch (e) {
                    console.log("ERROR: Incorrectly formatted JSON in message!");
                }
                
                if (this.msg) {
                    console.log("Message:", this.message.toString());
                    */
                    this.emit("jsonOut", this.message);
                //}
                this.message = "";
                this.msg = undefined;
            }
        }
        if (this.brCount != 0) {
            this.message += data;    // Inbetween data chunks...
        }
    };

    jsonIn(json) {
        this.emit("dataOut", json);
    };
}