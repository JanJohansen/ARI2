"use strict";
var fs = require("fs");
var ConfigStore = (function () {
    function ConfigStore(path, fileName) {
        this.path = path;
        this.fileName = fileName;
        this.config = {};
    }
    ConfigStore.prototype.load = function () {
        // Load config from file...
        try {
            var str = fs.readFileSync(this.path + "/" + this.fileName + ".json", 'utf8');
            this.config = JSON.parse(str);
        }
        catch (e) {
            // File not found. Check if teplate file exists.
            try {
                var str = fs.readFileSync(this.path + "/" + this.fileName + ".default.json", 'utf8');
                this.config = JSON.parse(str);
                console.log("Cerating new config file based on template!");
                this.save(); // Save copy of template config.
            }
            catch (e) {
                // No template file either - or error in template file!!!
                this.config = {};
            }
        }
        ;
        return this.config;
    };
    ConfigStore.prototype.save = function (configObject, prettify) {
        if (configObject === void 0) { configObject = undefined; }
        if (prettify === void 0) { prettify = null; }
        if (configObject)
            var config = configObject;
        else
            var config = this.config;
        if (prettify)
            prettify = '\t';
        else
            prettify = null;
        fs.writeFileSync(this.path + "/" + this.fileName + ".json", JSON.stringify(config, this.jsonReplacer, prettify));
    };
    ConfigStore.prototype.jsonReplacer = function (key, value) {
        //console.log("-- ", key, ",", value);
        if (key == undefined)
            return value;
        if (key.indexOf('__') == 0)
            return undefined; // Don's show hidden non-usable members indicated by double underscore __.
        return value;
    };
    return ConfigStore;
}());
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ConfigStore;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/server/configStore.js.map