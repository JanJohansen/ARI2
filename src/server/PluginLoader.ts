import { loggingService } from './loggingService';
import AriEventEmitter from './AriEventEmitter';
var fs = require("fs");
var cp = require('child_process');

// Logging instance for Main...

export default class PluginLoader {
    static pluginsPath = __dirname + "/plugins";
    static pluginInfos: any = {};
    static ariEvents: any = AriEventEmitter.getInstance();
    static log = loggingService.getLogger("PluginLoader");
    static loadLocal = true;    // Set this to load plugins into existing V8 engine instead of spawning a new process.

    private constructor() {}

    static start(){
        PluginLoader.LoadPluginInfo();
        PluginLoader.ariEvents.on("pluginLoader.newPluginInfo", (pluginInfo) => {
            PluginLoader.log.trace("New plugin detected.");
            // TODO: check if we should actually start the plugin according to user settings. (enabled / disabled!)
            this.LoadPlugin(pluginInfo);
        });
    }

    static LoadPluginInfo() {
        return new Promise((resolve, reject) => {
            var self = this;
            fs.readdir(this.pluginsPath, (err, files) => {
                if (err) { reject(Error("Path to plugins not found.")); }

                files.forEach((dir) => {
                    fs.stat(self.pluginsPath + "/" + dir, (error, stat) => {
                        if (stat && stat.isDirectory()) {
                            // We found sub-dir of plugins dir.
                            // Read manifest.
                            fs.readFile(self.pluginsPath + "/" + dir + "/" + "package.json", (err, data) => {
                                try { var manifest = JSON.parse(data) } catch (e) { log.warn(e); return; }
                                if (manifest) {
                                    // Manifest available...
                                    if (manifest.AriPluginInfo) {
                                        manifest.AriPluginInfo.pluginPath = self.pluginsPath + "/" + dir;
                                        if (!manifest.AriPluginInfo.debugFilePath) manifest.AriPluginInfo.debugFilePath = manifest.AriPluginInfo.pluginPath;

                                        self.pluginInfos[dir] = manifest.AriPluginInfo;
                                        PluginLoader.ariEvents.emit("pluginLoader.newPluginInfo", manifest.AriPluginInfo);
                                    }
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
        PluginLoader.log.info("Loading plugin:", plugin.name);

        if(PluginLoader.loadLocal){
            require(plugin.pluginPath + "/" + plugin.main); 
        } 
        else 
        {
            if (!plugin.arguments) plugin.arguments = "";
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
