import AriTcpClient from "../../../common/AriTcpClient";

export default class HueGW extends AriTcpClient {

    constructor() {
        super({ name: "HueGW", attributes: {description: "Philips HUE gateway service." }});
        this.on("authenticated", this.setup);// FIXME: Is "bind" needed?
    }

    setup(){
        this.sub("ARI.BootTime", (name, value) => { console.log("Server booted @", value); });

        // Define own model.
        this.setAttributes(".Lights", { description: "Group for connected light devices." });
        ["Lamp1", "Lamp2"].forEach((lamp) => {
            this.setAttributes(".Lights." + lamp, { description: "HUE light device." });

            this.setAttributes(".Lights." + lamp + ".brightness", { type: "ioNumber", description: "Brightness of the light from 0.0 (fully off) to 1.0 (fully on)." });
            this.pub(".Lights." + lamp + ".brightness", 0.0);
            this.sub(".Lights." + lamp + ".brightness", () => { });

            this.setAttributes(".Lights." + lamp + ".reachable", { type: "oBoolean", description: "Indicates whether the device is connected to the gateway." });
            this.pub(".Lights." + lamp + ".reachable", false);
        });

        var i = 0;
        setInterval(() => {
            this.pub(".counter", i++);
        }, 5000);
    }
}
