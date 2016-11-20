import { Component, ElementRef } from '@angular/core';

@Component( {
    selector: "ariflowdesigner",
    styleUrls: ['app/flowdesigner.component.css'],
    templateUrl: 'app/flowdesigner.component.html'//,
    //directives: [ ContextMenuComponent ]
})
export class FlowDesignerComponent { 
    flow:any = {
        nodes: [
            {name: "Node 1", x: 50, y: 50, width: 200,
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
            {name: "Node 2", x: 300, y: 75, width: 150,
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

    _contextMenu = [
        {name: "Add object"},
        {name: "Paste object"},
        {name:"Add constant"},
        {name:"Add sub-object input"},
        {name:"Add sub-object output"}
    ];

    _typeGroups = [
        {
            group:"Logic", 
            types: [
                {name: "AND"},
                {name: "OR"},
                {name: "NOT"},
                {name: "XOR"}
            ]
        },
        {
            group:"Math", 
            types: [
                {name: "Add"},
                {name: "Sub"},
                {name: "Div"},
                {name: "Mul"},
                {name: "Min"},
                {name: "Max"}
            ]
        },
        {
            group:"Time", 
            types: [
                {name: "Ticker"},
                {name: "Timer"},
                {name: "Delay"},
                {name: "Trigger"},
                {name: "Min"},
                {name: "Max"}
            ]
        }
    ]; 
    
    el: ElementRef;
    nodeStartX: number;
    nodeStartY: number;
    dragging: boolean = false;
    dragginNode: any = null;
    mouseMoveHandler: MouseEvent;
    mouseUpHandler: any;
    selectedNode: any = null;
    newConnectionFromOutput: boolean;
    newConnectionStartNode: any;
    newConnectionStartxPutIndex: any;

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

    //************************************************************************* 
    // Helpers
    //*************************************************************************
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

    //************************************************************************* 
    // Pointer handlers
    //*************************************************************************
    svgMouseDown(event: MouseEvent){
        console.log("svgMouseDown!");
        this.selectedNode = null;
        
        /*if(event.button == 2) { // Right mouse button... TODO: Support sheep :O)
            this.flow._menu = this._menu;
            var pos = this.cursorPoint(event);
            this._menu.posX = pos.x;
            this._menu.posY = pos.y;
            event.preventDefault();
            event.stopPropagation();    // Don't continue event
        }*/
        //event.stopPropagation();
    }
    
    svgMouseMove(event) {
        if(this.flow._newConnection){
            // A new connection is being drawn.
            var pos = this.cursorPoint(event);
            this.flow._newConnection.x2 = pos.x;
            this.flow._newConnection.y2 = pos.y;
        }
    }

    svgMouseUp(event: MouseEvent){
        console.log("svgMouseUp!");
        if(this.flow._newConnection){
            delete this.flow._newConnection;
            event.stopPropagation();    // Prevent parent thinking it was mousUp'd (click)
        }

        /*if(event.button == 2) { // Right mouse button... TODO: Support sheep :O)
            delete this.flow._menu;
        }*/

        
        //event.preventDefault();
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
            //console.log("nodeMouseMove:", event);
            var pos = this.cursorPoint(event);
            this.dragginNode.x = pos.x - this.nodeStartX;
            this.dragginNode.y = pos.y - this.nodeStartY;
            if(true) {  // if using grid alignment...
                this.dragginNode.x = this.dragginNode.x - (this.dragginNode.x % 10);
                this.dragginNode.y = this.dragginNode.y - (this.dragginNode.y % 10);
            }
        }
    }

    nodeMouseUp($event, node) {
        console.log("nodeMouseUp:", $event, node);
        event.stopPropagation();    // Don't continue event
        event.preventDefault();

        this.el.nativeElement.removeEventListener('mousemove', this.mouseMoveHandler);
        this.el.nativeElement.removeEventListener('mouseup', this.mouseUpHandler);
        
        if(this.dragging){
            this.dragging = false;
        }
    }

    nodeClick(event: MouseEvent, node){
        event.stopPropagation();
        //event.preventDefault();
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
        //console.log(node, out);
        // Insert *ref to det input to use
        if(!connection.iRef){
            var inp = this.findNode(connection.node, connection.in);
            connection.iRef = inp[0];
            connection.iIdx = inp[1];
        }

        var iNode = connection.iRef;
        var iIdx = connection.iIdx;
        var d =  "M " + (node.x + node.width + 10) +       "," + (node.y + 35 + i * 25) +
                " C " + (node.x + node.width + 10 + 50) + "," + (node.y + 35 + i * 25) + 
                " " + (iNode.x - 10 - 50) + "," + (iNode.y + 35 + iIdx * 25) +
                " " + (iNode.x - 10) + "," + (iNode.y + 35 + iIdx * 25);
        return d;
    }

    getNewConnectionPath(x1, y1, x2, y2) {
        var tangent;
        if(this.newConnectionFromOutput) tangent = 50;
        else tangent = -50;
        var d =  "M " + (x1) +      "," + (y1) +
                " C " + (x1 + tangent) + "," + (y1) + 
                " "   + (x2 - tangent) + "," + (y2) +
                " "   + (x2) +      "," + (y2);
        return d; 
    }

    inputMouseDown(node, i) {
        console.log("inputMouseDown!");
        this.newConnectionFromOutput = false;
        this.newConnectionStartNode = node;
        this.newConnectionStartxPutIndex = i;
        this.flow._newConnection = {
            x1: node.x - 10, 
            y1: node.y + 35 + i * 25,
            x2: node.x - 10,
            y2: node.y + 35 + i * 25
        };
        event.stopPropagation();    // Don't continue event
        event.preventDefault();
    }

    outputMouseDown(node, i) {
        console.log("outputMouseDown!");
        this.newConnectionFromOutput = true;
        this.newConnectionStartNode = node;
        this.newConnectionStartxPutIndex = i;
        this.flow._newConnection = {
            x1: node.x + node.width + 10, 
            y1: node.y + 35 + i * 25,
            x2: node.x + node.width + 10,
            y2: node.y + 35 + i * 25
        };
        event.stopPropagation();    // Don't continue event
        event.preventDefault();
    }

    inputMouseUp(node, i) {
        console.log("inputMouseUp!");
        if(this.flow._newConnection && this.newConnectionFromOutput){
            console.log("Make new connection from", this.newConnectionStartNode.name, this.newConnectionStartxPutIndex, "to", node.name, i);
            if(!this.newConnectionStartNode.outputs[this.newConnectionStartxPutIndex].connect) this.newConnectionStartNode.outputs[this.newConnectionStartxPutIndex].connect = [];
            this.newConnectionStartNode.outputs[this.newConnectionStartxPutIndex].connect.push({node: node.name, in: node.inputs[i].name});
            delete this.flow._newConnection;
        }
        event.stopPropagation();
    }

    outputMouseUp(node, i) {
        console.log("outputMouseUp!");
        if(this.flow._newConnection && !this.newConnectionFromOutput){
            console.log("Make new connection from", this.newConnectionStartNode.name, this.newConnectionStartxPutIndex, "to", node.name, i);
            if(!node.outputs[i].connect) node.outputs[i].connect = [];
            node.outputs[i].connect.push({node: this.newConnectionStartNode.name, in: this.newConnectionStartNode.inputs[this.newConnectionStartxPutIndex].name});
            delete this.flow._newConnection;
        }
        event.stopPropagation();
    }

    connectionMouseDown(node, out, oi, i, $event) {
        // Select connection.
    }
    
    svgKeyDown(event){
        console.log("KeyDown:", event);
        if(event.key == "Delete") {

        }
    }

    menuSelected({path: path, event: event, item: item}) {
        console.log("Menu selected:", path);
        var path = path.split("->");
        console.log(path);
        var pos = this.cursorPoint(event);
        if(path[0] == "Add object") {
            this.flow.nodes.push({
                name: item.className, x: pos.x, y: pos.y, width: 200,
                inputs: [
                    {name: "Input_1"}, 
                    {name: "I_2"}, 
                    {name: "I_3"}
                ],
                outputs: [
                    {name: "O_1"}
                ]
            });
        }
    }


    // TODO:
    // Select and delete connections
    // Select and delete nodes
    // Zooming of work area
    // Menu
    // Add node from  Menu
}