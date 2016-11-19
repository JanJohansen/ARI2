"use strict";

import AriClient from "../../../www/app/ariclient";
import ConfigStore from "../../configStore.js");
import * as Flower from './Flower';

// Fast...
/*
let ca = new NOP();
let cb = new NOP();
ca.outs["out1"].connect(cb.ins["in1"]);
*/

// Using the pot! (graph!)
let g = new Flower.Graph();
console.log("Graph:", g);

g.addComponent(new Flower.NOP());
console.log("Graph:", g);

g.addComponent(new Flower.NOP());
g.connect("NOP", "out1", "NOP(1)", "in1");

console.log("Graph:", g);
//console.log("Graph:", JSON.stringify(g, null, "\t"));

console.log("out1:", g.getComponent("NOP"));


export default class FlowerPlugin{
    constructor(){
    }
}
