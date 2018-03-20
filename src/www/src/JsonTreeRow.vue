<template>
  <div>
    <div v-if="isObject" class="json-tree-row" style="font-weight: bold"  @click="toggleChildren" >
      {{ name }}: 
    </div>
    <div :style="{'margin-left':'20px'}" v-if="showChildren" >
      <json-tree-row 
        v-for="(value, name) in prop" :key="name" 
        v-if="typeof(value) == 'object' && !name.startsWith('__')" 
        :name=name 
        :prop=value 
        :level="level + 1"
      />
    </div>
    <div v-if="!isObject" class="json-tree-row" style="font-weight: normal">
      {{ name }} = {{ prop.__value }} <span style="opacity:0.3; font-size:50%">@ {{ prop.ts }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "json-tree-row",
  props: ["name", "prop", "level"],
  data() {
    return {
      showChildren: true
    };
  },
  computed: {
    indent() {
      return { transform: `translate(${this.level * 20}px)` };
    },
    isObject() {
      if(this.prop && ("__value" in this.prop)) return false;
      else return true;
    }
  },
  methods: {
    toggleChildren() {
      this.showChildren = !this.showChildren;
    }
  }
};
</script>

<style>
/*#app {
  font-family: "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1,
h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}*/
</style>
