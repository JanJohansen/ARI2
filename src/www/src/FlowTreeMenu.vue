<template>
  <div>
    <div
      class="menuItem"
      @mouseenter="expandSub = true;"
    >
      {{ item.text }} 
      <span v-if="item.subMenu">
        &gt;
      </span>
    </div>
    <div 
      class="subMenu"
      v-if="expandSub" 
      @mouseout="expandSub = false;"
    >
      <div v-for="subItem in item.subMenu" :key="subItem.text">
        <flow-tree-menu :item="subItem">

        </flow-tree-menu>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: "flow-tree-menu",
  props: ["item"],
  mounted: function(){
  },
  data() {
    return {
      expandSub: false
    };
  },
  computed: { },
  methods: { }
};

</script>

<style>
.menuItem{
  display: inline-block;
}
.subMenu{
  background: darkgray;
  border: 5px solid red;
  float: right;
}
</style>
