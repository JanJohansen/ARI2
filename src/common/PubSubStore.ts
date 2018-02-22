

export default class PubSubStore {
    pubsubTree = {};
    pubSubTreeUpdated = false;

    constructor() {

    }

    public sub(name, cb) {
        //var clb = cb;
        this._traversePath(name.split("."), this.pubsubTree, (path, obj) => {
            if (!path.length) {
                // path found.
                obj.__subs = [cb];

                // Call callback to transfer value immediately...
                cb(name, obj.value);

                // TODO: Call callback to transfer "higher level values" immediately in case of a * or ** subscription!...

            } else if (path.length == 1) {
                if (path[0] == "*") {
                    obj.__sSubs = [cb];
                    path.shift();   // remove last part of path = stop traversal!
                } else if (path[0] == "**") {
                    obj.__ssSubs = [cb];
                    path.shift();   // remove last part of path = stop traversal!
                }
            }
        });

        // TODO: Call callbacks to transfer value immediately...
        return cb;
    }
    //{ "Services": { "HueGW": { "counter": { "__subs": [ null ], "value": { "value": 3, "ts": "2018-02-22T21:51:54.220Z" }, "ts": "2018-02-22T21:51:55.322Z" } } } }
    //{ "Services": { "HueGW": { "counter": { "__subs": [ null ], "value": 7                                               , "ts": "2018-02-22T21:52:14.221Z" } } } }

    public pub(name, value) {
        this._traversePath(name.split("."), this.pubsubTree, (path, obj) => {
            if (!path.length) {
                // path found.
                var propName = path[0];
                obj.value = value;
                obj.ts = new Date().toISOString();
                if ("__subs" in obj) obj.__subs.forEach(cb => {
                    cb(name, value);
                });
            } else {
                // Check for * & ** subscriptions
                if ("__sSubs" in obj) obj.__sSubs.forEach(cb => {
                    cb(name, value);
                });
                if ("__ssSubs" in obj) obj.__ssSubs.forEach(cb => {
                    cb(name, value);
                });

            }
        });
    }

    public unsub(name, cb) {
        //var clb = cb;
        this._traversePath(name.split("."), this.pubsubTree, (path, obj) => {
            if (!path.length) {
                // path found.
                var index = obj.__subs.indexOf(cb);
                if (index > -1) obj.__subs.splice(index, 1);
                if (!obj.__subs.length) delete obj.__subs;
            } else if (path.length == 1) {
                if (path[0] == "*") {
                    var index = obj.__sSubs.indexOf(cb);
                    if (index > -1) obj.__sSubs.splice(index, 1);
                    if (!obj.__sSubs.length) delete obj.__sSubs;
                    path.shift();   // remove last part of path = stop traversal!
                } else if (path[0] == "**") {
                    var index = obj.__ssSubs.indexOf(cb);
                    if (index > -1) obj.__ssSubs.splice(index, 1);
                    if (!obj.__ssSubs.length) delete obj.__ssSubs;
                    path.shift();   // remove last part of path = stop traversal!
                }
            }
        });
    }

    // Traverse whole tree and remove all ocurrences of given callback function.
    clearSubs(cb) {
        this._clearSubs(cb, this.pubsubTree);
    }

    _clearSubs(cb, obj) {
        if ("__subs" in obj) {
            var index = obj.__subs.indexOf(cb);
            if (index > -1) obj.__subs.splice(index, 1);
            if (!obj.__subs.length) delete obj.__subs;
        }
        if ("__sSubs" in obj) {
            var index = obj.__sSubs.indexOf(cb);
            if (index > -1) obj.__sSubs.splice(index, 1);
            if (!obj.__sSubs.length) delete obj.__sSubs;
        }
        if ("__ssSubs" in obj) {
            var index = obj.__ssSubs.indexOf(cb);
            if (index > -1) obj.__ssSubs.splice(index, 1);
            if (!obj.__ssSubs.length) delete obj.__ssSubs;
        }
        for (var prop in obj) {
            if(obj[prop] && typeof(obj[prop]) == "object") this._clearSubs(cb, obj[prop]);
        }
    }

    public setAttributes(name, attributes) {
        //var clb = cb;
        this._traversePath(name.split("."), this.pubsubTree, (path, obj) => {
            if (!path.length) {
                for (var prop in attributes) {
                    obj["_" + prop] = attributes[prop];
                }
                return true;
            }
        });
        this.pubSubTreeUpdated = true;
    }

    public getTopic(name): any {
        var result = null;
        this._traversePath(name.split("."), this.pubsubTree, (path, obj) => {
            if (!path.length) {
                // path found.
                result = obj;
            }
        });
        return result;
    }

    // Helper functions below *************************************************
    public getListeners(name) {
        var listeners = [];
        this._traversePath(name.split("."), this.pubsubTree, (path, obj) => {
            if (!path.length) {
                // path found.
                if ("__subs" in obj) listeners.push(obj.__subs);
            } else {
                // Check for * & ** subscriptions
                if ("__sSubs" in obj) listeners.push(obj.__sSubs);
                if ("__ssSubs" in obj) listeners.push(obj.__ssSubs);
            }
        });
        return listeners;
    }

    protected _traversePath(path: [string], obj: object, cb: (path: [string] | undefined[], obj) => void) {
        cb(path, obj);
        if (path.length > 0) {
            var name = path.shift();
            if (!path.length && name == "") {
                cb([], obj);
                return;
            } else { }
            if (!(name in obj)) {
                obj[name] = {}; // Path doesn't exist. Create it.
                this.pubSubTreeUpdated = true;
            }
            this._traversePath(path, obj[name], cb);
        }
    }
}
