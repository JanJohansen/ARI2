
export interface AriEvent {
    evt: string;
    source?: AriNode;
    target?: AriNode;
    value?: any;
}

//-----------------------------------------------------------------------------
export class AriNode {
    public static typeInfos: { [name: string]: any } = {};

    public name: string;
    public type?: string;
    public value?: any;
    protected __parent: AriNode;
    private __events: { [name: string]: Set<(event: AriEvent) => void> } = {};

    public constructor(parent: AriNode, name: string = undefined, type: string = undefined) {
        this.__parent = parent;
        this.name = name;
        this.type = type;
    }
    addChild(name: string = undefined, type: string = undefined) {
        this[name] = new AriNode(this, name, type);
        this[name].emit({ evt: "modelUpdated" });
        return this[name];
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
    pathToHere(source) {
        if (source == this) return "";
        var path = source.name;
        var p = source.__parent;
        while (p && p != this) {
            path = p.name + "." + path;
            p = p.__parent;
        }
        return path;
    }
    // Event handling
    on(eventName: string, cb: (event: AriEvent) => void) {
        if (!(eventName in this.__events)) this.__events[eventName] = new Set();
        this.__events[eventName].add(cb);

        this.emit({ evt: "addedListener", value: eventName });
    }
    off(eventName: string, cb: (event: AriEvent) => void) {
        this.__events[eventName].delete(cb);
        this.emit({ evt: "removedListener", value: eventName });
    }
    emit(event: AriEvent) {
        event.source = this;
        this.bubbleEvent(event);
    }
    inject(event: AriEvent) {
        event.target = this;
        this.bubbleEvent(event);
    }
    private bubbleEvent(event: AriEvent) {
        if (event.evt in this.__events) this.__events[event.evt].forEach((cb) => {
            cb(event);
        });
        if ("*" in this.__events) this.__events["*"].forEach((cb) => {
            cb(event);
        });
        if (this.__parent) this.__parent.bubbleEvent(event);
    }
    getOldestEvents(events: Map<string, AriNode> = null): Map<string, AriNode> {
        if (!events) events = new Map<string, AriNode>();
        if (this.__events) {
            for (var eventName in this.__events) {
                if (this.__events[eventName] && this.__events[eventName].size > 0) {
                    if (!events.has(eventName)) events.set(eventName, this);
                }
            }
        }
        for (var prop in this) {
            if (this[prop] instanceof AriNode) {
                if (this[prop] as any != this.__parent) this[prop].getOldestEvents(events);
            }
        }
        return events;
    }
    /**
     * Get opbjects that are subscribing to specific eventNames.
     * @param eventName The event name to search for.
     * @param traverse If true, itterate through child objects to collect all subscribing objects.
     */
    getListeners(eventName: string, traverse = false, listeners = new Set<AriNode>()): Set<AriNode> {
        if (this.__events) {
            if (this.__events[eventName] && this.__events[eventName].size > 0) {
                listeners.add(this);
            }
        }
        if (traverse) {
            for (var prop in this) {
                if (this[prop] as any != this.__parent) {
                    if (this[prop] instanceof AriNode) this[prop].getListeners(eventName, traverse, listeners);
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
    find(path: string): AriNode {
        if (path == "") return this;
        var parts = path.split(".");
        var o = this;
        while (o && parts.length) {
            var prop = parts.shift();
            if (!(prop in o)) return undefined;
            o = o[prop];
        }
        return o;
    }
    findOrCreate(path: string): AriNode {
        if (path == "") return this;
        var parts = path.split(".");
        var o = this;
        while (o && parts.length) {
            var prop = parts.shift();
            if (!(prop in o)) {
                o[prop] = o.addChild(prop);
            }
            o = o[prop];
        }
        return o;
    }
    /*updateModel(model) {
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
    }*/
}

class AriGroupModel extends AriNode {

};

interface AnyMembers {
    [name: string]: any;
}
export class AriObjectModel extends AriNode implements AnyMembers {
    ins?: { [name: string]: AriInputModel };
    outs?: { [name: string]: AriOutputModel };
    functions?: { [name: string]: AriFunctionModel };

    public constructor(parent: AriObjectModel, name: string, type: string = undefined) {
        super(parent, name, type);
    }
    public addObject(name: string, type: string = undefined): AriObjectModel {
        this[name] = new AriObjectModel(this, name, type) as any;
        this[name].emit({ evt: "modelUpdated", value: "AddObject" });
        return this[name];
    }
    addInput(name: string, cb: (name: string, value: any) => void): AriInputModel {
        if (!this.hasOwnProperty("ins")) this.ins = new AriGroupModel(this, "ins") as any;
        this.ins[name] = new AriInputModel(this.ins as any, name, cb);
        this.ins[name].emit({ evt: "modelUpdated", value: "AddInput" });
        return this.ins[name];
    }
    addOutput(name: string, value: any = undefined): AriOutputModel {
        if (!this.hasOwnProperty("outs")) this.outs = new AriGroupModel(this, "outs") as any;
        this.outs[name] = new AriOutputModel(this.outs as any, name, value);
        this.outs[name].emit({ evt: "modelUpdated", value: "AddOutput" });
        return this.outs[name];
    }
    addFunction(name: string, cb: (name: string, args: any) => any): AriFunctionModel {
        if (!this.hasOwnProperty("functions")) this.functions = new AriGroupModel(this, "functions") as any;
        this.functions[name] = new AriFunctionModel(this.functions as any, name, cb);
        this.functions[name].emit({ evt: "modelUpdated", value: "AddFunction" });
        return this.functions[name];
    }
    /**
     * 
     * @param path Path to destination
     * @param createIfNotExist string "in", "out" "function" or "obj" of the last object to create.
     */
    /*findPath(path: string, createIfNotExist: string = null): AriNode {
        var parts = path.split(".");
        var o = this;
        while (o && parts.length) {
            var prop = parts.shift();
            if (createIfNotExist && (!(prop in o))) {
                if (parts.length == 0) {
                    if (createIfNotExist == "in") o[prop] = new AriInputModel(o as AriObjectModel, prop, null);
                    else if (createIfNotExist == "out") o[prop] = new AriOutputModel(o as AriObjectModel, prop);
                    else if (createIfNotExist == "obj") o[prop] = new AriObjectModel(o as AriObjectModel, prop);
                    else if (createIfNotExist == "function") o[prop] = new AriFunctionModel(o as AriObjectModel, prop, null);
                    AriFunctionModel
                } else o[prop] = new AriObjectModel(o as AriObjectModel, prop);
                this.dispatchEvent(new AriEvent("modelUpdated", { target: this }));
            }
            o = o[prop];
        }
        return o;
    }*/
}

export class AriInputModel extends AriNode {
    private __value: any;
    private __cb;

    public constructor(parent: AriObjectModel, name: string, onSet: (name: string, value: any) => void) {
        super(parent, name);
        this.__parent = parent;
        this.__cb = onSet;
        var self = this;
        this.on("set", (evt) => { self.__cb(evt.target.name, evt.value); });
    }
    set value(value) {
        this.__value = value;
    }
    get value() {
        return this.__value;
    }
}
export class AriOutputModel extends AriNode {
    private __value: any;

    public constructor(parent: AriObjectModel, name: string, value: any = undefined) {
        super(parent, name);
        this.__value = value;
    }
    set value(value) {
        this.v = value;
    }
    get value() {
        return this.__value;
    }
    set v(value) {
        this.__value = value;
        this.emit({ evt: "out", value: value });
    }
    get v() {
        return this.__value;
    }
}

export class AriFunctionModel extends AriNode {
    private callback: any;

    public constructor(parent: AriGroupModel, name: string, callback: (name: string, args: any) => any) {
        super(parent, name);
        this.callback = callback;
    }
    async call(args) {
        return await this.callback(args);
    }
}
