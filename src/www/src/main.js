import Vue from 'vue'
import App from './App.vue'
import AriClient from "./AriClient"

Vue.use(AriClient, "$ari");

new Vue({
  el: '#app',
  render: h => h(App)
})
