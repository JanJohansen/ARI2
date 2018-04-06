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


        var counter = hueGW.addOutput("HueGWCounter", 0);
        setInterval(() => {
            counter.value++;
        }, 2000);


        // Interact with remote model.
        client.sub("outs.bootTime", (name, value)=>{console.log("Server booted @", value);});
/*        client.on("out", "bootTime", (name, value)=>{console.log("Server booted @", value);});
        
        var server: any;
        server.set("Clients.HueGW.Lights.Lamp1.ins.brightness", 0.5);
        server.emit("set", "Clients.HueGW.Lights.Lamp1.ins.brightness", 0.5);

        server.sub("outs.bootTime", (n,v)=>{blink();});
        server.on("out", "outs.bootTime", "blink", (n,v)=>{blink();});
        
        server.call("Clients.HueGW.functions.getConfig", (result)=>{

        });

        server.emit("flash", "Clients.Flow", null);
        flow.on("flash", (n,v)=>{});
*/
    }
}
