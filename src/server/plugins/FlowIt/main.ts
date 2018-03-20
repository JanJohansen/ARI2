import AriTcpClient from "../../../common/AriTcpClient";

import * as Ari from "../../../common/AriObjectModel";

export default class FlowIt extends Ari.AriObjectModel {
    static type = {
        description: "Flow based programming plugin for ARI2.",
        ins: {
            in1: { description: "Input 1!" }
        },
        outs: {
            out1: { description: "Output 2!" }
        }
    };
    constructor() {
        super(null, "FlowIt");
        console.log("FlowIt started.");
        this.addOutput("out1");
        this.addInput("in1", (value) => {
            this.outs.out1.value = value;
            this.dispatchEvent(new Ari.AriEvent("flowIt.blinkOutput", { value: value }));
        });
    }
}

var flowit = new FlowIt();
for (let prop in flowit.constructor) {
    console.log("static", prop, flowit.constructor[prop]);
}

console.log("END!");



/*
export default class FlowIt extends AriTcpClient {
    constructor() {
        super({ name: "FlowIt", attributes: { description: "Flow based programming for ARI 2.0." } });
        console.log("FlowIt started.");
    }
}

class Input<T>{
    private static nextInstanceId = 1;
    instanceId: number;
    cb: (value: T) => void;
    set(value: T) {

    }
    onSet(cb: (value: T) => void) {
        this.cb = cb;
    }
}
class Output<T>{
    private static nextInstanceId = 1;
    instanceId: number;
    private cbs = new Set();
    private _parent;
    private _name;

    constructor(parent, name: string, attributes = null) {
        this._parent = parent;
        this._name = name;
    }
    onSet(cb: (v: T) => void) {
        this.cbs.add(cb);
    }
    set(value: T) {
        this.cbs.forEach(cb => { cb(value); });
    }
    get name() {
        return this._name;
    }
    connectTo(inp: Input<T>) {
        this.cbs.add(inp.set);
    }
}
class FunctionBlockBase {
    private static nextInstanceId = 1;
    public static typeName = null;
    protected instanceId: number;
    ins: any = {};
    outs: any = {};
    constructor(typeName: string) {
        this.instanceId = FunctionBlockBase.nextInstanceId++;
    }
    AddInput() {

    }
}

class Connection<T>{
    private f1: FunctionBlockBase;
    private o: Output<T>;
    private f2: FunctionBlockBase;
    private i: Input<T>;
    constructor(o: Output<T>, i: Input<T>) {
        this.f1 = f1;
        this.o = o;
        this.f2 = f2;
        this.i = i;
    }
}

class AriNodeBase {
    private static instiationCount = 1;
    name: string;
    _parent: AriNodeBase = null;
    typeName: string;

    constructor(name: string = null) {
        this.typeName = this.constructor.name;
        this.name = name || this.typeName + "(" + AriNodeBase.instiationCount++ + ")";
    }
}

class Graph extends AriNodeBase {
    static textDescription = "Graps is the base for a FlowIt blah blah";
    constructor(name: string = null) {
        super(name);

    }
    static getAttributes() {
        return {description: "Graps is the base for a FDlowIt blah blah!"};
    }
    addNode(type: string) {

    }
}

//-----------------------------------------------------------------------------
class MyFunc extends FunctionBlockBase {
    public static typeName = "MyFunc";
    constructor() {
        super("MyFunc");
        this.ins.in1 = new Input<string>();
        this.outs.out1 = new Output<string>(this, "outName");

        this.ins.in1.onSet((value) => {
            this.outs.out1.set(value);
        });
    }
}

class AriExecutionContainer {
    graphs
    nodes;
    connections;
    constructor() {
    }
}

var f1 = new MyFunc();
var f2 = new MyFunc();
//f1.out1.connectTo(f2.in1);
var c = new Connection(f1.out1, f2.in1);

var g = new Graph();
console.log("Graph type:", g.typeName);
console.log("Graph:", JSON.stringify(g));


var gt = typeof(g);
var gpt = Object.getPrototypeOf(g);
console.log("Graph type:", gpt.constructor.textDescription);
console.log("Graph type2:", Graph);
console.log("Graph descr:", Graph.description);

for(let prop in g.constructor){
    console.log("static", prop, gt.constructor[prop]);
}

for (let i in Object.getPrototypeOf(g).prototype) {
    // This condition makes sure you only test real members of the object.
    if (Object.prototype.hasOwnProperty.call(Object.getPrototypeOf(g).prototype, i)) {
        console.log(i, ':', Object.getPrototypeOf(g).prototype[i]);
    }
}

*/

/**
 Idea:
 EventEmitter(2)f for everything?

 InstanceName.
 Path defines flow structure

 Main.Ligths.HueLampInstance(1).brightness.out = 0.5

Main                    Object:AriObject
    Lights              AriObject
        Lamp1           AriGraphNode <- HueGW:Lamp
            brightness  AriOutput
        MySInput(123)   MySGW.Input
            motion      AriInput


MainGraph = {
    type: "Graph",
    name: "Main",
    nodes: [
        {
            type: "Graph",
            name: "Lights",
            nodes: [
                {
                    type: "HueGW:Lamp",
                    name: "Lamp",
                    config: {source: "Livingroom.Floorlamp"}
                },
                {
                    type: "MySGW:Sensor",
                    name: "Sensor",
                    config: {source: "Livingroom.DoorPir"}
                }
            ]
        }
    },
    connections:[
        {
            out: "Main.Lights.Sensor.motion"
            in: "Main.Lights.Lamp.brightness"
        }
    ]
}


Main.Lights.Lamp



Main.Lights.Lamp1.brightness = 0.5


 */