//import colors from 'colors';
//import { EventEmitter } from 'events';
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
//console.log("colors:", colors);
/*
* loggingService
*/
var loggingService = (function () {
    function loggingService() {
    }
    /**
     * Get a logger thing...
     */
    loggingService.getLogger = function (name, level) {
        if (!this.loggers[name]) {
            if (!level)
                level = loggingService.defaultLevel;
            var logger = new loggerInstance(name, level);
            this.loggers[name] = logger;
            return logger;
        }
        else
            return this.loggers[name];
    };
    loggingService.logInput = function (logger, level) {
        // Filter on loggerInstance level...
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        // TODO: Change to use logging level for writers instead of for loggers.!!
        if (level >= logger.level) {
            this.logWriters.forEach(function (writer) {
                writer.handleLogInput.apply(writer, [logger, loggingService.levelToString(level)].concat(args));
            });
            if (loggingService.listeners[logger.name]) {
                loggingService.listeners[logger.name].forEach(function (callback) {
                    callback.apply(void 0, [logger, loggingService.levelToString(level)].concat(args));
                });
            }
        }
    };
    loggingService.levelToString = function (level) {
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
    };
    loggingService.addWriter = function (logWriter) {
        this.logWriters.push(logWriter);
    };
    loggingService.on = function (loggerName, callback) {
        if (!loggingService.listeners[loggerName])
            loggingService.listeners[loggerName] = [];
        loggingService.listeners[loggerName].push(callback);
    };
    loggingService.setLevel = function (loggerName, level) {
        var logger = this.getLogger(loggerName, level);
        logger.setLevel(level);
    };
    loggingService.setDefaultLevel = function (level) {
        loggingService.defaultLevel = level;
    };
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
    return loggingService;
}());
exports.loggingService = loggingService;
var loggerInstance = (function () {
    function loggerInstance(name, level) {
        this.name = name;
        if (level)
            this.setLevel(level);
        else
            this.setLevel(loggingService.defaultLevel);
    }
    loggerInstance.prototype.setLevel = function (level) {
        if (loggingService.levels[level])
            this.level = loggingService.levels[level];
        // else ignore!?
    };
    loggerInstance.prototype.trace = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        loggingService.logInput.apply(loggingService, [this, loggingService.levels.trace].concat(args));
    };
    loggerInstance.prototype.debug = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        loggingService.logInput.apply(loggingService, [this, loggingService.levels.debug].concat(args));
    };
    loggerInstance.prototype.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        loggingService.logInput.apply(loggingService, [this, loggingService.levels.info].concat(args));
    };
    loggerInstance.prototype.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        loggingService.logInput.apply(loggingService, [this, loggingService.levels.warn].concat(args));
    };
    loggerInstance.prototype.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        loggingService.logInput.apply(loggingService, [this, loggingService.levels.error].concat(args));
    };
    loggerInstance.prototype.fatal = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        loggingService.logInput.apply(loggingService, [this, loggingService.levels.fatal].concat(args));
    };
    return loggerInstance;
}());
var logWriterBase = (function () {
    function logWriterBase(configuration) {
        if (configuration === void 0) { configuration = {}; }
    }
    logWriterBase.prototype.handleLogInput = function (logger, level) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        console.log("Missing overrride of logWriters handleLogInput method.!");
    };
    return logWriterBase;
}());
exports.logWriterBase = logWriterBase;
var consoleLogWriter = (function (_super) {
    __extends(consoleLogWriter, _super);
    function consoleLogWriter(configuration) {
        _super.call(this);
        this.writeTimeStamp = false;
        this.writeTimeStamp = configuration.timestamp || true;
    }
    consoleLogWriter.prototype.handleLogInput = function (logger, level) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (this.writeTimeStamp)
            console.log.apply(console, [new Date(Date.now()).toISOString(), "\t", level, "\t", logger.name, "\t"].concat(args));
        else
            console.log.apply(console, [level, "\t", logger.name, "\t\t"].concat(args));
    };
    return consoleLogWriter;
}(logWriterBase));
exports.consoleLogWriter = consoleLogWriter;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/loggingService.js.map