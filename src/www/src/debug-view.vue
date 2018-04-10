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
        if (!prop.startsWith("__")) {
          if (typeof source[prop] === "object" && source[prop] !== null) {
            this.$set(target, prop, target[prop] || {}); // Create if not exists
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

    self.$ari.onLocal("ready", function(){
      // Subscribe to needed propoerty notifications.
      var time = 1;
      var a = self.$ari.on("**.out", function(args) {
        console.log(this.event, "=", args);

        var path = this.event.split(".");
        var o = self.remoteModel;
        while (path.length > 0) {
          let prop = path.shift();
          if(!(prop in o)) self.$set(o, prop, {});
          o = o[prop];
        }
        self.$set(o, "__value", args);
      });

      // self.$ari.on("*.clientInfo", function(args) {
      //   console.log("clientInfo:", args);
      //   // Buid eventtree to match clientInfo.
      //   // self.$set(
      //   //   self.$ari.remoteModel.Clients,
      //   //   "Test",
      //   //   self.$ari.remoteModel.Clients.addChild("Test")
      //   // );
      //   // self.deepMerge(evt.value, self.$ari.remoteModel);
      // });
    });
  }
};
</script>

<style>

</style>
