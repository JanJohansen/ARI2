//import { Aqara } from "lumi-aqara/src";
import AriTcpClient from "../common/AriTcpClient";

const Aqara = require("lumi-aqara")

export default class XiaomiGW {
    devices: { [sid: string]: { sid: string, batterylevel?: number, type: string, value?: any } } = {};
    ari;
    constructor() {
        var self = this;

        var ari = new AriTcpClient("XiaomiGW");
        ari.onLocal("ready", () => {
            const aqara = new Aqara()
            aqara.on("raw", (msg) => {
                console.log("XiaomiRAW:", JSON.stringify(msg, null, 2));
            });

            aqara.on('gateway', (gateway) => {
                console.log('Gateway discovered')
                gateway.on('ready', () => {
                    console.log('Gateway is ready')
                    gateway.setPassword('vuxjtrix09m1eii2')
                    gateway.setColor({ r: 100, g: 100, b: 30 })
                    gateway.setIntensity(100)

                    ari.emitLocal("connected", true);
                });

                gateway.on('offline', () => {
                    gateway = null
                    console.log('Gateway is offline')
                    ari.emitLocal("connected", false);
                });

                gateway.on('subdevice', (device) => {
                    console.log('New device')
                    console.log(`  Battery: ${device.getBatteryPercentage()}%`)
                    console.log(`  Type: ${device.getType()}`)
                    console.log(`  SID: ${device.getSid()}`)

                    var sid = device.getSid();
                    this.devices[sid] = { sid: sid, batterylevel: device.getBatteryPercentage(), type: device.getType() };

                    switch (device.getType()) {
                        case 'magnet':
                            console.log(`  Magnet (${device.isOpen() ? 'open' : 'close'})`)
                            device.on('open', () => {
                                var sid = device.getSid();
                                console.log(`${device.getSid()} is now open`)

                            })
                            device.on('close', () => {
                                var sid = device.getSid();
                                console.log(`${device.getSid()} is now close`)
                            })
                            break
                        case 'switch':
                            console.log(`  Switch`)
                            device.on('click', () => {
                                var sid = device.getSid();
                                console.log(`${device.getSid()} is clicked`)
                            })
                            device.on('doubleClick', () => {
                                var sid = device.getSid();
                                console.log(`${device.getSid()} is double clicked`)
                            })
                            device.on('longClickPress', () => {
                                var sid = device.getSid();
                                console.log(`${device.getSid()} is long pressed`)
                            })
                            device.on('longClickRelease', () => {
                                var sid = device.getSid();
                                console.log(`${device.getSid()} is long released`)
                            })
                            break
                        case 'motion':
                            console.log(`  Motion (${device.hasMotion() ? 'motion' : 'no motion'})`)
                            device.on('motion', () => {
                                var sid = device.getSid();
                                console.log(`${device.getSid()} has motion${device.getLux() !== null ? ' (lux:' + device.getLux() + ')' : ''}`)
                            })
                            device.on('noMotion', () => {
                                var sid = device.getSid();
                                console.log(`${device.getSid()} has no motion (inactive:${device.getSecondsSinceMotion()}${device.getLux() !== null ? ' lux:' + device.getLux() : ''})`)
                            })
                            break
                        case 'sensor':
                            console.log(`  Sensor (temperature:${device.getTemperature()}C rh:${device.getHumidity()}%${device.getPressure() != null ? ' pressure:' + device.getPressure() + 'kPa' : ''})`)
                            device.on('update', () => {
                                var sid = device.getSid();
                                console.log(`${device.getSid()} temperature: ${device.getTemperature()}C rh:${device.getHumidity()}%${device.getPressure() != null ? ' pressure:' + device.getPressure() + 'kPa' : ''}`)
                            })
                            break
                        case 'leak':
                            console.log(`  Leak sensor`)
                            device.on('update', () => {
                                var sid = device.getSid();
                                console.log(`${device.getSid()}${device.isLeaking() ? '' : ' not'} leaking`)
                            })
                            break
                        case 'cube':
                            console.log(`  Cube`)
                            device.on('update', () => {
                                var sid = device.getSid();
                                console.log(`${device.getSid()} ${device.getStatus()}${device.getRotateDegrees() !== null ? ' ' + device.getRotateDegrees() : ''}`)
                            })
                            break
                    }
                });
                gateway.on('lightState', (state) => {
                    console.log(`Light updated: ${JSON.stringify(state)}`)
                })
            });
        });
    }
    sendDeviceUpdate(sid) {
        this.ari.emitLocal([device.getType(), device.getSid(), ".battery"], device.getBatteryPercentage());
    }
}

