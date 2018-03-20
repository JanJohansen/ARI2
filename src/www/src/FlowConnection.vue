<template>
    <path
        :class="{'connection': true, 'selected': selected}"
        :d="connectionPath"
        tabindex="-1"
        @mousedown.prevent="mouseDown($event)"
    >
    </path>
</template>

<script>
export default {
    name: "flow-connection",
    props: ["connection", "nodes"],
    data() {
        return {
            selected: false
        };
    },
    computed: {
          connectionPath() {
              // Find nodes
              var outNode = this.nodes[this.connection.outNode];
              var inNode = this.nodes[this.connection.inNode];
              if(!outNode || !inNode) return; // error - ignore.

              // Find port indexes.
              var outIdx = Object.keys(outNode.outs).indexOf(this.connection.outName);
              var inIdx = Object.keys(inNode.ins).indexOf(this.connection.inName);
              if(outIdx == undefined || inIdx == undefined) return; // error - ignore.

              // Create path.
              var d = "M " + (outNode.x + (outNode.__width || 100) + 10) + "," + (outNode.y + 35 + outIdx * 25) +
                  " C " + (outNode.x + (outNode.__width || 100)  + 10 + 50) + "," + (outNode.y + 35 + outIdx * 25) +
                  " " + (inNode.x - 10 - 50) + "," + (inNode.y + 35 + inIdx * 25) +
                  " " + (inNode.x - 10) + "," + (inNode.y + 35 + inIdx * 25);
              return d;
          }
    },
    components: {},
    created() {},
    methods: {
        mouseDown(evt) {
            //console.log("MouseDown:, ", event);
            if(!this.selected) window.addEventListener("mousedown", this.mousedownHandler);
            this.selected = true;
            evt.stopPropagation();
            evt.preventDefault();
        },

        mousedownHandler(evt){
            //console.log("ExtMouseDown:, ", event);
            this.selected = false;
            window.removeEventListener("mousedown", this.mousedownHandler);
            evt.stopPropagation();
            evt.preventDefault();
        },
        //*************************************************************************
        // Helpers
        //*************************************************************************
        // Get point in global SVG space
        cursorPoint(evt) {
            //var pt = evt.target.farthestViewportElement.createSVGPoint();
            var pt = evt.target.ownerSVGElement.createSVGPoint();
            pt.x = evt.clientX;
            pt.y = evt.clientY;
            //var ctm = evt.target.farthestViewportElement.getScreenCTM();
            var ctm = evt.target.ownerSVGElement.getScreenCTM();
            return pt.matrixTransform(ctm.inverse());
        },
    }
};
</script>

<style scope>
.connection {
  stroke: gray;
  stroke-width: 4;
  fill: transparent;
}

.connection:hover {
  stroke: blue;
  stroke-width: 6;
  fill: transparent;
}

.selected {
  stroke: red;
  stroke-width: 6;
  fill: transparent;
}

.selected:hover {
  stroke: red;
  stroke-width: 6;
  fill: transparent;
}
</style>
