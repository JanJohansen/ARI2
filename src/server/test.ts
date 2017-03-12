


interface iClient{
    //addInput(metadata: any, callback: (inputName: string, data: any)=>void);
    //removeInput(name);
    //addOutput(metadata: any);
    //removeOutput(name);
    //addFunction(metadata: any, callback: (err: string, result: any)=>void);

    //sendClientInfo();
    _webnotify_CLIENTINFO();

    setInput(name, value);
    _webnotify_INPUT(msg);

    //sendOutput(name: string, data: any);
    _webcall_OUTPUT(msg);

    watchOutput(name, callback: (outputName: string, data: any)=>void);
    _webcall_WATCHOUTPUT(msg);
    unWatchOutput(name, callback: (outputName: string, data: any)=>void);
    _webcall_UNWATCHOUTPUT(msg);

    callFunction(functionName, params, callback: (err: string, result: any)=>void);
    _webcall_CALL(msg, callback);
}