"use strict";

import AriClient from "../../../www/app/ariclient";
//import ConfigStore from "../../configStore.js";
import * as Flower from './Flower';

//var state = new StateStore();
//var ari = new AriClient({authToken: state.authToken});
var ari = new AriClient();
ari.on("connect", ()=>{

    ari.log("FlowerPlugin", "Flower plugin started and connected.");

    // Define IOs
    var out1 = ari.addOutput({name: "out1"});

    ari.addInput({name: "in1"}, (data)=>{
        out1.send(data);
    });

    // Define functions
    ari.addFunction({name: "func1"}, (params, callback)=>{
        var result = true;
        callback(null, result);
    });

    // Do stuff...
    var counter = 0;
    setInterval(()=>{ 
        out1.send(counter); 
    }, 1000);

});

ari.on("disconnect", ()=>{
    // Indicate disconnected?
});




// Fast...
/*
let ca = new NOP();
let cb = new NOP();
ca.outs["out1"].connect(cb.ins["in1"]);
*/
/*
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
*/
