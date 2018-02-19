"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ariclient_1 = require("../../../www/app/ariclient");
//var state = new StateStore();
//var ari = new AriClient({authToken: state.authToken});
var ari = new ariclient_1.default("Flower_plugin", { password: "please" });
console.log("Registering callbacks on FlowerPlugin");
ari.on("connect", () => {
    console.log("FlowerPlugin", "Flower plugin started and connected.");
    // Define IOs
    var out1 = ari.addOutput({ name: "out1" });
    ari.addInput({ name: "in1" }, (data) => {
        out1.send(data);
    });
    // Define functions
    ari.addFunction({ name: "func1" }, (params, callback) => {
        var result = true;
        callback(null, result);
    });
    // Do stuff...
    var counter = 0;
    setInterval(() => {
        //out1.send(counter++); 
    }, 1000);
});
ari.on("disconnect", () => {
    // Indicate disconnected?
});
//# sourceMappingURL=C:/Users/jan/Desktop/ARI2/dist/server/plugins/flower/flower.plugin.js.map