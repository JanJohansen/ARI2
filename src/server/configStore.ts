"use strict";

import fs = require("fs");

export default class ConfigStore {
    path: string;
    fileName: string;
    config: any;

    constructor(path, fileName) {
        this.path = path;
        this.fileName = fileName;
        this.config = {};
    }

    load() {
        // Load config from file...
        try {
            var str = fs.readFileSync(this.path + "/" + this.fileName + ".json", 'utf8');
            this.config = JSON.parse(str);
        } catch (e) {
            // File not found. Check if teplate file exists.
            try {
                var str = fs.readFileSync(this.path + "/" + this.fileName + ".default.json", 'utf8')
                this.config = JSON.parse(str);
                console.log("Cerating new config file based on template!");
                this.save(); // Save copy of template config.
            } catch (e) {
                // No template file either - or error in template file!!!
                this.config = {};
            }
        };
        return this.config;
    }

    save(configObject: any=undefined, prettify: string=null) {
        if (configObject) var config = configObject;
        else var config = this.config;
        if (prettify) prettify = '\t';
        else prettify = null;
        fs.writeFileSync(this.path + "/" + this.fileName + ".json", JSON.stringify(config, this.jsonReplacer, prettify));
    }

    jsonReplacer(key, value) {
        //console.log("-- ", key, ",", value);
        if (key == undefined) return value;
        if (key.indexOf('__') == 0) return undefined;    // Don's show hidden non-usable members indicated by double underscore __.
        return value;
    }
}