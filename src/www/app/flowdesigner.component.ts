import { Component, ElementRef } from '@angular/core';

@Component( {
    selector: "ariflowdesigner",
    styleUrls: ['app/flowdesigner.component.css'],
    template: `
    <svg:svg 
        viewBox="0 0 900 500" 
        preserveAspectRatio="xMidYMid meet"
        (mousedown)="svgMouseDown($event)"
        (mouse-wheel-up)="mouseWheelUp($event)"
        (mouse-wheel-down)="mouseWheelDown($event)"
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
                <stop offset="0.63934" stop-color="#f7f7f7" />
            </linearGradient>
        </defs>
        <svg:g *ngFor="let node of flow.nodes"
            (mousedown)="nodeMouseDown($event, node)"
            [attr.transform]="'translate(' + node.x + ',' + node.y + ')'"
        >
            <svg:rect 
                [attr.class]="'node-rect ' + (nodeSelected(node) && 'selected-node-rect') || (node == mouseOverNode && 'mouseover-node-rect')"
                ry="5" 
                rx="5" 
                x="0" 
                y="0" 
                [attr.width]="node.width" 
                [attr.height]="maxIOs(node) * 25 + 30" 
                fill="url(#nodeBackgroundGradient)" 
            />

            <svg:text
                class="node-name-text"
                [attr.x]="node.width/2"
                y="10"
                text-anchor="middle"
                alignment-baseline="middle"
            >
                {{node.name}}
            </svg:text>

            <svg:g *ngFor="let input of node.inputs; let i=index"
                (mousedown)="inputMouseDown($event, input)"
            >
                <svg:circle
                    [attr.class]="connector == mouseOverConnector && 'mouseover-connector-circle' || 'connector-circle'"
                    r=10 
                    cx=0
                    [attr.cy]="35 + i * 25"
                />
                <svg:text 
                    dominant-baseline="central"
                    x=15
                    [attr.y]=35+i*25
                >
                    {{input.name}}
                </svg:text>
            </svg:g>

            <svg:g *ngFor="let output of node.outputs; let i=index"
                (mousedown)="outputMouseDown($event, output)"
            >
                <svg:circle
                    [attr.class]="connector == mouseOverConnector && 'mouseover-connector-circle' || 'connector-circle'"
                    r=10 
                    [attr.cx]="node.width"
                    [attr.cy]="35 + i * 25"
                />
                <svg:text 
                    dominant-baseline="central"
                    text-anchor="end"
                    [attr.x]="node.width - 15"
                    [attr.y]=35+i*25
                >
                    {{output.name}}
                </svg:text>
            </svg:g>

        </svg:g>

        <!-- Connections 
        <svg:g *ngFor="let connection of flow.connections" >
            [attr.class]="{{connection.selected() && 'selected-connection-line' || (connection == mouseOverConnection && 'mouseover-connection-line' || 'connection-line')}}"
            <svg:path
                [attr.class]="'connection-line'"
                [attr.d]="getConnectionPath(connection)"
            ></svg:path>
        </svg:g>
        -->
        <template ngFor let-node [ngForOf]="flow.nodes">
            <template ngFor let-out [ngForOf]="node.outputs" let-oi="index">
                <template ngFor let-connection [ngForOf]="out.connect" let-i="index">
                    <svg:path
                        [attr.class]="'connection-line'"
                        [attr.d]= "getConnectionPath(node, out, connection, oi)"
                    >
                    </svg:path>
                </template>
            </template>
        </template>
    </svg:svg>
    `
})
export class FlowDesignerComponent { 
    flow = {
        nodes: [
            {name: "Node 1", x: 50, y: 50, width: 200, height: 100, selected: false, radius: 10,
                inputs: [
                    {name: "Input_1"}, 
                    {name: "I_2"}, 
                    {name: "I_3"}
                ],
                outputs: [
                    {
                        name: "O_1", 
                        connect:[
                            {
                                node:"Node 2", 
                                in:"I_1"
                            },
                            {
                                node:"Node 2", 
                                in:"I_2"
                            }
                        ]
                    }
                ]
            },
            {name: "Node 2", x: 300, y: 75, width: 200, height: 50, selected: false, radius: 20,
                inputs: [
                    {name: "I_1"},
                    {name: "I_2"}
                ],
                outputs: [
                    {name: "O_1"}
                ]
            }
        ]
    };

