import { loggingService } from './loggingService';

var log = loggingService.getLogger("nodeExecutor");

export default class nodeExecutor {
    functionBlocks: {}[] = []; 

    constructor() {
        log.trace("Trace test!");
        log.info("NodeExecutor started...");
        this.loadFunctionBlocks();
    }

    loadFunctionBlocks(){
        let lib =  require('./lib_misc');
        //log.info(lib);
        for(var key in lib) {
            let libClass: typeof nodeBase = lib[key];
            log.info("--------");
            log.info("Function:", key);
            log.info("Display name:", libClass.displayName);
            log.info("Description:", libClass.description);
            this.functionBlocks.push({name: key, functionClass: libClass});
        }
    }

    getFunctions(){
	    return this.functionBlocks;    
    }

    static connect(output: nodeIOBase, input: nodeIOBase) {
        output.addListener((data)=>{
            input.value = data;
        })
    }

    disconnect(output: nodeIOBase, input: nodeIOBase) {
        output.addListener((data)=>{
            input.value = data;
        })
    }

}

export class nodeIOBase {
    name: string;
    type: string;
    description: string;
    private _value: any;
	listeners: ((any?)=>any)[] = [];

    constructor(name: string, type: string, description: string) {
        this.name = name;
        this.type = type;
        this.description = description;
    }

    get value(){
        return this._value;
    }

    set value(value){
        this._value = value;
        this.listeners.forEach(callback=>{
			callback(value);
		});
    }

    addListener(callback:(any)=>any) {
		this.listeners.push(callback);
	};
	
	removeListener(callback:(any)=>any) {
		this.listeners.splice(this.listeners.indexOf(callback), 1);
	};
}


export class nodeBase {
	static displayName: string = "Anonymous";
	static description: string = "";
    uid: string;
	inputs: nodeIOBase[] = [];
	outputs: nodeIOBase[] = [];
	
	constructor(uid: string) {
		this.uid = uid;
        nodeBase.description = "";
	}
	
	createInput(name: string, type: string, description: string) {
        let input = new nodeIOBase(name, type, description);
		this.inputs.push(input);
        return input;
	}
	
	createOutput(name: string, type: string, description: string) {
        let output = new nodeIOBase(name, type, description);
	    this.outputs.push(output);
        return output;
	}
}

