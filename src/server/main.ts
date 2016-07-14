import { loggingService, consoleLogWriter } from './loggingService';
import { httpServer } from './httpServer';
import Executor from './nodeExecutor';

loggingService.setDefaultLevel("trace");
loggingService.addWriter(new consoleLogWriter({timestamp: true}));
/*loggingService.on("Main", (logger, level, ...args) => {
    console.log("SpecialLog:", logger.name, ...args);
});*/
var log = loggingService.getLogger("Main", "trace");

// Start httpServer...
//let http = new httpServer();

// Test ---------------
let executor = new Executor();
log.info("Functions:");
log.info(executor.getFunctions());

// Usage ----------------

//import * as library.miscLib from './miscLib.ts'
//let cons = new library.consoleWriter(new uid());
//let and = new library.logicAnd(new uid());

//nodeExecutor.connect(cons.inputs[1], and.outputs[0]);
