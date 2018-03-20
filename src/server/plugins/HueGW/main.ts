import AriTcpClient from "../../../common/AriTcpClient";
import { AriObjectModel } from "../../../common/AriObjectModel";

var types = {
    "HueGW": { 
        description: "Philips Huw gateway.",
        functions: {
            getConfig: {
                description: "Get current configuration for gateway. @param id: Config ID to get."
            }
        },
        Lights: { description: "Lights group."},
    },
    
    "HueGWLamp": {
        description: "Input group.",
        ins: {
            brightness: {
                description: "Brightness of light deevice form 0 to 1.",
                type: "number",
                range: { min: 0.0, max: 1.0 },
                editor: "slider"
            }
        },
        outs: {
            reachable: {
                description: "Reachable is true if the device is connected to the bridge.",
                type: "boolean",
                range: { enum: ["false", "true"] }
            }
        }
    }
};

export default class HueGW {
    Lights;
    
    constructor() {
        var client = new AriTcpClient("HueGW");
        var hueGW = client.localModel;

        // Define own model.
        hueGW.addFunction("get42", (args) => {
            console.log("get42( " + args + " ) called.")
            return 42;
        });

        var Lights = hueGW.addObject("Lights", "HueGWLights");
        ["Lamp1", "Lamp2"].forEach((lamp) => {
            var lampModel = Lights.addObject(lamp, "HueGWLamp");
            var brightness = lampModel.addInput("brightness", (value) => {
                console.log("SET", value);
            });

            lampModel.addOutput("reachable");
        });

        hueGW["Lights"].Lamp1.ins.brightness.value = 0.5;
        console.log(JSON.stringify(hueGW, (key, value) => { return key.startsWith("__") ? undefined : value }, 2));


        var counter = hueGW.addOutput("counter", 0);
        setInterval(() => {
            counter.value++;
        }, 1000);


        // Interact with remote model.
        client.remoteModel.findPath("ARI.bootTime", "out").on("oSet", (evt)=>{ console.log("Server booted @", evt.target["value"]); });

/*
        this.model("Lights", { description: "Group for paired light devices." });
        ["Lamp1", "Lamp2"].forEach((lamp) => {
            this.model("Lights." + lamp, { description: "HUE light device." });
            this.model("Lights." + lamp + ".brightness", {
                type: "ioNumber",
                description: "Brightness of the light from 0.0 (fully off) to 1.0 (fully on).",
                value: 1.0,
                onSet: (name, value) => {

                },
                onChange: (name, value) => {

                }
            });

            this.model("Lights." + lamp + ".reachable", {
                type: "oBoolean",
                description: "Indicates whether the device is connected to the gateway.",
                value: false
            });
        });

        this.setLocal("Lights.Lamp1.brightness", 0.5);
        console.log(JSON.stringify(this.localModel, (key, value) => { return key.startsWith("__") && typeof (value) == "object" ? "<hidden>" : value }, 2));


        var counter = 0;
        this.model("counter", { type: "oNumber", value: 0 });
        setInterval(() => {
            this.setLocal("counter", counter++);
        }, 5000);

        this.sub("ARI.BootTime", (name, value) => { console.log("Server booted @", value); });
    */
    }
}
