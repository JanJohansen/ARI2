import Vue from 'vue'
import VueRouter from "vue-router"
import App from './App.vue'

import BootstrapVue from 'bootstrap-vue'
import "bootstrap/dist/css/bootstrap.min.css"
import "bootstrap-vue/dist/bootstrap-vue.css"
import * as VueMenu from '@hscmap/vue-menu'

import AriClient from "./AriClient"

import LoginPage from "./loginPage"
import DebugView from "./debug-view"
import FlowPage from "./Flow"

Vue.use(VueRouter);
Vue.use(BootstrapVue);
Vue.use(VueMenu);
Vue.use(AriClient, "$ari");

const router = new VueRouter({
  mode: 'history',
  base: __dirname,
  routes: [
    { path: '/', component: DebugView },
    { path: '/login', component: LoginPage },
    { path: '/flow', component: FlowPage },
    //{ path: '/bar', component: Bar }
  ]
})

var singleSourceOfTruth = {};

new Vue({
  router,
  el: '#app',
  render: h => h(App),
  data: singleSourceOfTruth // this can be accesses as $root.$data by all child components.
})
