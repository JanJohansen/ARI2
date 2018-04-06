import AriClientServer from './ariClientServer';
import { AriEvent } from '../common/AriObjectModel';

export default class AriServerServer{
    ariRoot = AriClientServer.ariRoot;
    timeNode;

    constructor(){
        var bootTime = this.ariRoot.findOrCreate("outs.bootTime");
        bootTime.emit(new AriEvent("out", {value: new Date().toISOString()}));
    }

    // Server provided values. ****************************************************
    provideValues() {
        // Boot time of server.
        var bootTime = this.ariRoot.findOrCreate("outs.bootTime");
        bootTime.emit(new AriEvent("out", {value: new Date().toISOString()}));

        this.timeNode = this.ariRoot.findOrCreate("outs.time");
        this.provideTime(0); // Starts providing time.
    }

    // Provide time when milliseconds == 0,
    provideTime(interval) {
        var self = this;
        setTimeout(function () {
            var date = new Date();
            var ms = date.getMilliseconds();
            /*if(ms > 500) self.provideTime(2000 - ms);
            else self.provideTime(1000 - ms);*/
            self.provideTime(1000 - ms);
            
            // This function might run two times if ms ~999, so only report time when ms<500.
            if (ms < 500) {
                //date.setMilliseconds(0);    // Just show 000 since we should be very close and not drifting!
                this.timeNode.emit(new AriEvent("out", {value: date.toISOString()}));
            }

        }, interval);
    }

    //*************************************************************************
    // Function calls on Server!
    _webcall_getClients(args, callback){
        callback(null, this.ari.clients);
    }
}