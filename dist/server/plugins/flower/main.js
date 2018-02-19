"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AriService_1 = require("../../AriService");
//let AriPluginBase = require("../../AriPluginBase").AriPluginBase;
class AriPlugin extends AriService_1.default {
    constructor() {
        super("Flower");
        this.log.info("!! AriPlugin started.");
    }
}
exports.default = AriPlugin;
/*

class AriIn {
    _value: any;
    _name: string;
    _type: string;

    constructor(name: string, defaultValue: any, type: AriValueType) {
        this._name = name;
        this._value = defaultValue;
        this._type = type;
    }

    get value(): any {
        return this._value;
    }
    set value(value: any) {
        this._value = value;
    }
}

class AriOut {
    _value: any;
    _name: string;
    _type: string;

    constructor(name: string, defaultValue: any, type: AriValueType) {
        this._name = name;
        this._value = defaultValue;
        this._type = type;
    }
    get value(): any {
        return this._value;
    }
    set value(value: any) {
        this._value = value;
    }
}

class AriFunc {
    name: string;
    group: string;
    instanceName: string;
    ins: AriIn[];
    outs: AriOut[];
    init() { };
    execute() { };
}

class Logic_AND extends AriFunc {
    init() {
        this.name = "AND";
        this.group = "Logic"
        this.ins[0] = new AriIn("In1Name", "defaultValue", type = "bool");
        this.ins[1] = new AriIn("In2Name", "defaultValue", type = "bool");
        this.outs[0] = new AriOut("In2Name", "defaultValue", type = "bool");
    }

    execute() {
        this.outs[0].value = this.ins[0].value && this.ins[1].value;
    }
}

*/ 
//# sourceMappingURL=C:/Users/jan/Desktop/ARI2/dist/server/plugins/flower/main.js.map