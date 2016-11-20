//import { EventEmitter} from "events";

export class Graph {
    components: AriComponent[] = [];

    constructor(){
	}
	
	// Component handling
    getNextFreeComponentId(component: AriComponent){
        let i = 1;
        let id = component.id;
        while(this.components[id]){
            // Component id already exists, so we need to find a new unique one. (This should only happen if no special name was already given - eg. for new components.)
            id = component.metadata.name + "(" + i + ")";
            i++;
        }
        return id;
    }

	addComponent(component: AriComponent){
        let cid = this.getNextFreeComponentId(component);
        component.id = cid; // Upådate component id if changed.
		this.components[cid] = component;
        component._graph = this;
	}
	
	getComponent(componentName){
		return this.components[componentName];
	}
	
	renameComponent(){
		
	}

    removeComponent(){

    }
	
	// Connections handling
	connect(sCompName, sOutputName, dCompName, dInputName){
		let sc = this.getComponent(sCompName);
		let dc = this.getComponent(dCompName);
		if(sc && dc) {
            sc.outs[sOutputName].connect(dc.ins[dInputName]);
		} else throw("Components for connection not found!");
	}

    disconnect(sCompName, sOutputName, dCompName, dInputName){
		let sc = this.getComponent(sCompName);
		let dc = this.getComponent(dCompName);
		if(sc && dc) {
            sc.outs[sOutputName].disconnect(dc.ins[dInputName]);
		} else throw("Components for connection not found!");
	}
}

/*
class AriConnection extends EventEmitter{
    constructor(){
        super();
        
        // Enable interception of all events
        let oldEmit = this.emit;
        this.emit = function() {
            let event = arguments[0];
            return oldEmit.apply(this, arguments);
        }
    }
}
*/

interface iComponentMetadata {
    name?: string;
    description?: string;
    svgUiTemplate?: string;
    svgDevUiTemplate?: string;
    htmlUiTemplate?: string;
    htmlDevUiTemplate?: string;
    value?: any;
}

class AriComponent {
    metadata: iComponentMetadata = {};
    ins: any = {};
    outs: any = {};
    _graph?: Graph;
    id: string;

	constructor(id: string){
        this.id = id;
        this.metadata.name = "Unnamed";
	}

	addInput(metadata, dataCallback: (data: any) => void = undefined, eventCallback: (event: string, data: any) => void = undefined){
        let input = new AriInput(this, metadata, dataCallback, eventCallback);
		this.ins[metadata.name] = input;
        return  input;
	}

	addOutput(metadata){
	    let output = new AriOutput(this, metadata);
        this.outs[metadata.name] = output; 
        return output;
	}
}

class AriOutput{
    component: AriComponent;
    metadata: any;
    _listeners: AriInput[] = [];
    cacheLastData?: boolean;
    _lastData?: any;

	constructor(ariComponent: AriComponent, metadata: any){
		this.component = ariComponent;
		metadata = metadata;	// TODO: clone! not reference!
	}
	connect(input: AriInput){
        this._listeners.push(input);
        input._handleEvent("connect", this);
        if(this.cacheLastData && this._lastData != undefined) input._handleEvent("data", this._lastData);
	}
    disconnect(input: AriInput){
        this._listeners.splice(this._listeners.indexOf(input), 1);
        input._handleEvent("disconnect", this);
    }
	send(data){
        for (let i = 0, l = this._listeners.length; i < l; i++) {
            this._listeners[i]._handleEvent("data", this);
        }
        if(this.cacheLastData) this._lastData = data; 
	}
}

class AriInput{
    component: AriComponent;
    metadata: any;
    onData?: (data: any) => void;
    onEvent?: (event: string, data: any) => void;

	constructor(ariComponent: AriComponent, metadata: any, dataCallback: (data: any) => void = null, eventCallback: (event: string, data: any) => void = null){
        this.component = ariComponent;
		this.metadata = metadata;	// TODO: clone! not reference!
		this.onData = dataCallback;
        if(eventCallback) this.onEvent = eventCallback;
	}
    _handleEvent(event: string, data: any){
        if(this.onData && event == "data") this.onData(data);
        else if(this.onEvent) this.onEvent(event, data);
    }
}

export class IID extends AriComponent{
    out1: AriOutput;
    _value: any;

    constructor(id?: string){
        super(id ? id : "IID");
        this.out1 = this.addOutput({});
        this.out1.cacheLastData = true; // Send last data to newly connected inputs.

        this.metadata["set value"] = (v: any)=> {
            this._value = v;
            this.out1.send(this._value);
        };
        this.metadata["set value"] = ():any => {
            return this._value;
        };
    }
}

export class SubGraph extends AriComponent{
    out1: AriOutput;
    constructor(id?: string){
        super(id ? id : "IID");
        this.metadata.value = "42";
		this.out1 = this.addOutput({});
        this.out1.cacheLastData = true; // Send last data to newly connected inputs.
    }
}

// Definition of user component.
export class NOP extends AriComponent{
    out1: AriOutput;

    constructor(id?: string){
        super(id ? id : "NOP");
        this.metadata.name = "NOP";
        this.metadata.description = "Component description.";
		this.out1 = this.addOutput({name: "out1", description:"Output 1.", type:"any"});
        this.out1.cacheLastData = true; // Send last data to newly connected inputs.
		
        // Normal declaration of input.
        this.addInput({name:"in1", description:"Input 1.", type:"any"}, (data)=>{
			this.outs.out1.send(data);
		});        

        // Compact declaration of input with both data and event handler.
        this.addInput({name:"in2", description:"Input 2.", type:"any"}, this.handleData, this.handleEvent);

        // Alternate definition of input.
        let in2 = this.addInput({name:"in2", description:"Input 2.", type:"any"});
        in2.onData = (data) => {
            // Do stuff...
        }
        in2.onEvent = (event, data) => {
            // Do stuff...
        }
    }
    handleData(data){this.out1.send(data);};
    handleEvent(event, data){console.log("Event from ")};
}

