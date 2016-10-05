// DONT delete: Will break typescript compilation! - Not finding node_modules! No idea why!?!??
/// <reference path="../../typings/index.d.ts" />

import { loggingService, consoleLogWriter } from './loggingService';
import { httpServer } from './httpServer';
import Executor from './nodeExecutor';

loggingService.setDefaultLevel("trace");
loggingService.addWriter(new consoleLogWriter({timestamp: true}));

// Log uncaught exceptions.
process.on('uncaughtException', function (error) {
   log.fatal(error);
   // TODO: Write (synchroneously) to special crash log file...
   // The correct use of 'uncaughtException' is to perform synchronous cleanup of allocated resources (e.g. file descriptors, handles, etc) before shutting down the process. It is not safe to resume normal operation after 'uncaughtException'.
   
   process.exit(1);
});

process.on ("SIGINT", function(){
    log.fatal("You clicked Ctrl+C!");
    process.exit();
});

//*****************************************************************************
// Enable user to properly close down server...
process.stdin.resume();
process.stdin.setEncoding("ascii");

process.stdin.on('data', function (text) {
    log.info('received data:', text);
    if (text == "q\r\n") {
        handleConsoleQuit();    // TODO: Doesn't seem to work!?
    }
    handleConsoleQuit(); // Use "AnyKey" for now!
});

function handleConsoleQuit() {
    log.warn('User shut down.');
    //ari.shutDown();
    //saveDebug(true);
    process.exit();
}

/*loggingService.on("Main", (logger, level, ...args) => {
    console.log("SpecialLog:", logger.name, ...args);
});*/
var log = loggingService.getLogger("Main", "trace");

// Start httpServer...
let http = new httpServer();

// Test ---------------
let executor = new Executor();
log.info("Functions:", __dirname);
log.info(executor.getFunctions());

// Usage ----------------

//import * as library.miscLib from './miscLib.ts'
//let cons = new library.consoleWriter(new uid());
//let and = new library.logicAnd(new uid());

//nodeExecutor.connect(cons.inputs[1], and.outputs[0]);
