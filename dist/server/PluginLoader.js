"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const loggingService_1 = require("./loggingService");
const AriEventEmitter_1 = require("./AriEventEmitter");
var fs = require("fs");
var cp = require('child_process');
//import AriPluginBase from "./AriPluginBase";
// Logging instance for Main...
class PluginLoader {
    constructor() { }
    static start() {
        PluginLoader.LoadPluginInfo();
        PluginLoader.ariEvents.on("pluginLoader.newPluginInfo", (pluginInfo) => {
            PluginLoader.log.trace("New plugin detected.");
            // TODO: check if we should actually start the plugin according to user settings. (enabled / disabled!)
            this.LoadPlugin(pluginInfo);
        });
    }
    static LoadPluginInfo() {
        return new Promise((resolve, reject) => {
            fs.readdir(__dirname + "/plugins", (err, files) => {
                if (err) {
                    reject(Error("Path to plugins not found."));
                }
                files.forEach((dir) => {
                    PluginLoader.log.info("Looking for package.json in " + __dirname + "\\plugins\\" + dir);
                    fs.stat(__dirname + "\\plugins\\" + dir, (error, stat) => {
                        if (stat && stat.isDirectory()) {
                            // We found sub-dir of plugins dir.
                            // Read manifest.
                            fs.readFile(__dirname + "/plugins/" + dir + "/" + "package.json", (err, data) => {
                                try {
                                    var manifest = JSON.parse(data);
                                }
                                catch (e) {
                                    log.warn(e);
                                    return;
                                }
                                if (manifest) {
                                    // Manifest available...
                                    if (manifest.AriPluginInfo) {
                                        manifest.AriPluginInfo.pluginPath = PluginLoader.pluginsPath + "/" + dir;
                                        if (!manifest.AriPluginInfo.debugFilePath)
                                            manifest.AriPluginInfo.debugFilePath = manifest.AriPluginInfo.pluginPath;
                                        PluginLoader.pluginInfos[dir] = manifest.AriPluginInfo;
                                        PluginLoader.ariEvents.emit("pluginLoader.newPluginInfo", manifest.AriPluginInfo);
                                    }
                                }
                                else {
                                    PluginLoader.log.trace("Missing manifest (package.json) in plugin folder.");
                                }
                            });
                        } // else its a file or error...
                    });
                });
                resolve();
            });
        });
    }
    static LoadPlugin(plugin) {
        if (!(plugin.name && plugin.main)) {
            PluginLoader.log.error("Error in configuration file when loading plugin.");
            return;
        }
        PluginLoader.log.info("Loading plugin: " + plugin.name + " (" + plugin.pluginPath + "/" + plugin.main);
        if (PluginLoader.loadLocal) {
            //try {
            let plug = require(plugin.pluginPath + "/" + plugin.main);
            if (plug.init)
                plug.init(this);
            else if (plug.default) {
                let plugInstance = new plug.default(this);
                //plugInstance.init(this);
            }
            else
                PluginLoader.log.error("Missing init function in plugin: " + plugin.name);
            /*} catch (e) {
                PluginLoader.log.info(e);
                PluginLoader.log.error("Error when loading plugin (" + plugin.name + ") from file (" + plugin.pluginPath + "/" + plugin.main + ")");
            }*/
        }
        else {
            if (!plugin.arguments)
                plugin.arguments = "";
            var args = [plugin.main].concat(plugin.args.split(" "));
            var pluginProcess = cp.spawn("node", args, { "cwd": plugin.pluginPath });
            pluginProcess.stdout.on('data', function (data) {
                console.log("/" + plugin.name + ":", data.toString());
                plugin.stdout += data.toString();
            });
            pluginProcess.stderr.on('data', function (data) {
                console.log(plugin.name + " ERROR:", data.toString());
                plugin.errout += data.toString();
            });
            pluginProcess.on('close', function (code) {
                console.log(plugin.name + " exit!:", code.toString());
                // TODO: Implement restart plugin n times before reporting error?
                //saveDebug(false);
            });
            PluginLoader.ariEvents.emit("pluginLoader.pluginLoaded", plugin.name);
        }
    }
}
PluginLoader.pluginsPath = "./plugins"; //__dirname + "/plugins";
PluginLoader.pluginInfos = {};
PluginLoader.ariEvents = AriEventEmitter_1.default.getInstance();
PluginLoader.log = loggingService_1.loggingService.getLogger("PluginLoader");
PluginLoader.loadLocal = true; // Set this to load plugins into existing V8 engine instead of spawning a new process.
exports.default = PluginLoader;
//# sourceMappingURL=C:/Users/jan/Desktop/ARI2/dist/server/PluginLoader.js.map