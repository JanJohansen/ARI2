// DONT delete: Will break typescript compilation! - Not finding node_modules! No idea why!?!??
/// <reference path="../../typings/index.d.ts" />

// Set up logging before loading any other modules! 
import { loggingService, consoleLogWriter } from './loggingService';
loggingService.setDefaultLevel("trace");
loggingService.addWriter(new consoleLogWriter({timestamp: true}));
var log = loggingService.getLogger("Main", "trace");

import { httpServer } from './httpServer';
import wsServer from './wsServer';
import Executor from './nodeExecutor';
import PluginLoader from './PluginLoader';
import AriEventEmitter from './AriEventEmitter';
var ariEvents = AriEventEmitter.getInstance();



//*****************************************************************************
ariEvents.onAny((event, args)=>{
    log.trace("ariEvent:", event);//, args);
});

// Log uncaught exceptions.
process.on('uncaughtException', function (error) {
   log.fatal(error);
   // TODO: Write (synchroneously) to special crash log file...
   // The correct use of 'uncaughtException' is to perform synchronous cleanup of allocated resources 
   // (e.g. file descriptors, handles, etc) before shutting down the process. 
   // It is not safe to resume normal operation after 'uncaughtException'.
   process.exit(1);
});

process.on ("SIGINT", function(){
    log.warn("User typed Ctrl+C... Shutting down.");
    process.exit();
});

//*****************************************************************************
// Enable user to properly close down server...
process.stdin.resume();
process.stdin.setEncoding("ascii");

process.stdin.on('data', function (text) {
    //log.info('received data:', text);
    if (text == "q\r\n") {
        handleNormalExit();    // TODO: Doesn't seem to work!?
    }
    handleNormalExit(); // Use "AnyKey" for now!
});

function handleNormalExit() {
    log.warn('User shut down.');
    //ari.shutDown();
    //saveDebug(true);
    process.exit();
}

//*****************************************************************************
// Start httpServer + websocketServer....
var http = new httpServer();
//var wss = new wsServer(http);

//*****************************************************************************
// Start plugins
var pLoader = new PluginLoader();


