import AriTcpClient from "../../../common/AriTcpClient";

export default class HueGW {
    constructor() {
        var hueGW = new AriTcpClient("HueGW");

        // Define own model.
        hueGW.onCall("get42", (args) => {
            console.log("get42( " + args + " ) called.")
            return 42;
        });

        ["Lamp1", "Lamp2"].forEach((lamp) => {
            hueGW.on("Lights." + lamp + "brightness.set", (args)=>{
                console.log(this.event, "=", args);
            });
            hueGW.emit("Lights." + lamp + "brightness.set", true);
        });

        var counter = 0;
        setInterval(() => {
            hueGW.emit("counter.out", counter);
            counter++;
        }, 2000);
    }

    types = {
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
}