"use strict";
;
var Flower = require('./Flower');
// Fast...
/*
let ca = new NOP();
let cb = new NOP();
ca.outs["out1"].connect(cb.ins["in1"]);
*/
// Using the pot! (graph!)
var g = new Flower.Graph();
console.log("Graph:", g);
g.addComponent(new Flower.NOP());
console.log("Graph:", g);
g.addComponent(new Flower.NOP());
g.connect("NOP", "out1", "NOP(1)", "in1");
console.log("Graph:", g);
//console.log("Graph:", JSON.stringify(g, null, "\t"));
console.log("out1:", g.getComponent("NOP"));
var FlowerPlugin = (function () {
    function FlowerPlugin() {
    }
    return FlowerPlugin;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = FlowerPlugin;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/plugins/flower/flower.plugin.js.map