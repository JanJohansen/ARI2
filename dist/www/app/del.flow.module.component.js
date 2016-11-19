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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var core_1 = require('@angular/core');
var platform_browser_1 = require('@angular/platform-browser');
var CircleComponent = (function () {
    function CircleComponent(document, el) {
        this.document = document;
        this.dragging = false;
        this._doc = document;
        this.el = el;
        this.self = this;
        // save the click handler so it can be used in multiple places. Bind to this, to acces class variables!
        this.mouseMoveHandler = this.nodeMouseMove.bind(this);
        //this.element = element;
        //this.element.nativeElement.style.cursor = 'pointer';    // Cursor type
        //console.log("Element:", this.element);
        //this.node.x = 5;
    }
    CircleComponent.prototype.ngAfterViewInit = function () {
        var hostElem = this.el.nativeElement;
        this.parentEl = hostElem.parentNode;
        //console.log("Children:", hostElem.children);
        console.log("Parent:", hostElem.parentNode);
    };
    CircleComponent.prototype.debug = function (x) {
        console.log(x);
    };
    CircleComponent.prototype.nodeMouseDown = function ($event, node) {
        console.log($event, node);
        event.stopPropagation(); // Don't continue event
        this.startX = $event.offsetX;
        this.startY = $event.offsetY;
        this.dragging = true;
        this.parentEl.addEventListener('mousemove', this.mouseMoveHandler);
        //this._doc.body.addEventListener('mousemove', this.mouseMoveHandler);
        //this.element.nativeElement.style.x = "5";
    };
    //@HostListener('document:mousemove', ['$event']) onMousemove(event) {
    CircleComponent.prototype.nodeMouseMove = function (event) {
        if (this.dragging) {
            console.log("mouseMove:", event);
            event.stopPropagation(); // Don't continue event
        }
    };
    CircleComponent.prototype.nodeMouseUp = function ($event, node) {
        console.log($event, node);
        event.stopPropagation(); // Don't continue event
        this.parentEl.removeEventListener('mousemove', this.mouseMoveHandler);
        //this._doc.body.removeEventListener('mousemove', this.mouseMoveHandler);
        this.dragging = false;
    };
    CircleComponent.prototype.inputMouseDown = function ($event, input) {
        console.log($event, input);
        event.stopPropagation(); // Don't continue event
    };
    CircleComponent.prototype.outputMouseDown = function ($event, output) {
        console.log($event, output);
        event.stopPropagation(); // Don't continue event
    };
    CircleComponent.prototype.maxIOs = function () {
        //return 3;
        if (this.node.inputs.length > this.node.outputs.length)
            return this.node.inputs.length;
        else
            return this.node.outputs.length;
    };
    __decorate([
        core_1.Input(), 
        __metadata('design:type', Object)
    ], CircleComponent.prototype, "node", void 0);
    CircleComponent = __decorate([
        core_1.Component({
            selector: '[mb-circle]',
            //inputs: ['node'],
            // TODO: Autocalculate the width based on text sizes... Not too easy though!
            template: "\n        <svg:g \n            (mousedown)=\"nodeMouseDown($event, node)\"\n            (mouseup)=\"nodeMouseUp($event)\"\n            [attr.transform]=\"'translate(' + node.x + ',' + node.y + ')'\"\n        >\n            <svg:rect \n                [attr.class]=\"node.selected && 'selected-node-rect' || (node == mouseOverNode && 'mouseover-node-rect' || 'node-rect')\"\n                ry=\"5\" \n                rx=\"5\" \n                x=\"0\" \n                y=\"0\" \n                [attr.width]=\"node.width\" \n                [attr.height]=\"maxIOs() * 25 + 30\" \n                fill=\"url(#nodeBackgroundGradient)\" \n            />\n\n            <svg:text\n                class=\"node-name-text\"\n                [attr.x]=\"node.width/2\"\n                y=\"10\"\n                text-anchor=\"middle\"\n                alignment-baseline=\"middle\"\n            >\n                {{node.name}} - {{node.inputs.length}}\n            </svg:text>\n\n            <svg:g *ngFor=\"let input of node.inputs; let i=index\"\n                (mousedown)=\"inputMouseDown($event, input)\"\n            >\n                <svg:circle\n                    [attr.class]=\"connector == mouseOverConnector && 'mouseover-connector-circle' || 'connector-circle'\"\n                    r=10 \n                    cx=0\n                    [attr.cy]=\"35 + i * 25\"\n                />\n                <svg:text \n                    dominant-baseline=\"central\"\n                    x=15\n                    [attr.y]=35+i*25\n                >\n                    {{input.name}}\n                </svg:text>\n            </svg:g>\n\n            <svg:g *ngFor=\"let output of node.outputs; let i=index\"\n                (mousedown)=\"outputMouseDown($event, output)\"\n            >\n                <svg:circle\n                    [attr.class]=\"connector == mouseOverConnector && 'mouseover-connector-circle' || 'connector-circle'\"\n                    r=10 \n                    [attr.cx]=\"node.width\"\n                    [attr.cy]=\"35 + i * 25\"\n                />\n                <svg:text \n                    dominant-baseline=\"central\"\n                    text-anchor=\"end\"\n                    [attr.x]=\"node.width - 15\"\n                    [attr.y]=35+i*25\n                >\n                    {{output.name}}\n                </svg:text>\n            </svg:g>\n\n        </svg:g>\n    ",
            styles: ["\n        .node-rect {\n\t        stroke: black;\n\t        stroke-width: 1;\n            cursor: pointer;\n        }\n\n        .node-name-text {\n            font-weight: bold; \n            fill: blue;\n            text-decoration: underline;\n        }\n\n        .mouseover-node-rect {\n            stroke: black;\n            stroke-width: 4;\n        }\n\n        .selected-node-rect {\n            stroke: red;\n            stroke-width: 3;\n        }\n\n        .connector-circle {\n            fill: white;\n            stroke: black;\n            stroke-width: 1;\n        }\n\n        .mouseover-connector-circle {\n            fill: white;\n            stroke: black;\n            stroke-width: 3;\n        }\n    "]
        }),
        __param(0, core_1.Inject(platform_browser_1.DOCUMENT)), 
        __metadata('design:paramtypes', [Object, core_1.ElementRef])
    ], CircleComponent);
    return CircleComponent;
}());
exports.CircleComponent = CircleComponent;
//# sourceMappingURL=C:/Users/Jan/Desktop/ARI2_Test/dist/www/app/del.flow.module.component.js.map