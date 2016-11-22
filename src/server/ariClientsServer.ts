import { loggingService } from './loggingService';
var log = loggingService.getLogger("AriClientsServer");
import AriEventEmitter from './AriEventEmitter';
var ariEvent: any = AriEventEmitter.getInstance();

import AriClientServer from './ariClientServer';


export default class AriClientsServer{
    constructor(){
        ariEvent.on("client.connect", (connection)=>{
            if(!connection.ariClientServer){
                // connection doesd not have a clientserver yet, so create and attach.
                var ariCS = new AriClientServer(connection);
                connection.ariClientServer = ariCS;;
            }
        });
        ariEvent.on("client.message", (connection, message)=>{
            connection.ariClientServer.handleMessage(message);
        });
        ariEvent.on("client.disconnect", (connection)=>{
            connection.ariClientServer.handleDisconnect();
            delete connection.ariClientServer;
        });
    }
}