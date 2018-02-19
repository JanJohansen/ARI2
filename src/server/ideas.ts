/*
ari.on(["livingroom.player.state", "livingroom.frontLight"], function(playerState, light){
    if(playerState != "playing") light = 0;
    else light = 1;
});

ari.on(["livingroom.player.state", "livingroom.frontLight"], 
    function(playerState, light){
        if(playerState != "playing") light = 0;
        else light = 1;
    }
);




ari.AddFunction(()=>{
    let light = ari.getParam("livingroom.screenLight");
    let state = ari.getParam("livingroom.player.state");
    
    if(state.value != "playing") light.value = 0;
    else light.value = 1;
});

ari.AddFunction(()=>{
    let lum = ari.getParam("driveway.lightIntensity");
    let minLum = ari.createParam("driveway.lightMinLightForLight", 60*1000);
    let lightTime = ari.createParam("driveway.lightTime", 60*1000);
    
    if (lum.v >= minLum.v) lightTime.v = 1;
    else lightTime.v = 0;
});

ari.AddFunction(()=>{
    let motion = ari.getParam("driveway.motion1");
    let light = ari.getParam("driveway.light1");
    let dark = ari.getParam("driveway.lightTime");
    let timeout = ari.createParam("driveway.lighttimeout", 60*1000);
    
    light.v = dark.v && motionTimerRunning;

    if (motion.changed()) {
        motionTimerRunning = 1;
        ari.startTimer(timeout, () => { motionTimerRunning = 0; });
        ari.run();
    }
});

*/
