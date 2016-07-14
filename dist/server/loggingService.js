//import colors from 'colors';
//import { EventEmitter } from 'events';
"use strict";
//console.log("colors:", colors);
/*
* loggingService
*/
class loggingService {
    static getLogger(name, level) {
        if (!this.loggers[name]) {
            if (!level)
                level = loggingService.defaultLevel;
            let logger = new loggerInstance(name, level);
            this.loggers[name] = logger;
            return logger;
        }
        else
            return this.loggers[name];
    }
    static logInput(logger, level, ...args) {
        // Filter on loggerInstance level...
        if (level >= logger.level) {
            this.logWriters.forEach(writer => {
                writer.handleLogInput(logger, loggingService.levelToString(level), ...args);
            });
            if (loggingService.listeners[logger.name]) {
                loggingService.listeners[logger.name].forEach(callback => {
                    callback(logger, loggingService.levelToString(level), ...args);
                });
            }
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
    static setLevel(loggerName, level) {
        let logger = this.getLogger(loggerName, level);
        logger.setLevel(level);
    }
    static setDefaultLevel(level) {
        loggingService.defaultLevel = level;
    }
}
loggingService.loggers = [];
loggingService.logWriters = [];
loggingService.listeners = {};
loggingService.defaultLevel = "info";
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
    constructor(name, level) {
        this.name = name;
        if (level)
            this.setLevel(level);
        else
            this.setLevel(loggingService.defaultLevel);
    }
    setLevel(level) {
        if (loggingService.levels[level])
            this.level = loggingService.levels[level];
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
class logWriterBase {
    constructor(configuration = {}) {
    }
    handleLogInput(logger, level, ...args) {
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
    handleLogInput(logger, level, ...args) {
        if (this.writeTimeStamp)
            console.log(new Date(Date.now()).toISOString(), "\t", level, "\t", logger.name, "\t", ...args);
        else
            console.log(level, "\t", logger.name, "\t\t", ...args);
    }
}
exports.consoleLogWriter = consoleLogWriter;

//# sourceMappingURL=loggingService.js.map