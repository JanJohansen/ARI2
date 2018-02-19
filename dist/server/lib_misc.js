"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const nodeExecutor_1 = require("./nodeExecutor");
const loggingService_1 = require("./loggingService");
class consoleWriter extends nodeExecutor_1.nodeBase {
    constructor(uid) {
        consoleWriter._log.trace("Creating consoleWriter.");
        super(uid);
        let input = this.createInput("Input", "string", "String to write to console.");
        input.addListener((data) => {
            console.log(data);
        });
    }
}
consoleWriter.displayName = "Write to console";
consoleWriter.description = "Function to write text to the console.";
consoleWriter._log = loggingService_1.loggingService.getLogger("consoleWriter");
exports.consoleWriter = consoleWriter;
class logicAnd extends nodeExecutor_1.nodeBase {
    constructor(uid) {
        logicAnd._log.trace("Creating logicAnd.");
        super(uid);
        let iA = this.createInput("A", "any", "Digital input A for function.");
        let iB = this.createInput("B", "any", "Digital input B for function.");
        let output = this.createOutput("A&B", "bool", "Output of function.");
        iA.addListener(() => calculate());
        iB.addListener(() => calculate());
        function calculate() {
            logicAnd._log.trace("Calculating output.");
            output.value = iA.value & iB.value;
        }
    }
}
logicAnd.displayName = "AND";
logicAnd.description = "Logic 'and' function.";
logicAnd._log = loggingService_1.loggingService.getLogger("logicAnd");
exports.logicAnd = logicAnd;
//# sourceMappingURL=C:/Users/jan/Desktop/ARI2/dist/server/lib_misc.js.map