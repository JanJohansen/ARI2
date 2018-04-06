<template>
  <div>
    <div class="menu">
      <div
        v-for="(item, index) in items" :key="item.text" 
        @mouseenter="mouseEnter(item, index, $event)"
        @click="click(item, index, $event)"
      >
        <span class="menuItem">
          {{item.text}}
          <span v-if="item.subMenu">
            &nbsp;&raquo;
          </span>
        </span>
      </div>
    </div>      
    <div 
      class="subMenu"
      v-if="selectedItem" 
      :style="subMenuStyle"
    >
      <flow-tree-menu-item
        :items="selectedItem.subMenu"
        ref="selectedRef">
      >
      </flow-tree-menu-item>
    </div>      
  </div>
</template>

<script>
export default {
  name: "flow-tree-menu-item",
  props: ["items"],
  mounted: function() {},
  data() {
    return {
      expanded: false,
      selectedItem: null,
      selectedIndex: -1,
      selectedElement: null
    };
  },
  computed: {
    hasSubMenu() {
      return this.item.subMenu != undefined;
    },
    subMenuStyle() {
      return {
        top: this.selectedElement.clientHeight * this.selectedIndex + "px",
        left: this.$el.clientWidth - 2 + "px"
      };
    }
  },
  mounted: function(){
    console.log("MOUNTED!");
  },
  beforeUpdate: function(){
    if(this.$refs.selectedRef) this.$refs.selectedRef.selectedItem = null;
  },
  methods: {
    mouseEnter(itemRef, index, evt) {
      if(itemRef.subMenu) {
        this.selectedItem = itemRef;
        this.selectedIndex = index;
        this.selectedElement = evt.target;
      }
    },
    click(itemRef, index, evt) {
        // Final menu selection done.
        var path = itemRef.text;
        var p = this.$parent;
        while(p && p.selectedItem && p.selectedItem.text){
          path = p.selectedItem.text + "." + path;
          p.$emit("menuSelected", {path: path});
          p = p.$parent;
        }
        console.log("MENU:", path);
      
      // this.$set(this.item, "expanded", !this.item.expanded);
      // if (this.$parent && this.$parent.subMenu) {
      //   this.$parent.subMenu.forEach(item => {
      //     if(item != this.item) item.expanded = false;
      //   });
      // }
      //this.dispatchEvent({ name: "click", path: this.item.text });
    },
    dispatchEvent(evt) {
      //if (evt.name == "click") this.expandSub = true;
      //if (this.parent) this.parent.dispatchEvent(this.item.text + path);
    }
  }
};
</script>

<style>
.menu {
  display: block;
  position: static;
  background: white;
  border: 1px solid grey;
}
.menuItem {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  background: white;
  padding: 1px 5px 1px 5px;  
}
.menuItem:hover {
  background: lightgrey;
}

.subMenu {
  display: block;
  position: absolute;
  background: darkgray;
}
</style>
