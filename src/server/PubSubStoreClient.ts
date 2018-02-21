import PubSubStore from "../common/PubSubStore";

export default class PubSubStoreClient extends PubSubStore {
    public onSend: (...args)=>void;
    private _clientInfoTimer;

    constructor() {
        super();

        this.onSend = (...args)=>{
            console.log("PubSubStoreClient->:", ...args);
        }
    }

    // CLIENT!
    sub(name, cb) {
        if (name.startsWith(":")) {
            var remoteName = name.subString(1);
            this.onSend("sub", remoteName);
            return super.sub(name, cb);
        }
        else super.sub(name, cb);
        this._checkClientInfoUpdate(); 
    }

    public _remote_sub(name) {
        return super.sub(name, this.remoteSubsCB);
    }

    //-------------
    pub(name, value) {
        super.pub(name, value);
        this._checkClientInfoUpdate(); 
    }

    public _remote_pub(name, value) {
        this.pub(":" + name, value);
    }

    //-------------
    unsub(name, cb) {
        if (name.startsWith(":")) {
            var listeners = this.getListeners(name);
            if(listeners.length == 1) {
                // We will remove the last listener to the remote topic...
                var remoteName = name.subString(1);
                this.onSend("unsub", remoteName);
            }

            super.unsub(name, cb);
        }
        else super.unsub(name, cb);
        
        this._checkClientInfoUpdate(); 
    }

    public _remote_unsub(name) {
        return this.unsub(name, this.remoteSubsCB);
    }

    //-------------
    //public _remote_setAttributes(name, attributes) {}

    //-------------
    private remoteSubsCB(value, name) {
        this.onSend("pub", name, value);
    }

    private _checkClientInfoUpdate(){
        if(this.pubSubTreeUpdated){
            var self = this;
            if(!this._clientInfoTimer){
                this._clientInfoTimer = setTimeout(() => {
                    self._clientInfoTimer = null;
                    self.sendClientInfo();
                }, 10);
            }
        }
    }

    sendClientInfo(){
        this.pubSubTreeUpdated = false;
        // Publish local pubsubtree or special message for server?
        this.onSend("clientInfo or pubs?");
    }
}