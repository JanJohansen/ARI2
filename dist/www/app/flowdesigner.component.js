"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var core_1 = require('@angular/core');
var FlowDesignerComponent = (function () {
    function FlowDesignerComponent(el) {
        this.flow = {
            nodes: [
                { name: "Node 1", x: 50, y: 50, width: 200,
                    inputs: [
                        { name: "Input_1" },
                        { name: "I_2" },
                        { name: "I_3" }
                    ],
                    outputs: [
                        {
                            name: "O_1",
                            connect: [
                                {
                                    node: "Node 2",
                                    in: "I_1"
                                },
                                {
                                    node: "Node 2",
                                    in: "I_2"
                                }
                            ]
                        }
                    ]
                },
                { name: "Node 2", x: 300, y: 75, width: 150,
                    inputs: [
                        { name: "I_1" },
                        { name: "I_2" }
                    ],
                    outputs: [
                        { name: "O_1" }
                    ]
                }
            ]
        };
        this._contextMenu = [
            { name: "Add object" },
            { name: "Paste object" },
            { name: "Add constant" },
            { name: "Add sub-object input" },
            { name: "Add sub-object output" }
        ];
        this._typeGroups = [
            {
                group: "Logic",
                types: [
                    { name: "AND" },
                    { name: "OR" },
                    { name: "NOT" },
                    { name: "XOR" }
                ]
            },
            {
                group: "Math",
                types: [
                    { name: "Add" },
                    { name: "Sub" },
                    { name: "Div" },
                    { name: "Mul" },
                    { name: "Min" },
                    { name: "Max" }
                ]
            },
            {
                group: "Time",
                types: [
                    { name: "Ticker" },
                    { name: "Timer" },
                    { name: "Delay" },
                    { name: "Trigger" },
                    { name: "Min" },
                    { name: "Max" }
                ]
            }
        ];
        this.dragging = false;
        this.dragginNode = null;
        this.selectedNode = null;
        this.el = el;
        this.mouseMoveHandler = this.nodeMouseMove.bind(this);
        this.mouseUpHandler = this.nodeMouseUp.bind(this);
    }
    FlowDesignerComponent.prototype.logJSON = function (o) {
        console.log(o);
    };
    // Utility function calculating max of input and output count.
    FlowDesignerComponent.prototype.maxIOs = function (node) {
        //return 3;
        if (node.inputs.length > node.outputs.length)
            return node.inputs.length;
        else
            return node.outputs.length;
    };
    FlowDesignerComponent.prototype.nodeSelected = function (node) {
        if (node == this.selectedNode)
            return true;
        else
            return false;
    };
    //************************************************************************* 
    // Helpers
    //*************************************************************************
    // Get point in global SVG space
    FlowDesignerComponent.prototype.cursorPoint = function (evt) {
        //        var pt = evt.target.farthestViewportElement.createSVGPoint();
        var pt = this.el.nativeElement.firstElementChild.createSVGPoint();
        pt.x = evt.clientX;
        pt.y = evt.clientY;
        //var ctm = evt.target.farthestViewportElement.getScreenCTM();
        var ctm = this.el.nativeElement.firstElementChild.getScreenCTM();
        return pt.matrixTransform(ctm.inverse());
    };
    //************************************************************************* 
    // Pointer handlers
    //*************************************************************************
    FlowDesignerComponent.prototype.svgMouseDown = function (event) {
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
    };
    FlowDesignerComponent.prototype.svgMouseMove = function (event) {
        if (this.flow._newConnection) {
            // A new connection is being drawn.
            var pos = this.cursorPoint(event);
            this.flow._newConnection.x2 = pos.x;
            this.flow._newConnection.y2 = pos.y;
        }
    };
    FlowDesignerComponent.prototype.svgMouseUp = function (event) {
        console.log("svgMouseUp!");
        if (this.flow._newConnection) {
            delete this.flow._newConnection;
            event.stopPropagation(); // Prevent parent thinking it was mousUp'd (click)
        }
        /*if(event.button == 2) { // Right mouse button... TODO: Support sheep :O)
            delete this.flow._menu;
        }*/
        //event.preventDefault();
    };
    FlowDesignerComponent.prototype.nodeMouseDown = function ($event, node) {
        console.log("nodeMouseDown:", $event, node);
        event.preventDefault();
        event.stopPropagation(); // Don't continue event
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
    };
    //@HostListener('document:mousemove', ['$event']) onMousemove(event) {
    FlowDesignerComponent.prototype.nodeMouseMove = function (event) {
        if (this.dragging) {
            //console.log("nodeMouseMove:", event);
            var pos = this.cursorPoint(event);
            this.dragginNode.x = pos.x - this.nodeStartX;
            this.dragginNode.y = pos.y - this.nodeStartY;
            if (true) {
                this.dragginNode.x = this.dragginNode.x - (this.dragginNode.x % 10);
                this.dragginNode.y = this.dragginNode.y - (this.dragginNode.y % 10);
            }
        }
    };
    FlowDesignerComponent.prototype.nodeMouseUp = function ($event, node) {
        console.log("nodeMouseUp:", $event, node);
        event.stopPropagation(); // Don't continue event
        event.preventDefault();
        this.el.nativeElement.removeEventListener('mousemove', this.mouseMoveHandler);
        this.el.nativeElement.removeEventListener('mouseup', this.mouseUpHandler);
        if (this.dragging) {
            this.dragging = false;
        }
    };
    FlowDesignerComponent.prototype.nodeClick = function (event, node) {
        event.stopPropagation();
        //event.preventDefault();
    };
    FlowDesignerComponent.prototype.findNode = function (nodeName, inputName) {
        for (var i = 0; i < this.flow.nodes.length; i++) {
            var node = this.flow.nodes[i];
            if (node.name == nodeName) {
                for (var j = 0; j < node.inputs.length; j++) {
                    if (node.inputs[j].name == inputName)
                        return [node, j];
                }
            }
        }
        return [null, 0];
    };
    FlowDesignerComponent.prototype.getConnectionPath = function (node, out, connection, i) {
        //console.log(node, out);
        // Insert *ref to det input to use
        if (!connection.iRef) {
            var inp = this.findNode(connection.node, connection.in);
            connection.iRef = inp[0];
            connection.iIdx = inp[1];
        }
        var iNode = connection.iRef;
        var iIdx = connection.iIdx;
        var d = "M " + (node.x + node.width + 10) + "," + (node.y + 35 + i * 25) +
            " C " + (node.x + node.width + 10 + 50) + "," + (node.y + 35 + i * 25) +
            " " + (iNode.x - 10 - 50) + "," + (iNode.y + 35 + iIdx * 25) +
            " " + (iNode.x - 10) + "," + (iNode.y + 35 + iIdx * 25);
        return d;
    };
    FlowDesignerComponent.prototype.getNewConnectionPath = function (x1, y1, x2, y2) {
        var tangent;
        if (this.newConnectionFromOutput)
            tangent = 50;
        else
            tangent = -50;
        var d = "M " + (x1) + "," + (y1) +
            " C " + (x1 + tangent) + "," + (y1) +
            " " + (x2 - tangent) + "," + (y2) +
            " " + (x2) + "," + (y2);
        return d;
    };
    FlowDesignerComponent.prototype.inputMouseDown = function (node, i) {
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
        event.stopPropagation(); // Don't continue event
        event.preventDefault();
    };
    FlowDesignerComponent.prototype.outputMouseDown = function (node, i) {
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
        event.stopPropagation(); // Don't continue event
        event.preventDefault();
    };
    FlowDesignerComponent.prototype.inputMouseUp = function (node, i) {
        console.log("inputMouseUp!");
        if (this.flow._newConnection && this.newConnectionFromOutput) {
            console.log("Make new connection from", this.newConnectionStartNode.name, this.newConnectionStartxPutIndex, "to", node.name, i);
            if (!this.newConnectionStartNode.outputs[this.newConnectionStartxPutIndex].connect)
                this.newConnectionStartNode.outputs[this.newConnectionStartxPutIndex].connect = [];
            this.newConnectionStartNode.outputs[this.newConnectionStartxPutIndex].connect.push({ node: node.name, in: node.inputs[i].name });
            delete this.flow._newConnection;
        }
        event.stopPropagation();
    };
    FlowDesignerComponent.prototype.outputMouseUp = function (node, i) {
        console.log("outputMouseUp!");
        if (this.flow._newConnection && !this.newConnectionFromOutput) {
            console.log("Make new connection from", this.newConnectionStartNode.name, this.newConnectionStartxPutIndex, "to", node.name, i);
            if (!node.outputs[i].connect)
                node.outputs[i].connect = [];
            node.outputs[i].connect.push({ node: this.newConnectionStartNode.name, in: this.newConnectionStartNode.inputs[this.newConnectionStartxPutIndex].name });
            delete this.flow._newConnection;
        }
        event.stopPropagation();
    };
    FlowDesignerComponent.prototype.connectionMouseDown = function (node, out, oi, i, $event) {
        // Select connection.
    };
    FlowDesignerComponent.prototype.svgKeyDown = function (event) {
        console.log("KeyDown:", event);
        if (event.key == "Delete") {
        }
    };
    FlowDesignerComponent.prototype.menuSelected = function (_a) {
        var path = _a.path, event = _a.event, item = _a.item;
        console.log("Menu selected:", path);
        var path = path.split("->");
        console.log(path);
        var pos = this.cursorPoint(event);
        if (path[0] == "Add object") {
            this.flow.nodes.push({
                name: item.className, x: pos.x, y: pos.y, width: 200,
                inputs: [
                    { name: "Input_1" },
                    { name: "I_2" },
                    { name: "I_3" }
                ],
                outputs: [
                    { name: "O_1" }
                ]
            });
        }
    };
    FlowDesignerComponent = __decorate([
        core_1.Component({
            selector: "ariflowdesigner",
            styleUrls: ['app/flowdesigner.component.css'],
            templateUrl: 'app/flowdesigner.component.html' //,
        }), 
        __metadata('design:paramtypes', [core_1.ElementRef])
    ], FlowDesignerComponent);
    return FlowDesignerComponent;
}());
exports.FlowDesignerComponent = FlowDesignerComponent;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/www/app/flowdesigner.component.js.map