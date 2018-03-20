import AriWsClient from "../../common/AriWsClient"

export default {
    install: function (Vue, name = "$ari") {
        Object.defineProperty(Vue.prototype, name, { value: new AriWsClient() });
    }
}