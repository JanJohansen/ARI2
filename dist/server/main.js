"use strict";
const loggingService_1 = require('./loggingService');
const nodeExecutor_1 = require('./nodeExecutor');
loggingService_1.loggingService.setDefaultLevel("trace");
loggingService_1.loggingService.addWriter(new loggingService_1.consoleLogWriter({ timestamp: true }));
/*loggingService.on("Main", (logger, level, ...args) => {
    console.log("SpecialLog:", logger.name, ...args);
});*/
var log = loggingService_1.loggingService.getLogger("Main", "trace");
// Start httpServer...
//let http = new httpServer();
// Test ---------------
let executor = new nodeExecutor_1.default();
log.info("Functions:");
log.info(executor.getFunctions());
// Usage ----------------
//import * as library.miscLib from './miscLib.ts'
//let cons = new library.consoleWriter(new uid());
//let and = new library.logicAnd(new uid());
//nodeExecutor.connect(cons.inputs[1], and.outputs[0]);

//# sourceMappingURL=main.js.map