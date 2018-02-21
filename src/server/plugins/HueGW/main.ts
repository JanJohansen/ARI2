import AriTcpClient from "../../../common/AriTcpClient";

export default class HueGW {

    ari = new AriTcpClient({ name: "HueGW" });
    hue;

    constructor() {
        var self = this;
        this.ari.sub("authenticated", () => { self.authenticated() });
        this.ari.sub("disconnected", () => { self.disconnected() });

        this.ari.sub(".ARI.BootTime", (val) => { log.debug("Server booted @", val); });
    }

    authenticated() {
        //var config = await this.ari.getServiceConfig();
        //this.config["Connection.gatewayIP"] = "127.0.0.1";

        var hue = this.ari.serviceModel;
        this.hue = hue;
        hue.getConfig = {
            type: "function", description: "kjhkjh", __callback: (pars) => {
                //doStuff
            }
        };
        hue.Lights = { description: "Lights group." };
        hue.Lights.LivingroomFloorLamp = { description: "Philips Hue bulb." };
        hue.Lights.LivingroomFloorLamp.brightness = {
            type: "iNumber", value: 0.5, description: "Brightness from 0 to 1. 0.5 = ½. Getit? :O)",
            __onSet: (value, name) => {

            },
            __onChanged: (value, name) => {

            }
        };
        hue.Lights.LivingroomFloorLamp.reachable = { type: "oBoolean", value: false, description: "Is the light copnnected to the gateway." };


        console.log("--------------");
        console.log(JSON.stringify(hue, (key, value) => {
            if (key.startsWith("__")) return undefined;//"<removed>";
            else return value;
        }, 2));
        console.log("--------------");
        setTimeout(this.doStuffLater.bind(this), 200);
        console.log("--------------");
    }

    doStuffLater(){
        this.hue.Lights.LivingroomFloorLamp.reachable = true;
    }
    
    disconnected(){
        // Clean up...
    }
}
