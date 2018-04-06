<template>
    <div 
        class="editor" 
    >
        <!-- FIXME: embed contextmenu and mousedown in context-meny element-->
        <context-menu ref="contextmenu">
            <flow-tree-menu-item 
                :items="contextMenu.subMenu" 
                ref="rootMenu"
                @menuSelected="contextmenuSelected"
            />
        </context-menu>
        <svg
            class="svgCanvas"
            ref="svgCanvas"
            @mousewheel.prevent="zoom($event)"
            :viewBox="viewBox" 
            tabindex='1'
            preserveAspectRatio="xMinYMin meet"
            @mousedown.left="mouseDown($event); $refs.contextmenu.close();"
            @click.right.prevent.stop="$refs.contextmenu.open($event); $refs.rootMenu.selectedItem = null;"
        >
            <flow-node 
                v-for="(value, name) in nodes" :key="name" 
                :node="value" 
                :newconnection="newconnection"
                @onnewconnection="newConnection($event)"
            />
            <flow-connection 
                v-for="(value, name) in connections" :key="name" 
                :connection="value" 
                :nodes="nodes"
            />
            <flow-drag-connection v-if="true" :newconnection="newconnection"/>

            <!-- New connection 
            <svg:path *ngIf="flow._newConnection"
                class="dragging-connection-line"
                [attr.d]= "getNewConnectionPath(flow._newConnection.x1, flow._newConnection.y1, flow._newConnection.x2, flow._newConnection.y2)"
            >
            </svg:path>-->

        </svg>
    </div>
</template>

<script>
import FlowNode from "./FlowNode";
import FlowConnection from "./FlowConnection";
import FlowDragConnection from "./FlowDragConnection";
import ContextMenu from "./ContextMenu";
import FlowTreeMenu from "./FlowTreeMenu";
import FlowTreeMenuItem from "./FlowTreeMenuItem";


export default {
    name: "flow-page",
    data() {
        return {
            nodes: {
                nid1: {
                    nid: "nid1",
                    type: "MySGW.Device",
                    x: 50,
                    y: 10,
                    ins: {
                    },
                    outs: {
                        motion: {type: "oBoolean"},
                    }
                },
                nid2: {
                    nid: "nid2",
                    type: "HueGW.Lamp",
                    x: 300,
                    y: 10,
                    ins: {
                        brightness: { type: "iValue" },
                        colorTemp: { type: "oNumber" }
                    },
                    outs: {
                        brightness: { type: "oValue" },
                        colorTemp: { type: "oNumber" }
                    },
                    settings: {

                    }
                },
                nid3: {
                    nid: "nid3",
                    type: "Graph Input",
                    x: 550,
                    y: 10,
                    ins: {
                    },
                    outs: {
                        "name": {}
                    },
                    settings: {
                        
                    }
                }
            },
            connections: [
                {
                    outNode: "nid1",
                    inNode: "nid2",
                    outName: "motion",
                    inName: "brightness"
                }
            ],
            newconnection: { inNode: null, outNode: null, inIdx: 0, outIdx: 0, dragpos: {x:0, y:0}},
            vBox: {x: 0, y: 0, w: 900, h: 500},
            dragging: false,
            dragstart: null,
            contextMenu: {
                root: true,
                subMenu: [
                    {
                        text: "Add function", 
                        subMenu: 
                        [
                            {
                                text: "Logic",
                                subMenu: [
                                    { text: "AND" },
                                    { text: "OR" },
                                    { text: "NOT" }
                                ]
                            },
                            {
                                text: "Math",
                                subMenu: [
                                    { text: "Add" }
                                ]
                            },
                            {
                                text: "Timing",
                                subMenu: [
                                    { text: "Ticker" },
                                    { text: "Delay" },
                                ]
                            },
                            {
                                text: "System",
                                subMenu: [
                                    { text: "Execute" }
                                ]
                            }
                        ]
                    }
                ]
            }
        };
    },
    components: {
        FlowNode,
        FlowConnection,
        FlowDragConnection,
        ContextMenu,
        FlowTreeMenu,
        FlowTreeMenuItem
    },
    created() {
        var self = this;
        this.$ari.on("ready", x=>{ // FIXME: How to handle if ari already connected?
            var nti = self.$ari.call("Clients.Flow.getNodeTypeInfo").then(nti=>{
                console.log("SUCCESS!!!! - Got nodeTypeInfo:", nti);
            }, err=>{
                console.log("ERROR in call getNodeTypeInfo!!!!", err);
            });
            var out = this.$ari.localModel.addOutput("WebFlowCounter", 41);
            out.v += 1;
            setTimeout(() => {
                out.v += 1;
            }, 2000);
            
        });
    },
    computed: {
        viewBox(){
            return this.vBox.x + " " + this.vBox.y + " " + this.vBox.w + " " + 10;//this.vBox.h;//"0 0 900 500";
        }
    },
    methods: {
        mouseDown(evt) {
            evt.preventDefault();   // Dont mark text etc.
            window.addEventListener("mousemove", this.mouseMove);
            window.addEventListener("mouseup", this.mouseUp);
            this.dragging = true;
            this.dragstart = {m: this.cursorPoint(evt), boxX: this.vBox.x, boxY: this.vBox.y};
            this.dragPos = this.cursorPoint(evt);
            
        },
        mouseMove(evt) {
            if(this.dragging){
                console.log(evt);
                var p = this.cursorPoint(evt);

                //this.vBox.x -= p.x - this.dragPos.x;
                this.vBox.x -= p.x - this.dragstart.m.x;
                this.vBox.y -= p.y - this.dragstart.m.y;
                //this.dragPos = this.cursorPoint(evt);

            }
        },
        mouseUp(evt) {
            window.removeEventListener("mousemove", this.mouseMove);
            window.removeEventListener("mouseup", this.mouseUp);
            this.dragging = false;
        },
        svgKeyDown(evt) {},
        newConnection(evt){
            console.log(evt);
            this.connections.push(evt);
        },
        // Get point in global SVG space
        cursorPoint(evt) {
            if(!this.svg) this.svg = evt.target;    // Cache the svg element!
            var pt = this.svg.createSVGPoint();
            pt.x = evt.clientX;
            pt.y = evt.clientY;
            var ctm = this.svg.getScreenCTM();
            return pt.matrixTransform(ctm.inverse());
        },
        zoom(evt){
            //console.log("Zooming:", evt, -evt.deltaY / 50);
            var factor = -evt.deltaY / 1500;
            if((factor > 0) && (this.vBox.w < 200)) return; // Limit zoom 
            if((factor < 0) && (this.vBox.w > 5000)) return; // Limit zoom 

            var m = this.cursorPoint(evt);
            let x = this.vBox.x;
            let y = this.vBox.y;
            let w = this.vBox.w;
            let h = this.$refs.svgCanvas.clientHeight / this.$refs.svgCanvas.clientWidth * w;
    
            var dx = (m.x - x) / w;
            this.vBox.w -= w*factor;
            this.vBox.x += dx * factor * w;

            var dy = (m.y - y) / h;
            this.vBox.y += dy * factor * h;
        },
        contextmenuSelected(evt){
            console.log("MENU!!!!:", evt);
        }
    }
};
</script>
<style>
.editor {
  background: lightgray;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
}
.svgCanvas {
  background: darkgray;
  margin: 0;
  flex: 1 1 auto;
}

.contextmenu {
  border-radius: 5px;
  background: slategrey;
  padding: 3px;
  border: 1px black solid;
}

.contextmenu li {
  list-style-position: inside;
}
</style>
