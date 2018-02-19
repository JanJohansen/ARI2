import { loggingService, loggerInstance } from './loggingService';

export default class AriService {
    
    log: loggerInstance;

    pluginInfo = {
        instanceName: "AriService"
    };
    
    constructor (instanceName: string){
        this.log = loggingService.getLogger(instanceName);
        this.pluginInfo.instanceName = instanceName;
    };
}