    el: ElementRef;
    nodeStartX: number;
    nodeStartY: number;
    dragging: boolean = false;
    dragginNode: any = null;
    mouseMoveHandler: any;
    mouseUpHandler: any;
    selectedNode: any = null;

    constructor(el: ElementRef) {
        this.el = el;
        this.mouseMoveHandler = this.nodeMouseMove.bind(this);
        this.mouseUpHandler = this.nodeMouseUp.bind(this);
    }
    
    logJSON(o: any) {
        console.log(o);
    }

    // Utility function calculating max of input and output count.
    maxIOs(node) {
        //return 3;
        if(node.inputs.length > node.outputs.length) return node.inputs.length;
        else return node.outputs.length;
    }

    nodeSelected(node){
        if(node == this.selectedNode) return true;
        else return false;
    }

    // Get point in global SVG space
	cursorPoint(evt){
//        var pt = evt.target.farthestViewportElement.createSVGPoint();
        var pt = this.el.nativeElement.firstElementChild.createSVGPoint();
	    
        pt.x = evt.clientX; 
        pt.y = evt.clientY;
        
        //var ctm = evt.target.farthestViewportElement.getScreenCTM();
        var ctm = this.el.nativeElement.firstElementChild.getScreenCTM();
        
		return pt.matrixTransform(ctm.inverse());
	}

    svgMouseDown(){
        this.selectedNode = null;
    }

    nodeMouseDown($event: MouseEvent, node) {
        console.log("nodeMouseDown:", $event, node);
        event.preventDefault();
        event.stopPropagation();    // Don't continue event

        this.selectedNode = node;

        var pos = this.cursorPoint($event);
        console.log("Pos:", pos);
        
        this.nodeStartX = pos.x - node.x;
        this.nodeStartY = pos.y - node.y;
        this.dragginNode = node;
        this.dragging = true;

        this.el.nativeElement.addEventListener('mousemove', this.mouseMoveHandler);
        this.el.nativeElement.addEventListener('mouseup', this.mouseUpHandler);

        //this.element.nativeElement.style.x = "5";
    }
    
    //@HostListener('document:mousemove', ['$event']) onMousemove(event) {
    nodeMouseMove(event: MouseEvent) {
        if(this.dragging){
            console.log("nodeMouseMove:", event);
            //event.stopPropagation();    // Don't continue event

            console.log("el:", this.el);

            var pos = this.cursorPoint(event);
            console.log("Pos:", pos);

            this.dragginNode.x = pos.x - this.nodeStartX;
            this.dragginNode.y = pos.y - this.nodeStartY;
        }
    }

    nodeMouseUp($event, node) {
        console.log("nodeMouseUp:", $event, node);
        event.stopPropagation();    // Don't continue event
        event.preventDefault();

        this.el.nativeElement.removeEventListener('mousemove', this.mouseMoveHandler);
        this.el.nativeElement.removeEventListener('mouseup', this.mouseUpHandler);

        this.dragging = false;
    }

    findNode(nodeName, inputName) {
        for (var i = 0; i < this.flow.nodes.length; i++) {
            var node = this.flow.nodes[i];
            if(node.name == nodeName) {
                for (var j = 0; j < node.inputs.length; j++) {
                    if(node.inputs[j].name == inputName) return [node, j];
                    //else return [node, 0];
                } 
            }
        } 
        return [null,0];
    }

    getConnectionPath(node, out, connection, i) {
        console.log(node, out);
        // Insert *ref to det input to use
        if(!connection.iRef){
            var inp = this.findNode(connection.node, connection.in);
            connection.iRef = inp[0];
            connection.iIdx = inp[1];
        }

        var iNode = connection.iRef;
        var iIdx = connection.iIdx;
        var d =  "M " + (node.x + node.width) +       "," + (node.y + 35 + i * 25) +
                " C " + (node.x + node.width + 50) + "," + (node.y + 35 + i * 25) + 
                " " + (iNode.x - 50) + "," + (iNode.y + 35 + iIdx * 25) +
                " " + (iNode.x) + "," + (iNode.y + 35 + iIdx * 25);
        return d;
    }
}