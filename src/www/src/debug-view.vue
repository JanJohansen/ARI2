<template>
  <div>
    <h1>ARI model:</h1>
    <textarea rows="10" cols="80" v-model="test">
    </textarea>
    <button @click="get()" >Click me!</button>
    <br>
    <b-card header="ARI model" no-body border-variant="secondary" style="display: inline-block;">
      <json-tree-row name="ARI" :prop=remoteModel :level="0"></json-tree-row>
    </b-card>
  </div>
</template>

<script>
import JsonTreeRow from "./JsonTreeRow";

export default {
  name: "debug-view",
  components: {
    JsonTreeRow
  },
  data() {
    return {
      test: {},
      remoteModel: {}
    };
  },
  methods: {
    get: function() {
      this.$ari.call("Services.Flow.get42", null).then(
        val => {
          this.test = val;
        },
        err => {
          this.test = err;
        }
      );
    },
    deepMerge(source, target) {
      for (var prop in source) {
        if (!prop.startsWith("__")){
          if (typeof source[prop] === "object" && source[prop] !== null) {
            this.$set(target, prop, target[prop] || {});  // Create if not exists
            this.deepMerge(source[prop], target[prop]);
          } else {
            target[prop] = source[prop];
          }
        }
      }
    }
  },
  computed: {
    jsonString() {
      return JSON.stringify(
        this.remoteModel,
        (prop, val) => {
          return prop.startsWith("__") ? undefined : val;
        },
        2
      );
    }
  },
  created() {
    var self = this;
    // Trick!
    self.remoteModel = self.$ari.remoteModel;

    // Subscribe to needed propoerty notifications.
    var time = 1;
    var a = self.$ari.remoteModel.on("out", evt => {
      console.log("RemoteModel Event:", evt);
      var ro = evt.source;
      self.$set(ro, "__value", evt.value); //Hack to prevent enless loop when setting value, leading to emitted oSet, leading to here again!
      while (ro && ro.__parent) {
        if (!("__ob__" in ro)) {
          // HACK: Non-reactive object indicated by "__ob__"...
          // HACK: Temporarily remove property from objectmodel to make vue think it adds a new object that needs to be reactive-ated. This will only be done once.
          var tmp = ro;
          delete ro.__parent[ro.name];
          self.$set(ro.__parent, ro.name, tmp);
        }
        ro = ro.__parent;
      }
    });

    self.$ari.remoteModel.on("clientInfo", evt => {
      console.log("clientInfo:", evt.value);
      // Buid eventtree to match clientInfo.
      self.$set(
        self.$ari.remoteModel.Clients,
        "Test",
        self.$ari.remoteModel.Clients.addChild("Test")
      );
      self.deepMerge(evt.value, self.$ari.remoteModel);
    });
  }
};
</script>

<style>

</style>
