

export class loggingService {
    static loggers: loggerInstance[] = [];
    static logWriters: logWriterBase[] = [];
    static listeners: Object = {};
    static defaultLevel = 300;


    static getLogger(name: string): loggerInstance {
        if(!this.loggers[name]){
            let logger = new loggerInstance(name);
            this.loggers[name] = logger; 
            return logger;
        } else return this.loggers[name];
    }

    static logInput(loggerName: string, level: number,  ...args){
        this.logWriters.forEach(writer => {
            writer.handleLogInput(loggerName, level, ...args);
        });
        if(loggingService.listeners[loggerName]){
            loggingService.listeners[loggerName].forEach(callback => {
                callback(loggerName, loggingService.levelToString(level), ...args);
            });
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

    static setDefaultLevel(level: string) {
        loggingService.defaultLevel = loggingService.levels[level];
    }
}

export class loggerInstance {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
   
    trace(...args) {
        loggingService.logInput(this.name, loggingService.levels.trace, ...args);
    }
    debug(...args) {
        loggingService.logInput(this.name, loggingService.levels.debug, ...args);
    }
    info(...args) {
        loggingService.logInput(this.name, loggingService.levels.info, ...args);
    }
    warn(...args) {
        loggingService.logInput(this.name, loggingService.levels.warn, ...args);
    }
    error(...args) {
        loggingService.logInput(this.name, loggingService.levels.error, ...args);
    }
    fatal(...args) {
        loggingService.logInput(this.name, loggingService.levels.fatal, ...args);
    }
}

export class logWriterBase {
    config: any;
    levels = {};    // log level for each incoming loggerinstance.

    constructor(config: Object = {}){
        this.config = config;
    }

    handleLogInput(loggerName: string, level: number, ...args){
        // Filter log accordint to config.
        var minLevel = this.levels[loggerName] || loggingService.defaultLevel;
        if(level >= minLevel) this.writeLog(loggerName, loggingService.levelToString(level), ...args);
    }

    writeLog(loggerName: string, level: string, ...args){
        console.log("Missing overrride of logWriters handleLogInput method.!");
    }
}

export class consoleLogWriter extends logWriterBase {
    writeTimeStamp: boolean = false;
    
    constructor(configuration: Object | any){
        super();
        this.writeTimeStamp = configuration.timestamp || true;
    }

    writeLog(loggerName, level: string, ...args){
        if(this.writeTimeStamp) {
            var a = args.join(' ');
            console.log(new Date(Date.now()).toISOString(), "\t", level, "\t", loggerName, "\t", a);
        }
        else {
            console.log(level, "\t", loggerName, "\t\t", ...args);
        }
    }
}