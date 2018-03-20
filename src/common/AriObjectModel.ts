
export class AriEvent {
    eventName: string;
    target?: AriModelBase;
    value?: any;
    addedEventName?: string;
    removedEventName?: string;

    constructor(name: string, eventInitDict: any = null) {
        if (eventInitDict) {
            for (let prop in eventInitDict) {
                this[prop] = eventInitDict[prop];
            }
        }
        this.eventName = name;
    }
}
class AriCustomEvent extends AriEvent {
    constructor(customEventName: string, eventInitDict: any = null) {
        super("customEvent", { customEventName: customEventName, details: eventInitDict });
    }
}

//-----------------------------------------------------------------------------
export class AriModelBase {
    public static typeInfos: { [name: string]: any } = {};

    public name: string;
    public type: string;
    protected __parent: AriModelBase;
    private __events: { [name: string]: Set<(event: AriEvent) => void> } = {};

    public constructor(parent: AriObjectModel, name: string = undefined, type: string = undefined) {
        this.__parent = parent;
        this.name = name;
        this.type = type;
    }
    get path() {
        var path = this.name;
        var p = this.__parent;
        while (p) {
            path = p.name + "." + path;
            p = p.__parent;
        }
        return path;
    }
    pathToHere(source){
        if(source == this) return "";
        var path = source.name;
        var p = source.__parent;
        while (p && p != this) {
            path = p.name + "." + path;
            p = p.__parent;
        }
        return path;
    }
    // Event bubbling and handling
    on(eventName: string, cb: (event: AriEvent) => void) {
        if (!(eventName in this.__events)) this.__events[eventName] = new Set();
        this.__events[eventName].add(cb);
        
        this.dispatchEvent(new AriEvent("addedListener", {addedEventName: eventName, target: this, }));
    }
    off(eventName: string, cb: (event: AriEvent) => void) {
        this.__events[eventName].delete(cb);
        this.dispatchEvent(new AriEvent("removedListener", {removedEventName: eventName, target: this, }));
    }
    dispatchEvent(event: AriEvent) {
        if (event.eventName in this.__events) this.__events[event.eventName].forEach((cb) => {
            cb(event);
        });
        if ("*" in this.__events) this.__events["*"].forEach((cb) => {
            cb(event);
        });
        if (this.__parent) this.__parent.dispatchEvent(event);
    }
    /**
     * Get opbjects that are subscribing to specific eventNames.
     * @param eventName The event name to search for.
     * @param traverse If true, itterate through child objects to collect all subscribing objects.
     */
    getListeners(eventName: string, traverse = false, listeners = new Set<AriModelBase>()): Set<AriModelBase>  {
        if (this.__events) {
            if(this.__events[eventName] && this.__events[eventName].size > 0) {
                listeners.add(this);
            }
        }
        if (traverse) {
            for (var prop in this) {
                if (this[prop] as any != this.__parent) {
                    if(this[prop] instanceof AriModelBase) this[prop].getListeners(eventName, traverse, listeners);
                }
            }
        }
        return listeners;
    }
    clearListeners(name: string, cb) {
        if (this.__events && this.__events[name]) this.__events[name].delete(cb);
        for (var prop in this) {
            if (this[prop] as any != this.__parent) {
                if (this[prop] instanceof AriObjectModel) this[prop].clearListeners(cb);
                else if (this[prop] instanceof AriOutputModel) this[prop].clearListeners(cb);
            }
        }
    }
    updateModel(model) {
        // Delete deleted
        for (let prop in this) {
            if (!prop.startsWith("__")) {
                if (!(prop in model)) delete this[prop];
            }
        }
        // add new
        for (let prop in model) {
            if (!prop.startsWith("__")) {
                if (!(prop in this)) {
                }
            }
        }
        // Update values
        for (let prop in this) {
            if (!prop.startsWith("__")) {
                if (this[prop] instanceof AriObjectModel) {
                    this[prop].setAttributes(model[prop]);
                    this[prop].updateModel(model[prop]);
                }
            }
        }
    }
    typeInfo(name: string, typeInfo: any) {
        AriModelBase.typeInfos[name] = typeInfo;
        this.dispatchEvent(new AriEvent("typeInfo", { target: this, name: name, trypeInfo: typeInfo }));
    }
}

