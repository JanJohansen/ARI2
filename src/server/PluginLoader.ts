import { loggingService } from './loggingService';
import AriEventEmitter from './AriEventEmitter'; 
var fs = require("fs");
var cp = require('child_process');

// Logging instance for Main...
var log = loggingService.getLogger("PluginLoader", "trace");
var ariEvents = AriEventEmitter.getInstance();

export default class PluginLoader{
    pluginsPath = __dirname + "/plugins";
    pluginInfos: any = {};
    
    constructor(){
        log.debug("Starting PluginLoader.");
        this.LoadPluginInfo();
        ariEvents.on("pluginLoader.newPluginInfo",(pluginInfo)=>{
            log.trace("New plugin detected.");
            this.LoadPlugin(pluginInfo);
        });
    }

    LoadPluginInfo(){
        return new Promise((resolve, reject)=>{
            var self = this;
            fs.readdir(this.pluginsPath, (err, files)=>{
                if (err) { reject(Error("Path to plugins not found.")); }
            
                files.forEach((dir)=>{
                    fs.stat(self.pluginsPath + "/" + dir, (error, stat)=>{
                        if (stat && stat.isDirectory()) {
                            // We found sub-dir of plugins dir.
                            // Read manifest.
                            fs.readFile(self.pluginsPath + "/" + dir + "/" + "package.json", (err, data)=>{
                                try { var manifest = JSON.parse(data) } catch (e) { log.warn(e); return; }
                                if (manifest) {
                                    // Manifest available...
                                    if (manifest.AriPluginInfo) {
                                        manifest.AriPluginInfo.pluginPath = self.pluginsPath + "/" + dir;
                                        if(!manifest.AriPluginInfo.debugFilePath) manifest.AriPluginInfo.debugFilePath = manifest.AriPluginInfo.pluginPath;
                                         
                                        self.pluginInfos[dir] = manifest.AriPluginInfo;
                                        ariEvents.emit("pluginLoader.newPluginInfo", manifest.AriPluginInfo);
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

    LoadPlugin(plugin){
        if (!(plugin.name && plugin.main)) {
            log.error("Error in configuration file when loading plugin.");
            return;
        }
        log.info("Loading plugin:", plugin.name);
       
        // Child will use parent's stdios
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

        ariEvents.emit("pluginLoader.pluginLoaded", plugin.name);
    }
}
