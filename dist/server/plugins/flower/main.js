"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events_1 = require("events");
var AriGraph = (function () {
    function AriGraph() {
        this.components = [];
    }
    // Component handling
    AriGraph.prototype.getNextFreeComponentId = function (component) {
        var i = 1;
        var id = component.id;
        while (this.components[id]) {
            // Component id already exists, so we need to find a new unique one. (This should only happen if no special name was already given - eg. for new components.)
            id = component.metadata.name + "(" + i + ")";
            i++;
        }
        return id;
    };
    AriGraph.prototype.addComponent = function (component) {
        var cid = this.getNextFreeComponentId(component);
        component.id = cid; // Upådate component id if changed.
        this.components[cid] = component;
        component._graph = this;
    };
    AriGraph.prototype.getComponent = function (componentName) {
        return this.components[componentName];
    };
    AriGraph.prototype.renameComponent = function () {
    };
    AriGraph.prototype.removeComponent = function () {
    };
    // Connections handling
    AriGraph.prototype.connect = function (sCompName, sOutputName, dCompName, dInputName) {
        var sc = this.getComponent(sCompName);
        var dc = this.getComponent(dCompName);
        if (sc && dc) {
            sc.outs[sOutputName].connect(dc.ins[dInputName]);
        }
        else
            throw ("Components for connection not found!");
    };
    AriGraph.prototype.disconnect = function (sCompName, sOutputName, dCompName, dInputName) {
        var sc = this.getComponent(sCompName);
        var dc = this.getComponent(dCompName);
        if (sc && dc) {
            sc.outs[sOutputName].disconnect(dc.ins[dInputName]);
        }
        else
            throw ("Components for connection not found!");
    };
    return AriGraph;
}());
var AriConnection = (function (_super) {
    __extends(AriConnection, _super);
    function AriConnection() {
        _super.call(this);
        // Enable interception of all events
        var oldEmit = this.emit;
        this.emit = function () {
            var event = arguments[0];
            return oldEmit.apply(this, arguments);
        };
    }
    return AriConnection;
}(events_1.EventEmitter));
var AriComponent = (function () {
    function AriComponent(id) {
        this.metadata = {};
        this.ins = [];
        this.outs = [];
        this.id = id;
        this.metadata.name = "Unnamed";
    }
    AriComponent.prototype.addInput = function (metadata, dataCallback, eventCallback) {
        if (dataCallback === void 0) { dataCallback = undefined; }
        if (eventCallback === void 0) { eventCallback = undefined; }
        var input = new AriInput(this, metadata, dataCallback, eventCallback);
        this.ins[metadata.name] = input;
        return input;
    };
    AriComponent.prototype.addOutput = function (metadata) {
        var output = new AriOutput(this, metadata);
        this.outs[metadata.name] = output;
        return output;
    };
    return AriComponent;
}());
var AriOutput = (function () {
    function AriOutput(ariComponent, metadata) {
        this._listeners = [];
        this.component = ariComponent;
        metadata = metadata; // TODO: clone! not reference!
    }
    AriOutput.prototype.connect = function (input) {
        this._listeners.push(input);
        input._handleEvent("connect", this);
        if (this.cacheLastData && this._lastData != undefined)
            input._handleEvent("data", this._lastData);
    };
    AriOutput.prototype.disconnect = function (input) {
        this._listeners.splice(this._listeners.indexOf(input), 1);
        input._handleEvent("disconnect", this);
    };
    AriOutput.prototype.send = function (data) {
        for (var i = 0, l = this._listeners.length; i < l; i++) {
            this._listeners[i]._handleEvent("data", this);
        }
        if (this.cacheLastData)
            this._lastData = data;
    };
    return AriOutput;
}());
var AriInput = (function () {
    function AriInput(ariComponent, metadata, dataCallback, eventCallback) {
        if (dataCallback === void 0) { dataCallback = null; }
        if (eventCallback === void 0) { eventCallback = null; }
        this.component = ariComponent;
        this.metadata = metadata; // TODO: clone! not reference!
        this.onData = dataCallback;
        if (eventCallback)
            this.onEvent = eventCallback;
    }
    AriInput.prototype._handleEvent = function (event, data) {
        if (this.onData && event == "data")
            this.onData(data);
        else if (this.onEvent)
            this.onEvent(event, data);
    };
    return AriInput;
}());
var IID = (function (_super) {
    __extends(IID, _super);
    function IID(id) {
        var _this = this;
        _super.call(this, id ? id : "IID");
        this.out1 = this.addOutput({});
        this.out1.cacheLastData = true; // Send last data to newly connected inputs.
        this.metadata["set value"] = function (v) {
            _this._value = v;
            _this.out1.send(_this._value);
        };
        this.metadata["set value"] = function () {
            return _this._value;
        };
    }
    return IID;
}(AriComponent));
exports.IID = IID;
var Graph = (function (_super) {
    __extends(Graph, _super);
    function Graph(id) {
        _super.call(this, id ? id : "IID");
        this.metadata.value = "42";
        this.out1 = this.addOutput({});
        this.out1.cacheLastData = true; // Send last data to newly connected inputs.
    }
    return Graph;
}(AriComponent));
exports.Graph = Graph;
// Definition of user component.
var NOP = (function (_super) {
    __extends(NOP, _super);
    function NOP(id) {
        var _this = this;
        _super.call(this, id ? id : "NOP");
        this.metadata.name = "NOP";
        this.metadata.description = "Component description.";
        this.out1 = this.addOutput({ name: "out1", description: "Output 1.", type: "any" });
        this.out1.cacheLastData = true; // Send last data to newly connected inputs.
        // Normal declaration of input.
        this.addInput({ name: "in1", description: "Input 1.", type: "any" }, function (data) {
            _this.outs.out1.send(data);
        });
        // Compact declaration of input with both data and event handler.
        this.addInput({ name: "in2", description: "Input 2.", type: "any" }, this.handleData, this.handleEvent);
        // Alternate definition of input.
        var in2 = this.addInput({ name: "in2", description: "Input 2.", type: "any" });
        in2.onData = function (data) {
            // Do stuff...
        };
        in2.onEvent = function (event, data) {
            // Do stuff...
        };
    }
    NOP.prototype.handleData = function (data) { this.out1.send(data); };
    ;
    NOP.prototype.handleEvent = function (event, data) { console.log("Event from "); };
    ;
    return NOP;
}(AriComponent));
exports.NOP = NOP;
// Fast...
/*
let ca = new NOP();
let cb = new NOP();
ca.outs["out1"].connect(cb.ins["in1"]);
*/
// Using the pot! (graph!)
var g = new AriGraph();
console.log("Graph:", g);
g.addComponent(new NOP());
console.log("Graph:", g);
g.addComponent(new NOP());
g.connect("NOP", "out1", "NOP(1)", "in1");
console.log("Graph:", g);
//console.log("Graph:", JSON.stringify(g, null, "\t"));
console.log("out1:", g.getComponent("NOP"));
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/plugins/flower/main.js.map