//import colors from 'colors';
//import { EventEmitter } from 'events';

//console.log("colors:", colors);

 /*
 * loggingService
 */
export class loggingService {
    static loggers: loggerInstance[] = [];
    static logWriters: logWriterBase[] = [];
    static listeners: Object = {};
    static defaultLevel = "info";

    static getLogger(name: string, level?: string): loggerInstance {
        if(!this.loggers[name]){
            if(!level) level = loggingService.defaultLevel;
            let logger = new loggerInstance(name, level);
            this.loggers[name] = logger; 
            return logger;
        } else return this.loggers[name];
    }

    static logInput(logger: loggerInstance, level: number,  ...args){
        // Filter on loggerInstance level...
        if(level >= logger.level) {
            this.logWriters.forEach(writer => {
                writer.handleLogInput(logger, loggingService.levelToString(level), ...args);
            });
            if(loggingService.listeners[logger.name]){
                loggingService.listeners[logger.name].forEach(callback => {
                    callback(logger, loggingService.levelToString(level), ...args);
                });
            }
            //console.log(loggingService.levelToString(level), "\t", logger.name, "\t", ...args);
        }
    }

    static levelToString(level: number){
        if(level <= loggingService.levels.trace) return "trace";
        else if(level <= loggingService.levels.debug) return "debug";
        else if(level <= loggingService.levels.info) return "info";
        else if(level <= loggingService.levels.warn) return "warn";
        else if(level <= loggingService.levels.error) return "error";
        else if(level <= loggingService.levels.fatal) return "fatal";  
    }

    static levels = {
        trace: 100,
        debug: 200,
        info: 300, 
        warn: 400,
        error: 500,
        fatal: 600
    };

    static addWriter(logWriter: logWriterBase){
        this.logWriters.push(logWriter);
    }

    static on(loggerName: string, callback: (logger: loggerInstance, level: string, ...args: any[]) => void) {
        if(!loggingService.listeners[loggerName]) loggingService.listeners[loggerName] = [];
        loggingService.listeners[loggerName].push(callback);
    }

    static setLevel(loggerName: string, level: string) {
        let logger = this.getLogger(loggerName, level);
        logger.setLevel(level);
    }

    static setDefaultLevel(level: string) {
        loggingService.defaultLevel = level;
    }
}

class loggerInstance {
    name: string;
    level: number;
    constructor(name: string, level?: string) {
        this.name = name;
        if(level) this.setLevel(level);
        else this.setLevel(loggingService.defaultLevel);
    }

    setLevel(level: string) {
        if(loggingService.levels[level]) this.level = loggingService.levels[level];
        // else ignore!?
    }
    
    trace(...args) {
        loggingService.logInput(this, loggingService.levels.trace, ...args);
    }
    debug(...args) {
        loggingService.logInput(this, loggingService.levels.debug, ...args);
    }
    info(...args) {
        loggingService.logInput(this, loggingService.levels.info, ...args);
    }
    warn(...args) {
        loggingService.logInput(this, loggingService.levels.warn, ...args);
    }
    error(...args) {
        loggingService.logInput(this, loggingService.levels.error, ...args);
    }
    fatal(...args) {
        loggingService.logInput(this, loggingService.levels.fatal, ...args);
    }
}

export class logWriterBase {
    constructor(configuration: Object = {}){}
    handleLogInput(logger: loggerInstance, level: string, ...args){
        console.log("Missing overrride of logWriters handleLogInput method.!");
    }
}

export class consoleLogWriter extends logWriterBase {
    writeTimeStamp: boolean = false;
    
    constructor(configuration: Object | any){
        super();
        this.writeTimeStamp = configuration.timestamp || true;
    }

    handleLogInput(logger, level: string, ...args){
        if(this.writeTimeStamp) console.log(new Date(Date.now()).toISOString(), "\t", level, "\t", logger.name, "\t", ...args);
        else console.log(level, "\t", logger.name, "\t\t", ...args);
    }
}