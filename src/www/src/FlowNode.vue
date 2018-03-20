<template>
    <g 
        :transform="'translate(' + node.x + ',' + node.y + ')'"  
    >
        <defs>
            <linearGradient 
                spreadMethod="pad" 
                y2="0" 
                x2="0" 
                y1="1" 
                x1="0" 
                id="nodeBackgroundGradient"
            >
                <stop offset="0" stop-color="#dddddd" />
                <stop offset="0.6" stop-color="#f7f7f7" />
            </linearGradient>
        </defs>
        <svg:rect 
            @mousedown.prevent="mouseDown($event)"
            class="node-rect"
            ry="5" 
            rx="5" 
            x="0" 
            y="0" 
            :width="width" 
            :height="height" 
            fill="url(#nodeBackgroundGradient)" 
        />
        <text
            ref="svgTextHeading"
            class="node-name-text"
            :x="width/2"
            y="3"
            text-anchor="middle"
            dominant-baseline="hanging"
        >
            {{node.type}}
        </text>

        <g v-for="(input, name, i) in node.ins" :key="'in_'+name"
            @mousedown.stop.prevent="inputMouseDown($event, i)"
            @mouseup.stop.prevent="inputMouseUp($event, i)"
        >
            <circle
                class="port-circle"
                r=10 
                cx=0
                :cy="35 + i * 25"
            />
            <text 
                ref="inTexts"
                class="node-port-text"
                dominant-baseline="central"
                x=15
                :y="35 + i * 25"
            >
                {{ name }}
            </text>
        </g>

        <g v-for="(output, name, i) in node.outs" :key="'out_'+name"
            @mousedown.stop.prevent="outputMouseDown($event, i)"
            @mouseup.stop.prevent="outputMouseUp($event, i)"
        >
            <circle
                class="port-circle"  
                r=10 
                :cx="width"
                :cy="35 + i * 25"
            />
            <text 
                ref="outTexts"
                class="node-port-text"
                dominant-baseline = "central"
                text-anchor = "end"
                :x="width - 15"
                :y="35 + i * 25"
            >
                {{ name }}
            </text>
        </g>
    </g>
</template>

