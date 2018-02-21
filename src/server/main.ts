/*
// DONT delete: Will break typescript compilation! - Not finding node_modules! No idea why!?!??
/// <reference path="../../typings/index.d.ts" />
*/

// Set up logging before loading any other modules! 
import { loggingService, consoleLogWriter } from './loggingService';
loggingService.setDefaultLevel("trace");
loggingService.addWriter(new consoleLogWriter({ timestamp: true }));
var log = loggingService.getLogger("Main");
log.info("ARI 2.0 Starting.");

import { httpServer } from './httpServer';
//import wsServer from './wsServer';
//import Executor from './nodeExecutor';
import PluginLoader from './PluginLoader';
import AriClientServer from './ariClientServer';
import AriEventEmitter from './AriEventEmitter';
var WebSocketServer = require('ws').Server;
import * as net from "net";
import AriTcpClientServer from './AriTcpClientServer';

//*****************************************************************************
var ariEvents: any = AriEventEmitter.getInstance();

ariEvents.onAny((event, args) => {
    log.trace("AriEvent:", event);//, args);
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

process.on("SIGINT", function () {
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
var wss = new WebSocketServer({ server: http.server });

// Set up "mediator" between components.
wss.on("connection", (ws) => {
    log.trace("Client connecting");
    var acs = new AriClientServer();

    ws.on("message", (msg) => {
        log.trace("<-", msg);
        acs.msgIn(msg);
    });
    acs.on("msgOut", (tlg) => {
        log.trace("->", tlg);
        ws.send(tlg);
    });
    acs.on("closeOut", (tlg) => { ws.close(); });

    ws.on("error", () => { acs.disconnect(); });
    ws.on("close", () => { acs.disconnect(); });

    // Will acs leak memmory after disconnection?

});

//*****************************************************************************
// Start TcpServer
const server = net.createServer((socket) => {
    // 'connection' listener
    console.log('Tcp client connected');
    var tcpAri = new AriTcpClientServer(socket);
});
server.on('error', (err) => {
    throw err;
});
server.listen(3000, () => {
    console.log('server bound');
});

//*****************************************************************************
// Start plugins
//PluginLoader.start();

import PubSubStore from "./PubSubStore";
var pubsub = new PubSubStore();
//pubsub.pub("Services.HueGW.Lights.Lamp1.brightness.out", 0.5);
//log.debug("Tree:", JSON.stringify(pubsub.pubsubTree, null, 2));

/*
pubsub.sub("Services.HueGW.Lights.Lamp1.brightness.out", (value, name)=>{
    log.debug("CB:", name, "=", value);    
});
log.debug("Tree:", JSON.stringify(pubsub.pubsubTree, null, 2));
pubsub.pub("Services.HueGW.Lights.Lamp1.brightness.out", 0.9);

var cb = pubsub.sub("Services.HueGW.**", (value, name)=>{
    log.debug("CB:", name, "=", value);    
});
log.debug("Tree:", JSON.stringify(pubsub.pubsubTree, null, 2));
pubsub.pub("Services.HueGW.Lights.Lamp1.brightness.out", 1.0);

pubsub.unsub("Services.HueGW.**", cb);
log.debug("Tree:", JSON.stringify(pubsub.pubsubTree, null, 2));
pubsub.pub("Services.HueGW.Lights.Lamp1.brightness.out", 1.0);

pubsub.pub("Services.HueGW.Lights.Lamp1.reachable.out", false);
pubsub.setAttributes("Services.HueGW", {description: "Philips HUE gateway."});
log.debug("Tree:", JSON.stringify(pubsub.pubsubTree, null, 2));

var i= 0;
*/

pubsub.setAttributes("HueGW", {description: "Philips HUE gateway service."});
pubsub.setAttributes("HueGW.Lights", {description: "Group for connected light devices."});
["Lamp1", "Lamp2"].forEach((lamp)=>{
    pubsub.setAttributes("HueGW.Lights." + lamp, {description: "HUE light device."});
    
    pubsub.setAttributes("HueGW.Lights." + lamp + ".brightness", {type: "ioNumber", description: "Brightness of the light from 0.0 (fully off) to 1.0 (fully on)."});
    pubsub.pub("HueGW.Lights." + lamp + ".brightness", 0.0);
    pubsub.sub("HueGW.Lights." + lamp + ".brightness", ()=>{});

    pubsub.setAttributes("HueGW.Lights." + lamp + ".reachable", {type:"oBoolean", description: "Indicates whether the device is connected to the gateway."});
    pubsub.pub("HueGW.Lights." + lamp + ".reachable", false);

});

log.debug("Tree:", JSON.stringify(pubsub.pubsubTree, null, 2));





