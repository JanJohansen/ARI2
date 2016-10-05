import { Component, Input, HostListener, Inject, ElementRef, AfterViewInit } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';

@Component({
    selector: '[mb-circle]',
    //inputs: ['node'],
    // TODO: Autocalculate the width based on text sizes... Not too easy though!
    template: `
        <svg:g 
            (mousedown)="nodeMouseDown($event, node)"
            (mouseup)="nodeMouseUp($event)"
            [attr.transform]="'translate(' + node.x + ',' + node.y + ')'"
        >
            <svg:rect 
                [attr.class]="node.selected && 'selected-node-rect' || (node == mouseOverNode && 'mouseover-node-rect' || 'node-rect')"
                ry="5" 
                rx="5" 
                x="0" 
                y="0" 
                [attr.width]="node.width" 
                [attr.height]="maxIOs() * 25 + 30" 
                fill="url(#nodeBackgroundGradient)" 
            />

            <svg:text
                class="node-name-text"
                [attr.x]="node.width/2"
                y="10"
                text-anchor="middle"
                alignment-baseline="middle"
            >
                {{node.name}} - {{node.inputs.length}}
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
    `,
    styles: [`
        .node-rect {
	        stroke: black;
	        stroke-width: 1;
            cursor: pointer;
        }

        .node-name-text {
            font-weight: bold; 
            fill: blue;
            text-decoration: underline;
        }

        .mouseover-node-rect {
            stroke: black;
            stroke-width: 4;
        }

        .selected-node-rect {
            stroke: red;
            stroke-width: 3;
        }

        .connector-circle {
            fill: white;
            stroke: black;
            stroke-width: 1;
        }

        .mouseover-connector-circle {
            fill: white;
            stroke: black;
            stroke-width: 3;
        }
    `]
})
export class CircleComponent implements AfterViewInit {
//    element: ElementRef;
    @Input() node: any; 
    startX: number;
    startY: number;
    dragging: boolean = false;
    _doc: HTMLDocument;
    self: CircleComponent;
    mouseMoveHandler: any;
    el: ElementRef;
    parentEl: any;

    constructor(@Inject(DOCUMENT) private document: any, el: ElementRef) {//element: ElementRef) {
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

    ngAfterViewInit() {
        const hostElem = this.el.nativeElement;
        this.parentEl = hostElem.parentNode;
        //console.log("Children:", hostElem.children);
        
        console.log("Parent:", hostElem.parentNode);
    }

    debug(x){
        console.log(x);
    }

    nodeMouseDown($event, node) {
        console.log($event, node);
        event.stopPropagation();    // Don't continue event

        this.startX = $event.offsetX;
        this.startY = $event.offsetY;
        this.dragging = true;

        this.parentEl.addEventListener('mousemove', this.mouseMoveHandler);
        //this._doc.body.addEventListener('mousemove', this.mouseMoveHandler);
       
        //this.element.nativeElement.style.x = "5";
    }
    
    //@HostListener('document:mousemove', ['$event']) onMousemove(event) {
    nodeMouseMove(event: Event) {
        if(this.dragging){
            console.log("mouseMove:", event);
            event.stopPropagation();    // Don't continue event

            //this.node.x = event.x;
        }
    }

    nodeMouseUp($event, node) {
        console.log($event, node);
        event.stopPropagation();    // Don't continue event

        this.parentEl.removeEventListener('mousemove', this.mouseMoveHandler);
        //this._doc.body.removeEventListener('mousemove', this.mouseMoveHandler);

        this.dragging = false;
    }


    inputMouseDown($event, input) {
        console.log($event, input);
        event.stopPropagation();    // Don't continue event
    }

    outputMouseDown($event, output) {
        console.log($event, output);
        event.stopPropagation();    // Don't continue event
    }

    maxIOs() {
        //return 3;
        if(this.node.inputs.length > this.node.outputs.length) return this.node.inputs.length;
        else return this.node.outputs.length;
    }
}