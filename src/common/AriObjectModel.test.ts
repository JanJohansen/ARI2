import { AriObjectModel } from "./AriObjectModel";

export default class AriTest {
    lastAddedEvent;
    lastEvent;
    constructor() {
        console.log("AriTest------------------------------------------------");

        var ari = new AriObjectModel(null, "TestObject 1");
        ari.on("*", this.debugEvt.bind(this));

        var childObject = ari.addObject("ChildObject", "ChildType");
        //console.log(JSON.stringify(ari, (key, value) => { return key.startsWith("__") ? undefined : value; }, 2));
        
        childObject.on("oSet", this.debugEvt.bind(this));
        var childValue = childObject.addOutput("out1");
        childObject.outs.out1.value = 1;
        this.assert(this.lastEvent.eventName == "oSet", "Root to receive 'set' event!");
        this.assert(this.lastEvent.target == childValue, "Event has correct target.");
        this.assert(this.lastEvent.target.value == 1, "Event has correct target.value.");



        console.log("AriTest END--------------------------------------------");
    };

    assert(testresult, testName){
        if(testresult) console.log("Passed test:", testName);
        else console.log("!! FAILED test :", testName);
    }

    debugEvt(evt){
        this.lastEvent = evt;
        console.log("!!!", evt.target.name, evt.name);
        console.log("Event:", JSON.stringify(evt, (key, value) => { return key.startsWith("__") ? undefined : value; }, 2));
    }
}