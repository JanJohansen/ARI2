"use strict";
const loggingService_1 = require('./loggingService');
var log = loggingService_1.loggingService.getLogger("nodeExecutor");
class nodeExecutor {
    constructor() {
        this.functionBlocks = [];
        log.trace("Trace test!");
        log.info("NodeExecutor started...");
        this.loadFunctionBlocks();
    }
    loadFunctionBlocks() {
        let lib = require('./lib_misc');
        //log.info(lib);
        for (var key in lib) {
            let libClass = lib[key];
            log.info("--------");
            log.info("Function:", key);
            log.info("Display name:", libClass.displayName);
            log.info("Description:", libClass.description);
            this.functionBlocks.push({ name: key, functionClass: libClass });
        }
    }
    getFunctions() {
        return this.functionBlocks;
    }
    static connect(output, input) {
        output.addListener((data) => {
            input.value = data;
        });
    }
    disconnect(output, input) {
        output.addListener((data) => {
            input.value = data;
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = nodeExecutor;
class nodeIOBase {
    constructor(name, type, description) {
        this.listeners = [];
        this.name = name;
        this.type = type;
        this.description = description;
    }
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        this.listeners.forEach(callback => {
            callback(value);
        });
    }
    addListener(callback) {
        this.listeners.push(callback);
    }
    ;
    removeListener(callback) {
        this.listeners.splice(this.listeners.indexOf(callback), 1);
    }
    ;
}
exports.nodeIOBase = nodeIOBase;
class nodeBase {
    constructor(uid) {
        this.inputs = [];
        this.outputs = [];
        this.uid = uid;
        nodeBase.description = "";
    }
    createInput(name, type, description) {
        let input = new nodeIOBase(name, type, description);
        this.inputs.push(input);
        return input;
    }
    createOutput(name, type, description) {
        let output = new nodeIOBase(name, type, description);
        this.outputs.push(output);
        return output;
    }
}
nodeBase.displayName = "Anonymous";
nodeBase.description = "";
exports.nodeBase = nodeBase;

//# sourceMappingURL=nodeExecutor.js.map