
# Server 
## ARI Object Model
    {
        ClientModels: {
            Client: {
                name:"Client",
                description: "blah blah",
                ins: [
                    {name:"in1", type:"number", description:"Input 1!"}
                ],
                outs: [
                    {name:"out1", type:"enum", enums: ["playing", "paused", "stopped"], description:"Input 1!"}
                ],
                functions: [
                    {
                        name:"function1", 
                        description:"Test func!", 
                        params:[
                            {name:"param1", type:"number", description:"param is used when blah blah..."}
                        ]
                    }
                ]
            },
            Client(1): {
                name:"Client(1)"
            }
        }
    }

# Client
## Client Object Model and Proxying


### Usage 
    var c = new AriClientComponent(clientName, state.authToken, "device");
    c.description = "blah blah";

    // Define inputs and handlers.
    c.ins.add("in1", {type: "string", description:"Descr"}, (data) => {
        c.outs.out1 = c.ins.in1;
    }, (event) => {});
    
    c.ins.in1.on("connect" ()=>{ /* do stuff */ });
    c.ins.in1.on("disconnect" ()=>{ /* do stuff */ });
    
    // Define outputs
    c.outs.add("out1", {type: "string", description:"Descr"});

    // Handle events.
    c.on("connect", (result) => {
    });

    // Define functions and handlers.
    c.functions.add("func1", {returntype: "string", description:"Descr", params:[{name:"param1", description:"blah"}]}, (params) => {
        return "Always 42!";
    };


    class me {
        constructor(){}
        in1: string;
        in1.description = "";
        func1 () {

        }
    }


From NoFlo!:
    var noflo = require("noflo");

    exports.getComponent = function() {
        var component = new noflo.Component;
        component.description = "This component receives data on a single input\
        port and sends the same data out to the output port";

        // Register ports and event handlers
        component.inPorts.add('in', { datatype: 'all' }, function(event, payload) {
            switch (event) {
                case 'data':
                    // Forward data when we receive it.
                    // Note: send() will connect automatically if needed
                    return component.outPorts.out.send(data);
                case 'disconnect':
                    // Disconnect output port when input port disconnects
                    return component.outPorts.out.disconnect();
                }
            }
        );
        component.outPorts.add('out', { datatype: 'all' });

        return component; // Return new instance
    };