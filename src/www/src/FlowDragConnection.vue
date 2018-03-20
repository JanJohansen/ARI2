<template>
    <path
        :class="{'connection': true}"
        :d="connectionPath"
        tabindex="-1"
        @mousedown="mouseDown($event)"
    >
    </path>
</template>

<script>
export default {
    name: "flow-drag-connection",
    props: ["newconnection"],
    data() {
        return {
        };
    },
    computed: {
        connectionPath() {
            if(this.newconnection.inNode){
              // Dragging new connection from an input port.
              var inNode = this.newconnection.inNode;
              var inIdx = this.newconnection.inIdx;
              var dragpos = this.newconnection.dragpos;

              // Create path.
              var d = "M " + (dragpos.x + 10) + "," + dragpos.y +
                  " C " + (dragpos.x + 10 + 50) + "," + dragpos.y +
                  " " + (inNode.x - 10 - 50) + "," + (inNode.y + 35 + inIdx * 25) +
                  " " + (inNode.x - 10) + "," + (inNode.y + 35 + inIdx * 25);
              return d;
            } else if(this.newconnection.outNode){
              // Dragging new connection from an output port.
              var outNode = this.newconnection.outNode;
              var outIdx = this.newconnection.outIdx;
              var dragpos = this.newconnection.dragpos;

              // Create path.
              var d = "M " + (outNode.x + outNode.__width + 10) + "," + (outNode.y + 35 + outIdx * 25) +
                " C " + (outNode.x + outNode.__width + 10 + 50) + "," + (outNode.y + 35 + outIdx * 25) +
                " " + (dragpos.x - 10 - 50) + "," + dragpos.y +
                " " + (dragpos.x - 10) + "," + dragpos.y;
              return d;
            } 
            return null;
        }
    },
    components: {},
    created() {
    },
    methods: {
    }
};
</script>

<style scoped>
.connection {
    stroke: red;
    stroke-width: 6;
    fill: transparent;
    pointer-events: none;
}

</style>
