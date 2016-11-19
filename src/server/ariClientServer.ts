import {EventEmitter} from 'events';

export default class ariClientServer extends EventEmitter {

    constructor() {
        super();
        this.emit("send", '"{"mcd":"HELLO"}');
    }

    handleMessage(msg: string) {

    }

    handleDisconnect() {

    }
}