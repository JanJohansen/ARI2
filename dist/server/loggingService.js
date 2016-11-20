"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var loggingService = (function () {
    function loggingService() {
    }
    loggingService.getLogger = function (name) {
        if (!this.loggers[name]) {
            var logger = new loggerInstance(name);
            this.loggers[name] = logger;
            return logger;
        }
        else
            return this.loggers[name];
    };
    loggingService.logInput = function (loggerName, level) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        this.logWriters.forEach(function (writer) {
            writer.handleLogInput.apply(writer, [loggerName, level].concat(args));
        });
        if (loggingService.listeners[loggerName]) {
            loggingService.listeners[loggerName].forEach(function (callback) {
                callback.apply(void 0, [loggerName, loggingService.levelToString(level)].concat(args));
            });
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
    loggingService.setDefaultLevel = function (level) {
        loggingService.defaultLevel = loggingService.levels[level];
    };
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
    return loggingService;
}());
exports.loggingService = loggingService;
var loggerInstance = (function () {
    function loggerInstance(name) {
        this.name = name;
    }
    loggerInstance.prototype.trace = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        loggingService.logInput.apply(loggingService, [this.name, loggingService.levels.trace].concat(args));
    };
    loggerInstance.prototype.debug = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        loggingService.logInput.apply(loggingService, [this.name, loggingService.levels.debug].concat(args));
    };
    loggerInstance.prototype.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        loggingService.logInput.apply(loggingService, [this.name, loggingService.levels.info].concat(args));
    };
    loggerInstance.prototype.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        loggingService.logInput.apply(loggingService, [this.name, loggingService.levels.warn].concat(args));
    };
    loggerInstance.prototype.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        loggingService.logInput.apply(loggingService, [this.name, loggingService.levels.error].concat(args));
    };
    loggerInstance.prototype.fatal = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i - 0] = arguments[_i];
        }
        loggingService.logInput.apply(loggingService, [this.name, loggingService.levels.fatal].concat(args));
    };
    return loggerInstance;
}());
var logWriterBase = (function () {
    function logWriterBase(config) {
        if (config === void 0) { config = {}; }
        this.levels = {}; // log level for each incoming loggerinstance.
        this.config = config;
    }
    logWriterBase.prototype.handleLogInput = function (loggerName, level) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        // Filter log accordint to config.
        var minLevel = this.levels[loggerName] || loggingService.defaultLevel;
        if (level >= minLevel)
            this.writeLog(loggerName, loggingService.levelToString(level), args);
    };
    logWriterBase.prototype.writeLog = function (loggerName, level) {
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
    consoleLogWriter.prototype.writeLog = function (loggerName, level) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        if (this.writeTimeStamp) {
            var a = args.join(' '); // TODO: FIX since this doesnt work!!!
            console.log(new Date(Date.now()).toISOString(), "\t", level, "\t", loggerName, "\t", a);
        }
        else {
            console.log.apply(console, [level, "\t", loggerName, "\t\t"].concat(args));
        }
    };
    return consoleLogWriter;
}(logWriterBase));
exports.consoleLogWriter = consoleLogWriter;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/loggingService.js.map