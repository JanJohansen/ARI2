"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var nodeExecutor_1 = require('./nodeExecutor');
var loggingService_1 = require('./loggingService');
var consoleWriter = (function (_super) {
    __extends(consoleWriter, _super);
    function consoleWriter(uid) {
        consoleWriter._log.trace("Creating consoleWriter.");
        _super.call(this, uid);
        var input = this.createInput("Input", "string", "String to write to console.");
        input.addListener(function (data) {
            console.log(data);
        });
    }
    consoleWriter.displayName = "Write to console";
    consoleWriter.description = "Function to write text to the console.";
    consoleWriter._log = loggingService_1.loggingService.getLogger("consoleWriter");
    return consoleWriter;
}(nodeExecutor_1.nodeBase));
exports.consoleWriter = consoleWriter;
var logicAnd = (function (_super) {
    __extends(logicAnd, _super);
    function logicAnd(uid) {
        logicAnd._log.trace("Creating logicAnd.");
        _super.call(this, uid);
        var iA = this.createInput("A", "any", "Digital input A for function.");
        var iB = this.createInput("B", "any", "Digital input B for function.");
        var output = this.createOutput("A&B", "bool", "Output of function.");
        iA.addListener(function () { return calculate(); });
        iB.addListener(function () { return calculate(); });
        function calculate() {
            logicAnd._log.trace("Calculating output.");
            output.value = iA.value & iB.value;
        }
    }
    logicAnd.displayName = "AND";
    logicAnd.description = "Logic 'and' function.";
    logicAnd._log = loggingService_1.loggingService.getLogger("logicAnd");
    return logicAnd;
}(nodeExecutor_1.nodeBase));
exports.logicAnd = logicAnd;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/lib_misc.js.map