interface AnyMembers{
    [name: string]: any;
}
export class AriObjectModel extends AriModelBase implements AnyMembers {
    ins?: { [name: string]: AriInputModel };
    outs?: { [name: string]: AriOutputModel };
    functions?: { [name: string]: AriFunctionModel };

    public constructor(parent: AriObjectModel, name: string, type: string = undefined) {
        super(parent, name, type);
    }
    public addObject(name: string, type: string): AriObjectModel {
        this[name] = new AriObjectModel(this, name, type);
        this.dispatchEvent(new AriEvent("modelUpdated", { change: "AddChild", target: this, childName: name }));
        return this[name];
    }
    addInput(name: string, cb: (name: string, value: any) => void):  AriInputModel {
        if (!this.hasOwnProperty("ins")) this.ins = this.addObject("ins", undefined) as any;
        this.ins[name] = new AriInputModel(this.ins as any, name, cb);
        this.dispatchEvent(new AriEvent("modelUpdated", { change: "AddInput", target: this, inputName: name }));
        return this.ins[name];
    }
    addOutput(name: string, value: any = undefined):  AriOutputModel {
        if (!this.hasOwnProperty("outs")) this.outs = this.addObject("outs", undefined) as any;
        this.outs[name] = new AriOutputModel(this.outs as any, name, value);
        this.dispatchEvent(new AriEvent("modelUpdated", { change: "AddOutput", target: this, outputName: name }));
        return this.outs[name];
    }
    addFunction(name: string, cb: (name: string, args: any) => any): AriFunctionModel {
        if (!this.hasOwnProperty("functions")) this.functions = this.addObject("functions", undefined) as any;
        this.functions[name] = new AriFunctionModel(this.functions as any, name, cb);
        this.dispatchEvent(new AriEvent("modelUpdated", { change: "AddFunction", target: this, functionName: name }));
        return this.functions[name];
    }
    /**
     * 
     * @param path Path to destination
     * @param createIfNotExist string "in", "out" or "obj" of the last object to create.
     */
    findPath(path: string, createIfNotExist: string = null): AriModelBase {
        var parts = path.split(".");
        var o = this;
        while (o && parts.length) {
            var prop = parts.shift();
            if (createIfNotExist && (!(prop in o))) {
                if(parts.length == 0){
                    if(createIfNotExist == "in") o[prop] = new AriInputModel(o as AriObjectModel, prop, null);
                    else if(createIfNotExist == "out") o[prop] = new AriOutputModel(o as AriObjectModel, prop);
                    else if(createIfNotExist == "obj") o[prop] = new AriObjectModel(o as AriObjectModel, prop);
                } else o[prop] = new AriObjectModel(o as AriObjectModel, prop);
                this.dispatchEvent(new AriEvent("modelUpdated", { target: this }));
            }
            o = o[prop];
        }
        return o;
    }
}

export class AriInputModel extends AriModelBase {
    private __value: any;
    private __cb;

    public constructor(parent: AriObjectModel, name: string, onSet: (name: string, value: any) => void) {
        super(parent, name);
        this.__parent = parent;
        this.__cb = onSet;
        var self = this;
        this.on("setI", (evt) => { self.__cb(evt.target.name, evt.value); });
    }
    set value(value) {
        this.__value = value;
        this.dispatchEvent(new AriEvent("setI", { target: this, value: value }));
    }
    get value() {
        return this.__value;
    }
}
export class AriOutputModel extends AriModelBase {
    private __value: any;

    public constructor(parent: AriObjectModel, name: string, value: any = undefined) {
        super(parent, name);
        this.__value = value;
    }
    set value(value) {
        this.__value = value;
        this.dispatchEvent(new AriEvent("oSet", { target: this, value: value }));
    }
    get value() {
        return this.__value;
    }
    set v(value) {
        this.__value = value;
    }
    get v() {
        return this.__value;
    }
}

export class AriFunctionModel extends AriModelBase {
    private callback: any;

    public constructor(parent: AriObjectModel, name: string, callback: (name: string, args: any) => any) {
        super(parent, name);
        this.callback = callback;
    }
    async call(args) {
        return await this.callback(args);
    }
}