<script>
export default {
  name: "flowit-node",
  props: ["node", "newconnection"],
  data() {
    return {
      dragging: false,
      width: 100
    };
  },
  mounted: function() {
    // ------------------------------------------------------------------------
    // Calculate with based on texts in node.
    var widths = [];
    widths.push(this.$refs.svgTextHeading.getBBox().width);

    if(this.$refs.inTexts) {
        this.$refs.inTexts.forEach(el => {
            widths.push(el.getBBox().width + 15);
        });
    }
    var idx = 1;
    if(this.$refs.outTexts){
        this.$refs.outTexts.forEach(el => {
            if(!widths[idx]) widths[idx] = 0;
            widths[idx++] += el.getBBox().width + 15;
        });
    }
    var maxWidth = 0;
    for(let w in widths) {
      if (widths[w] > maxWidth) maxWidth = widths[w];
    };

    this.width = maxWidth + 15;
    this.$set(this.node, "__width", this.width); // Update node to allow width to be used in sibbling elements (connections etc.)
  },
  computed: {
    height() {
      return (
        Math.max(
          Object.keys(this.node.ins).length,
          Object.keys(this.node.outs).length
        ) *
          25 +
        30
      );
    }
  },
  components: {},
  created() {},
  methods: {
    mouseDown(evt) {
      evt.stopPropagation();
      //console.log("MouseDown:, ", event);
      window.addEventListener("mousemove", this.mouseMove);
      window.addEventListener("mouseup", this.mouseUp);
      this.dragging = true;
      var pos = this.cursorPoint(evt);
      this.nodeStartX = pos.x - this.node.x;
      this.nodeStartY = pos.y - this.node.y;
    },
    mouseMove(evt) {
      evt.stopPropagation();
      //console.log("MouseMove:, ", event);
      if (this.dragging) {
        //console.log("nodeMouseMove:", event);
        var pos = this.cursorPoint(evt);
        this.node.x = pos.x - this.nodeStartX;
        this.node.y = pos.y - this.nodeStartY;
        if (true) {
          this.node.x -= this.node.x % 12.5;
          this.node.y -= this.node.y % 12.5;
        }
      }
    },
    mouseUp(evt) {
      evt.stopPropagation();
      //console.log("MouseUp:, ", event);
      window.removeEventListener("mousemove", this.mouseMove);
      window.removeEventListener("mouseup", this.mouseUp);
      this.dragging = false;
    },
    //-------------------------------------------------------------------------
    // Helpers
    //-------------------------------------------------------------------------
    // Get point in global SVG space
    cursorPoint(evt) {
      if (!this.svg) this.svg = evt.target.ownerSVGElement; // Cache the svg element!
      var pt = this.svg.createSVGPoint();
      pt.x = evt.clientX;
      pt.y = evt.clientY;
      var ctm = this.svg.getScreenCTM();
      return pt.matrixTransform(ctm.inverse());
    },
    //-------------------------------------------------------------------------
    // New connection handling
    inputMouseDown(evt, i) {
      this.newconnection.inNode = this.node;
      this.newconnection.inIdx = i;
      this.newconnection.dragpos = this.cursorPoint(evt);
      window.addEventListener("mousemove", this.newConnectorMouseMove);
      window.addEventListener("mouseup", this.newConnectorMouseUp);
    },
    inputMouseUp(evt, i) {
      if (this.newconnection && this.newconnection.outNode) {
        var outName = Object.keys(this.newconnection.outNode.outs)[
          this.newconnection.outIdx
        ];
        var inName = Object.keys(this.node.ins)[i];
        console.log(
          "New connection:",
          this.newconnection.outNode.type + "." + outName,
          this.node.type + "." + inName
        );
        this.$emit("onnewconnection", {
          outNode: this.newconnection.outNode.nid,
          outName: outName,
          inNode: this.node.nid,
          inName: inName
        });
      }
      this.newconnection.inNode = null;
      this.newconnection.outNode = null;
      window.removeEventListener("mousemove", this.newConnectorMouseMove);
      window.removeEventListener("mouseup", this.newConnectorMouseUp);
    },
    outputMouseDown(evt, i) {
      this.newconnection.outNode = this.node;
      this.newconnection.outIdx = i;
      this.newconnection.dragpos = this.cursorPoint(evt);
      window.addEventListener("mousemove", this.newConnectorMouseMove);
      window.addEventListener("mouseup", this.newConnectorMouseUp);
    },
    outputMouseUp(evt, i) {
      if (this.newconnection && this.newconnection.inNode) {
        var inName = Object.keys(this.newconnection.inNode.ins)[
          this.newconnection.inIdx
        ];
        var outName = Object.keys(this.node.outs)[i];
        console.log(
          "New connection:",
          this.node.type + "." + outName,
          this.newconnection.inNode.type + "." + inName
        );
        this.$emit("onnewconnection", {
          outNode: this.node.nid,
          outName: outName,
          inNode: this.newconnection.inNode.nid,
          inName: inName
        });
      }
      this.newconnection.inNode = null;
      this.newconnection.outNode = null;
      window.removeEventListener("mousemove", this.newConnectorMouseMove);
      window.removeEventListener("mouseup", this.newConnectorMouseUp);
    },
    newConnectorMouseMove(evt) {
        evt.stopPropagation();
      this.newconnection.dragpos = this.cursorPoint(evt);
    },
    newConnectorMouseUp() {
      this.newconnection.inNode = null;
      this.newconnection.outNode = null;
      window.removeEventListener("mousemove", this.newConnectorMouseMove);
      window.removeEventListener("mouseup", this.newConnectorMouseUp);
    }
  }
};
</script>

<style>
.node-rect {
  stroke: black;
  stroke-width: 1;
  cursor: move;
}

.mouseover-node-rect {
  stroke-width: 3;
}

.selected-node-rect {
  stroke: red;
  stroke-width: 3;
}

.node-name-text {
  font-weight: bold;
  fill: blue;
  text-decoration: underline;
  pointer-events: none;
}

.node-port-text {
  pointer-events: none;
}

.port-circle {
  fill: white;
  stroke: grey;
  stroke-width: 0.5;
  
  cursor: pointer;
}

.port-circle:hover {
  fill: white;
  stroke: black;
  stroke-width: 3;
}
</style>
