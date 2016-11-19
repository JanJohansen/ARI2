"use strict";
var loggingService_1 = require('./loggingService');
var log = loggingService_1.loggingService.getLogger("nodeExecutor");
var nodeExecutor = (function () {
    function nodeExecutor() {
        this.functionBlocks = [];
        log.trace("Trace test!");
        log.info("NodeExecutor started...");
        this.loadFunctionBlocks();
    }
    nodeExecutor.prototype.loadFunctionBlocks = function () {
        var lib = require('./lib_misc');
        //log.info(lib);
        for (var key in lib) {
            var libClass = lib[key];
            log.info("--------");
            log.info("Function:", key);
            log.info("Display name:", libClass.displayName);
            log.info("Description:", libClass.description);
            this.functionBlocks.push({ name: key, functionClass: libClass });
        }
    };
    nodeExecutor.prototype.getFunctions = function () {
        return this.functionBlocks;
    };
    nodeExecutor.connect = function (output, input) {
        output.addListener(function (data) {
            input.value = data;
        });
    };
    nodeExecutor.prototype.disconnect = function (output, input) {
        output.addListener(function (data) {
            input.value = data;
        });
    };
    return nodeExecutor;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = nodeExecutor;
var nodeIOBase = (function () {
    function nodeIOBase(name, type, description) {
        this.listeners = [];
        this.name = name;
        this.type = type;
        this.description = description;
    }
    Object.defineProperty(nodeIOBase.prototype, "value", {
        get: function () {
            return this._value;
        },
        set: function (value) {
            this._value = value;
            this.listeners.forEach(function (callback) {
                callback(value);
            });
        },
        enumerable: true,
        configurable: true
    });
    nodeIOBase.prototype.addListener = function (callback) {
        this.listeners.push(callback);
    };
    ;
    nodeIOBase.prototype.removeListener = function (callback) {
        this.listeners.splice(this.listeners.indexOf(callback), 1);
    };
    ;
    return nodeIOBase;
}());
exports.nodeIOBase = nodeIOBase;
var nodeBase = (function () {
    function nodeBase(uid) {
        this.inputs = [];
        this.outputs = [];
        this.uid = uid;
        nodeBase.description = "";
    }
    nodeBase.prototype.createInput = function (name, type, description) {
        var input = new nodeIOBase(name, type, description);
        this.inputs.push(input);
        return input;
    };
    nodeBase.prototype.createOutput = function (name, type, description) {
        var output = new nodeIOBase(name, type, description);
        this.outputs.push(output);
        return output;
    };
    nodeBase.displayName = "Anonymous";
    nodeBase.description = "";
    return nodeBase;
}());
exports.nodeBase = nodeBase;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/nodeExecutor.js.map