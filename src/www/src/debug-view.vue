<template>
  <div>
    <h1>ARI model: {{ test.test.time }}</h1>
    <textarea rows="10" cols="80" v-model="jsonString">
    </textarea>
    <br>
    <json-tree-row name="ARI" :prop=remoteModel :level="0"></json-tree-row>
  </div>
</template>

<script>
import JsonTreeRow from "./JsonTreeRow";

export default {
  name: "debug-view",
  data() {
    return {
      test: {},
      remoteModel: {}
    };
  },
  computed: {
    jsonString(){
      return JSON.stringify(this.remoteModel, (prop, val)=>{
          return prop.startsWith('__') ? undefined : val
        }, 2);
    }
  },
  components: {
    JsonTreeRow
  },
  created() {
    var self = this;
    // Trick!
    //self.remoteModel.model = self.$ari.remoteModel;
    //this.$set(self.remoteModel, "model", self.$ari.remoteModel);

    self.test = {test: {get time(){return time}, set time(v){time = v}}};
    self.remoteModel = self.$ari.remoteModel;

    // Subscribe to needed propoerty notifications.
    var time = 1;
    var a = self.$ari.remoteModel.on("oSet", evt => {
      console.log("RemoteModel Event:", evt);
      this.test.test.time++;
      //this.$set(this.test, "time", time++);
      //this.$set(self.remoteModel, "model", self.$ari.remoteModel);
      var path = self.$ari.remoteModel.pathToHere(evt.target).split(".");
      var ro = self.$ari.remoteModel;
      while (path.length) {
        let pp = path.shift();
        if (!("__ob__" in ro[pp])) { 
          // HACK: If not already a reactive object indicated by "__ob__"...
          // HACK: Temporarily remove property from objectmodel to make vue think it adds a new object that needs to be reactive-ated. This will only be done once.
          var tmp = ro[pp];
          delete ro[pp];
          self.$set(ro, pp, tmp); //obj = {};
        }
        ro = ro[pp];
      }
      //self.$set(obj, "__value", evt.value); //Hack to prevent enless loop when setting value, leading to emitted oSet, leading to here again!
    });
  }
};
</script>

<style>

</style>
