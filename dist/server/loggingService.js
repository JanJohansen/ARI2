"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class loggingService {
    static getLogger(name) {
        if (!this.loggers[name]) {
            let logger = new loggerInstance(name);
            this.loggers[name] = logger;
            return logger;
        }
        else
            return this.loggers[name];
    }
    static logInput(loggerName, level, ...args) {
        this.logWriters.forEach(writer => {
            writer.handleLogInput(loggerName, level, ...args);
        });
        if (loggingService.listeners[loggerName]) {
            loggingService.listeners[loggerName].forEach(callback => {
                callback(loggerName, loggingService.levelToString(level), ...args);
            });
        }
    }
    static levelToString(level) {
        if (level <= loggingService.levels.trace)
            return "trace";
        else if (level <= loggingService.levels.debug)
            return "debug";
        else if (level <= loggingService.levels.info)
            return "info";
        else if (level <= loggingService.levels.warn)
            return "warn";
        else if (level <= loggingService.levels.error)
            return "error";
        else if (level <= loggingService.levels.fatal)
            return "fatal";
    }
    static addWriter(logWriter) {
        this.logWriters.push(logWriter);
    }
    static on(loggerName, callback) {
        if (!loggingService.listeners[loggerName])
            loggingService.listeners[loggerName] = [];
        loggingService.listeners[loggerName].push(callback);
    }
    static setDefaultLevel(level) {
        loggingService.defaultLevel = loggingService.levels[level];
    }
}
loggingService.loggers = [];
loggingService.logWriters = [];
loggingService.listeners = {};
loggingService.defaultLevel = 300;
loggingService.levels = {
    trace: 100,
    debug: 200,
    info: 300,
    warn: 400,
    error: 500,
    fatal: 600
};
exports.loggingService = loggingService;
class loggerInstance {
    constructor(name) {
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
exports.loggerInstance = loggerInstance;
class logWriterBase {
    constructor(config = {}) {
        this.levels = {}; // log level for each incoming loggerinstance.
        this.config = config;
    }
    handleLogInput(loggerName, level, ...args) {
        // Filter log accordint to config.
        var minLevel = this.levels[loggerName] || loggingService.defaultLevel;
        if (level >= minLevel)
            this.writeLog(loggerName, loggingService.levelToString(level), ...args);
    }
    writeLog(loggerName, level, ...args) {
        console.log("Missing overrride of logWriters handleLogInput method.!");
    }
}
exports.logWriterBase = logWriterBase;
class consoleLogWriter extends logWriterBase {
    constructor(configuration) {
        super();
        this.writeTimeStamp = false;
        this.writeTimeStamp = configuration.timestamp || true;
    }
    writeLog(loggerName, level, ...args) {
        if (this.writeTimeStamp) {
            var a = args.join(' ');
            console.log(new Date(Date.now()).toISOString(), "\t", level, "\t", loggerName, "\t", a);
        }
        else {
            console.log(level, "\t", loggerName, "\t\t", ...args);
        }
    }
}
exports.consoleLogWriter = consoleLogWriter;
//# sourceMappingURL=C:/Users/jan/Desktop/ARI2/dist/server/loggingService.js.map