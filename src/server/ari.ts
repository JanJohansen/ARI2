import { loggingService } from './loggingService';
var log = loggingService.getLogger("ARI");

export default class Ari{
    root: any = {clients: {}};
    constructor(){

    }

    setClientInfo(clientName: string, clientInfo: any){
        this.root.clients[clientName].clientInfo = clientInfo;
        log.debug("New clientInfo from", clientName, ":", JSON.stringify(clientInfo, null, "\t"));
        // Merge client info with present info... Remove values, functions, etc. not in Info from client.
        /*
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
        */
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
    
    clientConnected(clientName){
        if(!this.root.clients[clientName]){
            this.root.clients[clientName] = {pendingAuthentication: true};
        } else this.root.clients[clientName].connected = true;
    }
    
    clientDisconnected(clientName){
        this.root.clients[clientName].connected = false;
    }
} 