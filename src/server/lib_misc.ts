import {nodeBase} from './nodeExecutor' 
import { loggingService } from './loggingService';

export class consoleWriter extends nodeBase {
    static displayName: string = "Write to console";
    static description: string = "Function to write text to the console.";
    private static _log = loggingService.getLogger("consoleWriter");
	constructor(uid: string) {
        consoleWriter._log.trace("Creating consoleWriter.");
        
		super(uid);

        let input = this.createInput("Input", "string", "String to write to console.");
		
        input.addListener((data)=>{
			console.log(data);
		});
	}
}

export class logicAnd extends nodeBase {
    static displayName: string = "AND";
	static description: string = "Logic 'and' function.";
    private static _log = loggingService.getLogger("logicAnd");
    constructor(uid: string) {
        logicAnd._log.trace("Creating logicAnd.");

		super(uid);
		
        let iA = this.createInput("A", "any", "Digital input A for function.");
        let iB = this.createInput("B", "any", "Digital input B for function.");
        let output = this.createOutput("A&B", "bool", "Output of function.");
		
        iA.addListener( ()=>calculate() );
        iB.addListener( ()=>calculate() );

        function calculate(){
            logicAnd._log.trace("Calculating output.");
            output.value = iA.value & iB.value;
        }
	}
}