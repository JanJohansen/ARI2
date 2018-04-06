import AriTcpClient from "../../../common/AriTcpClient";
import { AriObjectModel, AriEvent } from "../../../common/AriObjectModel";

var types = {
    "Flow": {
    }
};


var flow = {
    nodes: {
        nid1: {
            nid: "nid1",
            type: "MySGW.Device",
            x: 50,
            y: 10,
            ins: {
            },
            outs: {
                motion: { type: "oBoolean" },
            }
        },
        nid2: {
            nid: "nid2",
            type: "HueGW.Lamp",
            x: 300,
            y: 10,
            ins: {
                brightness: { type: "iValue" },
                colorTemp: { type: "oNumber" }
            },
            outs: {
                brightness: { type: "oValue" },
                colorTemp: { type: "oNumber" }
            },
            settings: {

            }
        },
        nid3: {
            nid: "nid3",
            type: "Graph Input",
            x: 550,
            y: 10,
            ins: {
            },
            outs: {
                "name": {}
            },
            settings: {

            }
        }
    },
    connections: [
        {
            outNode: "nid1",
            inNode: "nid2",
            outName: "motion",
            inName: "brightness"
        }
    ]
}

export default class Flow {
    constructor() {
        var client = new AriTcpClient("Flow");
        var flow = client.localModel;

        // Define own model.
        flow.addFunction("getNodeTypeInfo", (name, args) => {
            return {
                "Logic.AND": {},
                "Logic.OR": {},
                "Logic.NOT": {},
                "Timing.Ticker": {},
                "Timing.Delay": {},
                "Timing.RateLimit": {},
                "System.Execute": {},
                "System.Beep": {},
                "Messaging.Email": {},
                "Messaging.PushBullet": {},
                "Math.Add": {},
                "Math.Subtract": {},
                "Math.Divide": {},
                "Math.Multiply": {},
                "Math.Map": {}
            };
        });

        flow.addFunction("getGraph", (name, args) => {

        });

        flow.addFunction("addConnection", (name, args) => {

        });
        flow.addFunction("addNode", (name, args) => {

        });

        var counter = flow.addOutput("flowCounter", 0);
        setInterval(() => {
            counter.value++;
        }, 5000);
    }
}

//*****************************************************************************
// Model basis:

// Idea: Default define settings as inputs.
// If input is set in "settings screen/object" don't show it as an input, but use provided default!?

class NodeBase {
    static nextInstganceId = 0;
    instanceId: number;
    parent: NodeBase;
    name: string = "";
    x?: number = 0;
    y?: number = 0;
    listeners?: { [name: string]: Set<(name: string, eventData: any) => void> };
    ins: InsBase | any = new InsBase();
    outs: OutsBase | any = new OutsBase();
    children;

    static registerFunctionBlock(name: string, className: NodeBase) {

    }
    static createInstance(name: string) {
    }

    constructor(parent: NodeBase, functionName: string, settings: any) {
        this.instanceId = NodeBase.nextInstganceId++;
        this.parent = parent;
        this.name = functionName;

        // Copy propoerties in settings object to properties in ins...
        settings.forEach(prop => {
            this.ins[prop] = settings[prop];
        });
    }
    // Called after initial creation of the object instance. this.ins.xxx is set before this is called if "settings" have been applied.
    setup() {
        throw (`Error: "setup" function not defined in function "${this.name}"!`);
    }
    getInfo(): any {
        return { description: "No specific description available!" };
    }
    dispatchEvent(name: string, eventData: any) {
        if (this.listeners && this.listeners[name]) this.listeners[name].forEach((cb) => { cb(name, eventData) });
        if (this.parent) this.parent.dispatchEvent(name, eventData);
    }
    on(name, cb: (name, eventData) => void) {
        if (!this.listeners) this.listeners = {};
        if (this.listeners[name]) this.listeners[name] = new Set();
        this.listeners[name].add(cb);
    }
}
class InsBase {
    __values = {};
    add(name: string, value: any, onSet: (name, value) => void) {
        this.__values[name] = value;
        Object.defineProperty(this, name, {
            get: function () {
                return this.__values[name];
            },
            set: function (value) {
                this.__values[name] = value;
                if (this.__parent.onSet) this.__parent.onSet(name, value);
            }
        });
    }
}
class OutsBase {
    __values = {};
    add(name: string, value?: any) {
        if (value) this.__values[name] = value;
        Object.defineProperty(this, name, {
            get: function () {
                return this.__values[name];
            },
            set: function (value) {
                this.__values[name] = value;
                this.__parent.dispatchEvent("out", { target: this, name: name, value: value });
            }
        });
    }
}

class MyFunc extends NodeBase {
    constructor(parent: NodeBase, settings: any) {
        super(parent, "MyFunc", settings);
        this.outs.add("o1");
        this.ins.add("i1", this.recalc);
    }
    recalc(name, value) {
        this.outs.o1 = this.ins.i1;
    }
}

// define->ins called with values from settings or with default value->setup->run?
class Ticker extends NodeBase {
    __timer;
    define() {
        this.outs.add("o1");
        this.ins.add("interval", 1000, (value) => {
            if(this.__timer) this.__timer.stop();
            this.__timer = setTimeout(() => {
                this.outs.o1.value++;
            }, this.ins.interval.value);
        });
    }
    setup() {
        // No setup for this function.
    }
    getInfo() {
        return {
            TickerType: {
                description: "Function that sends an increasing counter with a configurable interval.",
                outs: {
                    o1: {
                        type: "oType",
                        description: "Counter increasing every <settings.interval> milli seconds."
                    }
                },
                ins: {
                    interval: {
                        type: "number",
                        description: "The interval between output incrementations in milli seconds."
                    }
                }
            }
        };
    }
}
